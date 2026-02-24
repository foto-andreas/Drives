package de.schrell.drives.drives.domain.services;

import de.schrell.drives.config.OcrProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.MockedConstruction;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import javax.imageio.ImageIO;

import net.sourceforge.tess4j.Tesseract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.isNull;

class OcrServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void extractBestNumberChoosesLongestSequence() {
        OcrService service = new OcrService(new OcrProperties());

        Optional<Integer> result = service.extractBestNumberForTest("abc 123 9999 km 42");

        assertThat(result).contains(9999);
    }

    @Test
    void extractBestNumberReturnsEmptyWhenNoDigits() {
        OcrService service = new OcrService(new OcrProperties());

        Optional<Integer> result = service.extractBestNumberForTest("no digits here");

        assertThat(result).isEmpty();
    }

    @Test
    void isSuspiciousOcrResultReturnsTrueForOnlyZeros() {
        OcrService service = new OcrService(new OcrProperties());

        boolean suspicious = service.isSuspiciousOcrResultForTest("000000", Optional.of(0));

        assertThat(suspicious).isTrue();
    }

    @Test
    void isSuspiciousOcrResultReturnsFalseForNonZero() {
        OcrService service = new OcrService(new OcrProperties());

        boolean suspicious = service.isSuspiciousOcrResultForTest("100000", Optional.of(100000));

        assertThat(suspicious).isFalse();
    }

    @Test
    void isSuspiciousOcrResultReturnsTrueWhenEmpty() {
        OcrService service = new OcrService(new OcrProperties());

        boolean suspicious = service.isSuspiciousOcrResultForTest("no digits here", Optional.empty());

        assertThat(suspicious).isTrue();
    }

    @Test
    void findWhiteTextRoiDetectsWhiteTextOnBlueBackground() {
        OcrProperties properties = new OcrProperties();
        properties.setWhiteMinBrightness(200);
        properties.setWhiteMaxDelta(60);
        properties.setMinWhitePixels(100);
        properties.setRoiPadding(4);
        OcrService service = new OcrService(properties);

        BufferedImage image = new BufferedImage(800, 300, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        g2d.setColor(new Color(15, 40, 90));
        g2d.fillRect(0, 0, 800, 300);
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 72));
        g2d.drawString("100000", 140, 190);
        g2d.dispose();

        Optional<BufferedImage> roi = service.findWhiteTextRoiForTest(image);

        assertThat(roi).isPresent();
        assertThat(roi.get().getWidth()).isLessThan(image.getWidth());
        assertThat(roi.get().getHeight()).isLessThan(image.getHeight());
    }

    @Test
    void findWhiteTextRoiReturnsEmptyWhenNotEnoughWhitePixels() {
        OcrProperties properties = new OcrProperties();
        properties.setMinWhitePixels(10_000);
        OcrService service = new OcrService(properties);

        BufferedImage image = new BufferedImage(400, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        g2d.setColor(new Color(10, 30, 70));
        g2d.fillRect(0, 0, 400, 200);
        g2d.dispose();

        Optional<BufferedImage> roi = service.findWhiteTextRoiForTest(image);

        assertThat(roi).isEmpty();
    }

    @Test
    void findWhiteTextRoiIgnoresAreasThatAreTooSmall() {
        OcrProperties properties = new OcrProperties();
        properties.setWhiteMinBrightness(200);
        properties.setWhiteMaxDelta(60);
        properties.setMinWhitePixels(10);
        properties.setRoiPadding(0);
        OcrService service = new OcrService(properties);

        BufferedImage image = new BufferedImage(100, 40, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        g2d.setColor(new Color(15, 40, 90));
        g2d.fillRect(0, 0, 100, 40);
        g2d.setColor(Color.WHITE);
        g2d.fillRect(10, 2, 2, 36);
        g2d.dispose();

        Optional<BufferedImage> roi = service.findWhiteTextRoiForTest(image);

        assertThat(roi).isEmpty();
    }

    @Test
    void preprocessResizesLargeImages() {
        OcrProperties properties = new OcrProperties();
        properties.setMaxWidth(200);
        OcrService service = new OcrService(properties);

        BufferedImage image = new BufferedImage(1000, 500, BufferedImage.TYPE_INT_RGB);
        BufferedImage processed = service.preprocessForTest(image);

        assertThat(processed.getWidth()).isLessThanOrEqualTo(200);
    }

    @Test
    void preprocessKeepsSmallImagesWithinMaxWidth() {
        OcrProperties properties = new OcrProperties();
        properties.setMaxWidth(1000);
        OcrService service = new OcrService(properties);

        BufferedImage image = new BufferedImage(400, 200, BufferedImage.TYPE_INT_RGB);
        BufferedImage processed = service.preprocessForTest(image);

        assertThat(processed.getWidth()).isLessThanOrEqualTo(400);
    }

    @Test
    void extractKmStandRejectsUnreadablePhoto() {
        OcrService service = new OcrService(new OcrProperties());
        MockMultipartFile file = new MockMultipartFile("photo", "photo.txt", "text/plain", "no-image".getBytes());

        assertThatThrownBy(() -> service.extractKmStand(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Foto konnte nicht gelesen werden");
    }

    @Test
    void extractKmStandRejectsEmptyPhoto() {
        OcrService service = new OcrService(new OcrProperties());
        MockMultipartFile file = new MockMultipartFile("photo", "photo.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> service.extractKmStand(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Foto fehlt oder ist leer");
    }

    @Test
    void extractKmStandReturnsCliLikeResultAndWritesDebugFiles() throws IOException {
        OcrProperties properties = new OcrProperties();
        properties.setDebugEnabled(true);
        properties.setDebugOutputDir(tempDir.toString());
        OcrService service = new OcrService(properties);
        MockMultipartFile file = createPngMultipartFile();

        try (MockedConstruction<Tesseract> mocked = Mockito.mockConstruction(Tesseract.class,
                (mock, context) -> Mockito.when(mock.doOCR(
                        anyInt(),
                        anyInt(),
                        any(ByteBuffer.class),
                        anyInt(),
                        isNull(),
                        isNull()
                )).thenReturn("KM 12345"))) {
            int result = service.extractKmStand(file);

            assertThat(result).isEqualTo(12345);
        }

        try (var dirStream = Files.list(tempDir)) {
            Path debugDir = dirStream.findFirst().orElseThrow();
            assertThat(debugDir).isDirectory();
            assertThat(Files.exists(debugDir.resolve("01-original.png"))).isTrue();
            assertThat(Files.exists(debugDir.resolve("02-cli-like.png"))).isTrue();
            assertThat(Files.exists(debugDir.resolve("ocr-cli-like.txt"))).isTrue();
        }
    }

    @Test
    void extractKmStandFallsBackToRelaxedWhenCliAndPrimarySuspicious() throws IOException {
        OcrService service = new OcrService(new OcrProperties());
        MockMultipartFile file = createPngMultipartFile();

        try (MockedConstruction<Tesseract> mocked = Mockito.mockConstruction(Tesseract.class,
                (mock, context) -> {
                    if (context.getCount() <= 2) {
                        Mockito.when(mock.doOCR(
                                anyInt(),
                                anyInt(),
                                any(ByteBuffer.class),
                                anyInt(),
                                isNull(),
                                isNull()
                        )).thenReturn("000");
                    } else {
                        Mockito.when(mock.doOCR(
                                anyInt(),
                                anyInt(),
                                any(ByteBuffer.class),
                                anyInt(),
                                isNull(),
                                isNull()
                        )).thenReturn("1234");
                    }
                })) {
            int result = service.extractKmStand(file);

            assertThat(result).isEqualTo(1234);
        }
    }

    @Test
    void extractKmStandFallsBackToPrimaryWhenCliSuspicious() throws IOException {
        OcrService service = new OcrService(new OcrProperties());
        MockMultipartFile file = createPngMultipartFile();

        try (MockedConstruction<Tesseract> mocked = Mockito.mockConstruction(Tesseract.class,
                (mock, context) -> {
                    if (context.getCount() == 1) {
                        Mockito.when(mock.doOCR(
                                anyInt(),
                                anyInt(),
                                any(ByteBuffer.class),
                                anyInt(),
                                isNull(),
                                isNull()
                        )).thenReturn("000");
                    } else {
                        Mockito.when(mock.doOCR(
                                anyInt(),
                                anyInt(),
                                any(ByteBuffer.class),
                                anyInt(),
                                isNull(),
                                isNull()
                        )).thenReturn("98765");
                    }
                })) {
            int result = service.extractKmStand(file);

            assertThat(result).isEqualTo(98765);
        }
    }

    @Test
    void ensureBlackTextOnWhiteInvertsWhenMostlyDark() {
        OcrService service = new OcrService(new OcrProperties());
        BufferedImage image = new BufferedImage(20, 20, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g2d = image.createGraphics();
        g2d.setColor(Color.BLACK);
        g2d.fillRect(0, 0, 20, 20);
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, 2, 2);
        g2d.dispose();

        BufferedImage result = service.ensureBlackTextOnWhiteForTest(image);

        int corner = result.getRGB(19, 19) & 0xff;
        assertThat(corner).isGreaterThan(200);
    }

    @Test
    void ensureBlackTextOnWhiteKeepsWhenMostlyWhite() {
        OcrService service = new OcrService(new OcrProperties());
        BufferedImage image = new BufferedImage(20, 20, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g2d = image.createGraphics();
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, 20, 20);
        g2d.setColor(Color.BLACK);
        g2d.fillRect(0, 0, 2, 2);
        g2d.dispose();

        BufferedImage result = service.ensureBlackTextOnWhiteForTest(image);

        int corner = result.getRGB(19, 19) & 0xff;
        assertThat(corner).isGreaterThan(200);
    }

    @Test
    void otsuThresholdReturnsMidValueOnBimodalImage() {
        OcrService service = new OcrService(new OcrProperties());
        BufferedImage image = new BufferedImage(20, 20, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g2d = image.createGraphics();
        g2d.setColor(Color.BLACK);
        g2d.fillRect(0, 0, 10, 20);
        g2d.setColor(Color.WHITE);
        g2d.fillRect(10, 0, 10, 20);
        g2d.dispose();

        int threshold = service.otsuThresholdForTest(image);

        assertThat(threshold).isBetween(0, 255);
    }

    private MockMultipartFile createPngMultipartFile() throws IOException {
        BufferedImage image = new BufferedImage(40, 20, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        g2d.setColor(Color.BLACK);
        g2d.fillRect(0, 0, 40, 20);
        g2d.setColor(Color.WHITE);
        g2d.fillRect(5, 5, 10, 10);
        g2d.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return new MockMultipartFile("photo", "photo.png", "image/png", out.toByteArray());
    }
}
