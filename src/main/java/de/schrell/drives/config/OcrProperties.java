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
     * Maximum width used for OCR preprocessing.
     */
    private int maxWidth = 1600;

}
