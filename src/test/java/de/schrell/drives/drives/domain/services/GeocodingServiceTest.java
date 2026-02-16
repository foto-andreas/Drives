package de.schrell.drives.drives.domain.services;

import de.schrell.drives.config.GeocodingProperties;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class GeocodingServiceTest {

    @Test
    void formatAddressAddsCountryCodeWhenNotDe() throws Exception {
        GeocodingProperties properties = new GeocodingProperties();
        GeocodingService service = new GeocodingService(properties);

        GeocodingService.Address address = new GeocodingService.Address(
                "Main Street",
                "10",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "United Kingdom",
                "gb"
        );

        String result = service.formatAddress(address);

        assertThat(result).isEqualTo("Main Street, 10 (GB)");
    }
}
