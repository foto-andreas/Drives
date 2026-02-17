package de.schrell.drives.drives.domain.services;

import com.sun.jna.NativeLibrary;
import de.schrell.drives.config.OcrProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.TessAPI;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrService {

    private static final Pattern DIGITS = Pattern.compile("(\\d{3,})");
    private static final int MIN_ROI_DIMENSION = 3;
    private static final double MIN_ROI_RATIO = 0.05;
    private static final double CLI_LIKE_CROP_TOP_RATIO = 0.25;
    private static final double CLI_LIKE_CROP_HEIGHT_RATIO = 0.6;
    private static final double PREPROCESS_CONTRAST = 1.0;
    private static final int PREPROCESS_BRIGHTNESS = 5;
    private static final int SHADOW_DILATE_SIZE = 7;
    private static final int SHADOW_MEDIAN_SIZE = 21;
    private static final int SHADOW_MAX_WIDTH = 600;

    private final OcrProperties properties;

    @jakarta.annotation.PostConstruct
    void configureNativeLibraryPath() {
        String envTessPath = System.getenv("TESSERACT_PATH");
        String envOcrLibraryPath = System.getenv("OCR_LIBRARY_PATH");
        String envAppOcrPath = System.getenv("APP_OCR_TESSERACT_PATH");
        log.info("OCR env TESSERACT_PATH='{}', APP_OCR_TESSERACT_PATH='{}', OCR_LIBRARY_PATH='{}'",
                envTessPath, envAppOcrPath, envOcrLibraryPath);

        String tessPath = properties.getTesseractPath();
        if (tessPath == null || tessPath.isBlank()) {
            log.warn("OCR tessdata path is blank. Set app.ocr.tesseract-path or TESSERACT_PATH.");
        } else {
            Path tessDir = Paths.get(tessPath);
            boolean exists = Files.exists(tessDir);
            boolean directory = Files.isDirectory(tessDir);
            log.info("OCR tessdata path: {} (exists={}, directory={})", tessPath, exists, directory);
            if (exists && directory) {
                String language = properties.getLanguage();
                if (language != null && !language.isBlank()) {
                    String[] languages = language.split("\\+");
                    boolean missing = false;
                    for (String lang : languages) {
                        String trimmed = lang.trim();
                        if (trimmed.isEmpty()) {
                            continue;
                        }
                        Path trainedData = tessDir.resolve(trimmed + ".traineddata");
                        boolean present = Files.exists(trainedData);
                        log.info("OCR traineddata {}: {}", trainedData.getFileName(), present ? "present" : "missing");
                        if (!present) {
                            missing = true;
                        }
                    }
                    if (missing) {
                        log.warn("OCR traineddata files missing for language(s): {}", language);
                    }
                }
            } else {
                log.warn("OCR tessdata path does not exist or is not a directory.");
            }
        }

        String libraryPath = properties.getLibraryPath();
        if (libraryPath == null || libraryPath.isBlank()) {
            return;
        }
        String trimmed = libraryPath.trim();
        System.setProperty("jna.library.path", trimmed);
        try {
            NativeLibrary.addSearchPath("tesseract", trimmed);
            NativeLibrary.addSearchPath("lept", trimmed);
        } catch (UnsatisfiedLinkError | NoClassDefFoundError ignored) {
            // Ignore: JNA might not be available yet; System property still helps.
        }
    }

    public int extractKmStand(MultipartFile photo) {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("Foto fehlt oder ist leer");
        }

        String debugId = null;
        Optional<Path> debugDir = Optional.empty();
        try {
            debugId = UUID.randomUUID().toString();
            debugDir = prepareDebugDir(debugId);
            BufferedImage image = readImage(photo);
            writeDebugImage(debugDir, "01-original", image);

            BufferedImage cliLike = cropForCliLike(resizeForSpeed(image, properties.getMaxWidth()));
            writeDebugImage(debugDir, "02-cli-like", cliLike);
            String cliText = doOcrCliLike(cliLike);
            log.info("OCR CLI-like result: {}", cliText);
            writeDebugText(debugDir, "ocr-cli-like.txt", cliText);
            Optional<Integer> cli = extractBestNumber(cliText);
            if (!isSuspiciousOcrResult(cliText, cli)) {
                return cli.get();
            }

            log.warn("OCR CLI-like result suspicious (value={}, text='{}'), retrying with prepared preprocessing",
                    cli.orElse(null), cliText);
            BufferedImage prepared = preprocess(image);
            writeDebugImage(debugDir, "03-prepared", prepared);
            String text = doOcr(prepared);
            log.info("OCR primary result: {}", text);
            writeDebugText(debugDir, "ocr-primary.txt", text);
            Optional<Integer> primary = extractBestNumber(text);
            if (!isSuspiciousOcrResult(text, primary)) {
                return primary.get();
            }

            log.warn("OCR primary result suspicious (value={}, text='{}'), retrying with relaxed preprocessing",
                    primary.orElse(null), text);
            BufferedImage relaxed = preprocessRelaxed(image);
            writeDebugImage(debugDir, "04-relaxed", relaxed);
            String relaxedText = doOcrRelaxed(relaxed);
            log.info("OCR fallback result: {}", relaxedText);
            writeDebugText(debugDir, "ocr-fallback.txt", relaxedText);
            Optional<Integer> fallback = extractBestNumber(relaxedText);
            if (!isSuspiciousOcrResult(relaxedText, fallback)) {
                return fallback.get();
            }

            throw new IllegalArgumentException("Kein KM-Stand im Foto gefunden");
        } finally {
            debugDir = Optional.empty();
            debugId = null;
        }
    }

    private BufferedImage readImage(MultipartFile photo) {
        try {
            BufferedImage image = ImageIO.read(photo.getInputStream());
            if (image == null) {
                throw new IllegalArgumentException("Foto konnte nicht gelesen werden");
            }
            return image;
        } catch (IOException e) {
            throw new IllegalArgumentException("Foto konnte nicht gelesen werden", e);
        }
    }

    private String doOcr(BufferedImage image) {
        return doOcr(image, false);
    }

    private String doOcrRelaxed(BufferedImage image) {
        return doOcr(image, true);
    }

    private String doOcrCliLike(BufferedImage image) {
        return doOcr(image, false, true);
    }

    private String doOcr(BufferedImage image, boolean relaxed) {
        return doOcr(image, relaxed, false);
    }

    private String doOcr(BufferedImage image, boolean relaxed, boolean cliLike) {
        ITesseract tesseract = createTesseract(relaxed, cliLike);
        try {
            return tesseract.doOCR(image);
        } catch (TesseractException e) {
            throw new IllegalArgumentException("OCR fehlgeschlagen", e);
        }
    }

    private ITesseract createTesseract(boolean relaxed, boolean cliLike) {
        ITesseract tesseract = new Tesseract();
        tesseract.setDatapath(properties.getTesseractPath());
        tesseract.setLanguage(properties.getLanguage());
        tesseract.setOcrEngineMode(relaxed || cliLike
                ? TessAPI.TessOcrEngineMode.OEM_DEFAULT
                : TessAPI.TessOcrEngineMode.OEM_LSTM_ONLY);
        if (!relaxed && !cliLike) {
            tesseract.setVariable("user_defined_dpi", "300");
            tesseract.setVariable("tessedit_char_whitelist", "0123456789");
            tesseract.setVariable("classify_bln_numeric_mode", "1");
            tesseract.setVariable("load_system_dawg", "0");
            tesseract.setVariable("load_freq_dawg", "0");
            tesseract.setPageSegMode(TessAPI.TessPageSegMode.PSM_SINGLE_LINE);
        } else if (cliLike) {
            tesseract.setVariable("tessedit_char_whitelist", "0123456789");
            tesseract.setPageSegMode(TessAPI.TessPageSegMode.PSM_SINGLE_LINE);
        } else {
            tesseract.setPageSegMode(TessAPI.TessPageSegMode.PSM_AUTO);
        }
        return tesseract;
    }

    private BufferedImage preprocess(BufferedImage source) {
        BufferedImage resized = resizeForSpeed(source, properties.getMaxWidth());
        BufferedImage cropped = cropForCliLike(resized);
        BufferedImage gray = toGrayscale(cropped);
        BufferedImage adjusted = adjustContrastBrightness(gray, PREPROCESS_CONTRAST, PREPROCESS_BRIGHTNESS);
        BufferedImage normalized = removeShadows(adjusted);
        int threshold = otsuThreshold(normalized);
        BufferedImage binarized = binarize(normalized, threshold);
        return ensureBlackTextOnWhite(binarized);
    }

    private BufferedImage preprocessRelaxed(BufferedImage source) {
        BufferedImage resized = resizeForSpeed(source, properties.getMaxWidth());
        BufferedImage cropped = cropForCliLike(resized);
        BufferedImage gray = toGrayscale(cropped);
        BufferedImage adjusted = adjustContrastBrightness(gray, PREPROCESS_CONTRAST, PREPROCESS_BRIGHTNESS);
        BufferedImage normalized = removeShadows(adjusted);
        return ensureBlackTextOnWhite(normalized);
    }

    private BufferedImage resizeForSpeed(BufferedImage source, int maxWidth) {
        int width = source.getWidth();
        int height = source.getHeight();
        if (width <= maxWidth) {
            return source;
        }
        double scale = (double) maxWidth / width;
        int targetHeight = (int) Math.round(height * scale);
        BufferedImage resized = new BufferedImage(maxWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(source, 0, 0, maxWidth, targetHeight, null);
        g2d.dispose();
        return resized;
    }

    private BufferedImage resize(BufferedImage source, int targetWidth, int targetHeight) {
        int type = source.getType() == 0 ? BufferedImage.TYPE_INT_RGB : source.getType();
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, type);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        g2d.dispose();
        return resized;
    }

    private BufferedImage cropForCliLike(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        int y = (int) Math.round(height * CLI_LIKE_CROP_TOP_RATIO);
        int cropHeight = (int) Math.round(height * CLI_LIKE_CROP_HEIGHT_RATIO);
        if (cropHeight <= 0) {
            cropHeight = height;
        }
        if (y < 0) {
            y = 0;
        }
        if (y + cropHeight > height) {
            cropHeight = height - y;
        }
        if (cropHeight <= 0) {
            return source;
        }
        return source.getSubimage(0, y, width, cropHeight);
    }

    private BufferedImage centerBandCrop(BufferedImage source, double widthRatio, double heightRatio, int minHeight) {
        int width = source.getWidth();
        int height = source.getHeight();
        int cropWidth = Math.max(1, (int) Math.round(width * widthRatio));
        int cropHeight = Math.max(minHeight, (int) Math.round(height * heightRatio));
        if (cropHeight > height) {
            cropHeight = height;
        }
        int x = Math.max(0, (width - cropWidth) / 2);
        int y = Math.max(0, (height - cropHeight) / 2);
        return source.getSubimage(x, y, cropWidth, cropHeight);
    }

    private Optional<BufferedImage> findWhiteTextRoi(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        int minX = width;
        int minY = height;
        int maxX = -1;
        int maxY = -1;
        int count = 0;

        int minBrightness = properties.getWhiteMinBrightness();
        int maxDelta = properties.getWhiteMaxDelta();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = source.getRGB(x, y);
                int r = (rgb >> 16) & 0xff;
                int g = (rgb >> 8) & 0xff;
                int b = rgb & 0xff;
                int max = Math.max(r, Math.max(g, b));
                int min = Math.min(r, Math.min(g, b));
                int delta = max - min;
                int brightness = (r + g + b) / 3;
                if (brightness >= minBrightness && delta <= maxDelta) {
                    count++;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (count < properties.getMinWhitePixels() || maxX < 0 || maxY < 0) {
            return Optional.empty();
        }

        int pad = properties.getRoiPadding();
        int x1 = Math.max(0, minX - pad);
        int y1 = Math.max(0, minY - pad);
        int x2 = Math.min(width - 1, maxX + pad);
        int y2 = Math.min(height - 1, maxY + pad);

        int roiWidth = Math.max(1, x2 - x1 + 1);
        int roiHeight = Math.max(1, y2 - y1 + 1);

        int minWidth = Math.max(MIN_ROI_DIMENSION, (int) Math.round(width * MIN_ROI_RATIO));
        int minHeight = Math.max(MIN_ROI_DIMENSION, (int) Math.round(height * MIN_ROI_RATIO));
        if (roiWidth < minWidth || roiHeight < minHeight) {
            return Optional.empty();
        }

        return Optional.of(source.getSubimage(x1, y1, roiWidth, roiHeight));
    }

    private BufferedImage toGrayscale(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        BufferedImage gray = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g2d = gray.createGraphics();
        g2d.drawImage(source, 0, 0, null);
        g2d.dispose();
        return gray;
    }

    private BufferedImage adjustContrastBrightness(BufferedImage source, double contrast, int brightness) {
        int width = source.getWidth();
        int height = source.getHeight();
        BufferedImage out = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int gray = source.getRGB(x, y) & 0xff;
                int value = clamp((int) Math.round(gray * contrast + brightness));
                int rgb = (value << 16) | (value << 8) | value;
                out.setRGB(x, y, rgb);
            }
        }
        return out;
    }

    private BufferedImage removeShadows(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        int targetWidth = Math.min(width, SHADOW_MAX_WIDTH);
        int targetHeight = Math.max(1, (int) Math.round(height * (targetWidth / (double) width)));
        BufferedImage small = (targetWidth == width && targetHeight == height)
                ? source
                : resize(source, targetWidth, targetHeight);

        int[][] smallGray = toGrayArray(small);
        int[][] dilated = dilateMax(smallGray, SHADOW_DILATE_SIZE);
        int[][] blurred = medianBlur(dilated, SHADOW_MEDIAN_SIZE);
        BufferedImage backgroundSmall = fromGrayArray(blurred);
        BufferedImage background = (backgroundSmall.getWidth() == width && backgroundSmall.getHeight() == height)
                ? backgroundSmall
                : resize(backgroundSmall, width, height);

        int[][] src = toGrayArray(source);
        int[][] bg = toGrayArray(background);
        int[][] diff = new int[height][width];
        int min = 255;
        int max = 0;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int value = 255 - Math.abs(src[y][x] - bg[y][x]);
                diff[y][x] = value;
                if (value < min) {
                    min = value;
                }
                if (value > max) {
                    max = value;
                }
            }
        }
        int range = Math.max(1, max - min);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                diff[y][x] = (diff[y][x] - min) * 255 / range;
            }
        }
        return fromGrayArray(diff);
    }

    private int[][] toGrayArray(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        int[][] gray = new int[height][width];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                gray[y][x] = source.getRGB(x, y) & 0xff;
            }
        }
        return gray;
    }

    private BufferedImage fromGrayArray(int[][] gray) {
        int height = gray.length;
        int width = gray[0].length;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int value = gray[y][x] & 0xff;
                int rgb = (value << 16) | (value << 8) | value;
                image.setRGB(x, y, rgb);
            }
        }
        return image;
    }

    private int[][] dilateMax(int[][] source, int size) {
        int height = source.length;
        int width = source[0].length;
        int radius = size / 2;
        int[][] out = new int[height][width];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int max = 0;
                for (int dy = -radius; dy <= radius; dy++) {
                    int yy = clampIndex(y + dy, height);
                    for (int dx = -radius; dx <= radius; dx++) {
                        int xx = clampIndex(x + dx, width);
                        int value = source[yy][xx];
                        if (value > max) {
                            max = value;
                        }
                    }
                }
                out[y][x] = max;
            }
        }
        return out;
    }

    private int[][] medianBlur(int[][] source, int size) {
        int height = source.length;
        int width = source[0].length;
        int radius = size / 2;
        int[][] out = new int[height][width];
        int windowSize = size * size;
        int[] window = new int[windowSize];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int idx = 0;
                for (int dy = -radius; dy <= radius; dy++) {
                    int yy = clampIndex(y + dy, height);
                    for (int dx = -radius; dx <= radius; dx++) {
                        int xx = clampIndex(x + dx, width);
                        window[idx++] = source[yy][xx];
                    }
                }
                Arrays.sort(window, 0, idx);
                out[y][x] = window[idx / 2];
            }
        }
        return out;
    }

    private int clampIndex(int value, int max) {
        if (value < 0) {
            return 0;
        }
        if (value >= max) {
            return max - 1;
        }
        return value;
    }

    private int clamp(int value) {
        if (value < 0) {
            return 0;
        }
        if (value > 255) {
            return 255;
        }
        return value;
    }

    private BufferedImage binarize(BufferedImage source, int threshold) {
        int width = source.getWidth();
        int height = source.getHeight();
        BufferedImage out = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int gray = source.getRGB(x, y) & 0xff;
                int bin = gray < threshold ? 0 : 255;
                int rgb = (bin << 16) | (bin << 8) | bin;
                out.setRGB(x, y, rgb);
            }
        }
        return out;
    }

    private BufferedImage ensureBlackTextOnWhite(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        int whiteCount = 0;
        int total = width * height;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int gray = source.getRGB(x, y) & 0xff;
                if (gray > 200) {
                    whiteCount++;
                }
            }
        }
        if (whiteCount > total / 2) {
            return source;
        }
        BufferedImage inverted = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int gray = source.getRGB(x, y) & 0xff;
                int inv = 255 - gray;
                int rgb = (inv << 16) | (inv << 8) | inv;
                inverted.setRGB(x, y, rgb);
            }
        }
        return inverted;
    }

    private int otsuThreshold(BufferedImage source) {
        int[] histogram = new int[256];
        int width = source.getWidth();
        int height = source.getHeight();
        int total = width * height;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int gray = source.getRGB(x, y) & 0xff;
                histogram[gray]++;
            }
        }

        double sum = 0.0;
        for (int i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }

        double sumB = 0.0;
        int wB = 0;
        int wF;
        double maxVariance = 0.0;
        int threshold = 128;

        for (int i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB == 0) continue;
            wF = total - wB;
            if (wF == 0) break;

            sumB += (double) i * histogram[i];
            double mB = sumB / wB;
            double mF = (sum - sumB) / wF;

            double varianceBetween = (double) wB * wF * (mB - mF) * (mB - mF);
            if (varianceBetween > maxVariance) {
                maxVariance = varianceBetween;
                threshold = i;
            }
        }
        return threshold;
    }

    private Optional<Integer> extractBestNumber(String text) {
        Matcher matcher = DIGITS.matcher(text);
        return matcher.results()
                .map(match -> match.group(1))
                .max(Comparator.comparingInt(String::length))
                .map(Integer::parseInt);
    }

    private boolean isSuspiciousOcrResult(String text, Optional<Integer> number) {
        if (number.isEmpty()) {
            return true;
        }
        if (number.get() != 0) {
            return false;
        }
        String digitsOnly = text.replaceAll("\\D", "");
        return digitsOnly.length() >= 3 && digitsOnly.chars().allMatch(ch -> ch == '0');
    }

    BufferedImage preprocessForTest(BufferedImage source) {
        return preprocess(source);
    }

    Optional<Integer> extractBestNumberForTest(String text) {
        return extractBestNumber(text);
    }

    boolean isSuspiciousOcrResultForTest(String text, Optional<Integer> number) {
        return isSuspiciousOcrResult(text, number);
    }

    Optional<BufferedImage> findWhiteTextRoiForTest(BufferedImage source) {
        return findWhiteTextRoi(source);
    }

    BufferedImage ensureBlackTextOnWhiteForTest(BufferedImage source) {
        return ensureBlackTextOnWhite(source);
    }

    int otsuThresholdForTest(BufferedImage source) {
        return otsuThreshold(source);
    }


    private Optional<Path> prepareDebugDir(String debugId) {
        if (!properties.isDebugEnabled()) {
            return Optional.empty();
        }
        String baseDir = properties.getDebugOutputDir();
        if (baseDir == null || baseDir.isBlank()) {
            log.warn("OCR debug enabled but debugOutputDir not set");
            return Optional.empty();
        }
        Path dir = Paths.get(baseDir).resolve(debugId);
        try {
            Files.createDirectories(dir);
            return Optional.of(dir);
        } catch (IOException e) {
            log.warn("Failed to create OCR debug directory {}", dir, e);
            return Optional.empty();
        }
    }

    private void writeDebugImage(Optional<Path> dir, String name, BufferedImage image) {
        if (dir.isEmpty() || image == null) {
            return;
        }
        Path target = dir.get().resolve(name + ".png");
        try {
            ImageIO.write(image, "png", target.toFile());
        } catch (IOException e) {
            log.warn("Failed to write OCR debug image {}", target, e);
        }
    }

    private void writeDebugText(Optional<Path> dir, String name, String text) {
        if (dir.isEmpty()) {
            return;
        }
        Path target = dir.get().resolve(name);
        try {
            Files.writeString(target, text == null ? "" : text, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("Failed to write OCR debug text {}", target, e);
        }
    }

}
