package de.schrell.drives.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.geocoding")
public class GeocodingProperties {

    private String baseUrl = "https://nominatim.openstreetmap.org/reverse";
    private String userAgent = "fahrtenbuch/1.0";
    private String email;
    private String acceptLanguage = "de";

}
