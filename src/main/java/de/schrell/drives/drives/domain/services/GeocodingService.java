package de.schrell.drives.drives.domain.services;

import de.schrell.drives.config.GeocodingProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Optional;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeocodingService {

    private final GeocodingProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    public Optional<String> reverseGeocode(double latitude, double longitude) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(properties.getBaseUrl())
                .queryParam("format", "jsonv2")
                .queryParam("lat", latitude)
                .queryParam("lon", longitude)
                .queryParam("zoom", 18)
                .queryParam("addressdetails", 1);
        if (properties.getEmail() != null && !properties.getEmail().isBlank()) {
            builder.queryParam("email", properties.getEmail());
        }
        URI uri = builder.build(true).toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, properties.getUserAgent());
        if (properties.getAcceptLanguage() != null && !properties.getAcceptLanguage().isBlank()) {
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, properties.getAcceptLanguage());
        }
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<ReverseGeocodeResponse> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    entity,
                    ReverseGeocodeResponse.class
            );

            ReverseGeocodeResponse body = response.getBody();
            if (body == null || body.address() == null) {
                return Optional.empty();
            }
            return Optional.of(formatAddress(body.address()));
        } catch (RestClientException ex) {
            log.warn("Reverse geocoding failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    public record ReverseGeocodeResponse(@JsonProperty("address") Address address) {
    }

    public record Address(
            String road,
            @JsonProperty("house_number") String houseNumber,
            String pedestrian,
            String footway,
            String street,
            String residential,
            String postcode,
            String city,
            String town,
            String village,
            String hamlet,
            String municipality,
            String county,
            String state,
            String country,
            @JsonProperty("country_code") String countryCode
    ) {
    }

    private String formatAddress(Address address) {
        String streetName = firstNonBlank(
                address.road(),
                address.pedestrian(),
                address.footway(),
                address.street(),
                address.residential()
        );
        String street = joinParts(streetName, address.houseNumber());
        String locality = firstNonBlank(
                address.city(),
                address.town(),
                address.village(),
                address.hamlet(),
                address.municipality(),
                address.county(),
                address.state()
        );
        String base = joinParts(street, locality);
        String countryCode = address.countryCode();
        if (countryCode != null && !countryCode.isBlank() && !"de".equalsIgnoreCase(countryCode)) {
            return base + " (" + countryCode.toUpperCase() + ")";
        }
        return base;
    }

    private String joinParts(String first, String second) {
        String f = firstNonBlank(first);
        String s = firstNonBlank(second);
        if (f == null && s == null) return "";
        if (f == null) return s;
        if (s == null) return f;
        return f + ", " + s;
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
