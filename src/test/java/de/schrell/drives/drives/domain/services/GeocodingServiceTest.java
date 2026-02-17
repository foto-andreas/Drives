package de.schrell.drives.drives.domain.services;

import de.schrell.drives.config.GeocodingProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpStatus.TOO_MANY_REQUESTS;

class GeocodingServiceTest {

    @Test
    void formatAddressAddsCountryCodeWhenNotDe() {
        GeocodingService service = new GeocodingService(new GeocodingProperties(), new RestTemplate());

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

        assertThat(result).isEqualTo("Main Street 10 (GB)");
    }

    @Test
    void formatAddressOmitsCountryCodeForDe() {
        GeocodingService service = new GeocodingService(new GeocodingProperties(), new RestTemplate());

        GeocodingService.Address address = new GeocodingService.Address(
                "Hauptstrasse",
                "5",
                null,
                null,
                null,
                null,
                null,
                "Berlin",
                null,
                null,
                null,
                null,
                null,
                null,
                "Germany",
                "de"
        );

        String result = service.formatAddress(address);

        assertThat(result).isEqualTo("Hauptstrasse 5, Berlin");
    }

    @Test
    void formatAddressFallsBackToLocalityWhenStreetMissing() {
        GeocodingService service = new GeocodingService(new GeocodingProperties(), new RestTemplate());

        GeocodingService.Address address = new GeocodingService.Address(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "Hannover",
                null,
                null,
                null,
                null,
                null,
                "Germany",
                "de"
        );

        String result = service.formatAddress(address);

        assertThat(result).isEqualTo("Hannover");
    }

    @Test
    void reverseGeocodeReturnsFormattedAddress() {
        GeocodingProperties properties = new GeocodingProperties();
        properties.setBaseUrl("https://nominatim.openstreetmap.org/reverse");
        properties.setUserAgent("fahrtenbuch/1.0");
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.createServer(restTemplate);

        String url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=51.983979&lon=9.236743&zoom=18&addressdetails=1";
        String body = "{" +
                "\"address\": {" +
                "\"road\": \"Hauptstrasse\"," +
                "\"house_number\": \"5\"," +
                "\"city\": \"Berlin\"," +
                "\"country_code\": \"de\"" +
                "}" +
                "}";

        server.expect(requestTo(url))
                .andExpect(method(GET))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        GeocodingService service = new GeocodingService(properties, restTemplate);

        assertThat(service.reverseGeocode(51.983979, 9.236743)).contains("Hauptstrasse 5, Berlin");
        server.verify();
    }

    @Test
    void reverseGeocodeReturnsEmptyOnError() {
        GeocodingProperties properties = new GeocodingProperties();
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.createServer(restTemplate);

        String url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=1.0&lon=2.0&zoom=18&addressdetails=1";
        server.expect(requestTo(url))
                .andExpect(method(GET))
                .andRespond(withStatus(TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.RETRY_AFTER, "1"));

        GeocodingService service = new GeocodingService(properties, restTemplate);

        assertThat(service.reverseGeocode(1.0, 2.0)).isEmpty();
        server.verify();
    }
}
