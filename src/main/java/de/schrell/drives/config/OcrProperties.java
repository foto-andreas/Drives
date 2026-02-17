package de.schrell.drives.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.ocr")
public class OcrProperties {

    /**
     * Path to the tessdata directory.
     */
    private String tesseractPath = "/usr/share/tesseract-ocr/5/tessdata";

    /**
     * Language codes for OCR (e.g. "deu", "eng", or "deu+eng").
     */
    private String language = "deu";

    /**
     * Optional native library path for libtesseract (e.g. /opt/homebrew/lib).
     */
    private String libraryPath;

    /**
     * Enables OCR debug output (intermediate images + OCR text).
     */
    private boolean debugEnabled = false;

    /**
     * Directory for OCR debug output (e.g. /root/data/ocr-debug).
     */
    private String debugOutputDir;

    /**
     * Crop width ratio centered in the image (0-1).
     */
    private double cropWidthRatio = 0.6;

    /**
     * Crop height ratio centered in the image (0-1).
     */
    private double cropHeightRatio = 0.35;

    /**
     * Minimum crop height in pixels.
     */
    private int cropMinHeight = 200;

    /**
     * Maximum width used for OCR preprocessing.
     */
    private int maxWidth = 1600;

    /**
     * Minimum brightness to treat a pixel as white text (0-255).
     */
    private int whiteMinBrightness = 200;

    /**
     * Maximum channel delta to treat a pixel as low saturation (0-255).
     */
    private int whiteMaxDelta = 40;

    /**
     * Minimum number of white pixels required to build a ROI.
     */
    private int minWhitePixels = 500;

    /**
     * Padding (in pixels) added around detected ROI.
     */
    private int roiPadding = 12;

}
