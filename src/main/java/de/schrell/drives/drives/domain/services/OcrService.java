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
import java.util.Comparator;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrService {

    private static final Pattern DIGITS = Pattern.compile("(\\d{3,})");

    private final OcrProperties properties;

    @jakarta.annotation.PostConstruct
    void configureNativeLibraryPath() {
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

        BufferedImage image = readImage(photo);
        BufferedImage prepared = preprocess(image);
        String text = doOcr(prepared);
        log.info("Extracted text from image: {}", text);
        return extractBestNumber(text)
                .orElseThrow(() -> new IllegalArgumentException("Kein KM-Stand im Foto gefunden"));
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
        ITesseract tesseract = new Tesseract();
        tesseract.setDatapath(properties.getTesseractPath());
        tesseract.setLanguage(properties.getLanguage());
        tesseract.setTessVariable("tessedit_char_whitelist", "0123456789");
        tesseract.setTessVariable("classify_bln_numeric_mode", "1");
        tesseract.setTessVariable("load_system_dawg", "0");
        tesseract.setTessVariable("load_freq_dawg", "0");
        tesseract.setTessVariable("user_defined_dpi", "300");
        tesseract.setPageSegMode(TessAPI.TessPageSegMode.PSM_SINGLE_LINE);
        tesseract.setOcrEngineMode(TessAPI.TessOcrEngineMode.OEM_LSTM_ONLY);
        try {
            return tesseract.doOCR(image);
        } catch (TesseractException e) {
            throw new IllegalArgumentException("OCR fehlgeschlagen", e);
        }
    }

    private BufferedImage preprocess(BufferedImage source) {
        BufferedImage resized = resizeForSpeed(source, properties.getMaxWidth());
        BufferedImage cropped = findWhiteTextRoi(resized)
                .orElseGet(() -> centerBandCrop(
                        resized,
                        properties.getCropWidthRatio(),
                        properties.getCropHeightRatio(),
                        properties.getCropMinHeight()
                ));
        BufferedImage gray = toGrayscale(cropped);
        int threshold = otsuThreshold(gray);
        BufferedImage binarized = binarize(gray, threshold);
        return ensureBlackTextOnWhite(binarized);
    }

    private BufferedImage resizeForSpeed(BufferedImage source, int maxWidth) {
        int width = source.getWidth();
        int height = source.getHeight();
        if (width <= maxWidth) {
            return source;
        }
        double scale = (double) maxWidth / width;
        int targetWidth = maxWidth;
        int targetHeight = (int) Math.round(height * scale);
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        g2d.dispose();
        return resized;
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
}
