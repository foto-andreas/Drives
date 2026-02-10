package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin
@RequiredArgsConstructor
public class UserController {

    @GetMapping("/user")
    public UserResponse getUser(Authentication authentication) {
        String name = extractUserName(authentication).orElse("Unbekannt");
        return new UserResponse(name);
    }

    private Optional<String> extractUserName(Authentication authentication) {
        if (authentication == null) return Optional.empty();

        Object principal = authentication.getPrincipal();
        if (principal instanceof OidcUser oidcUser) {
            return Optional.ofNullable(resolveNameFromAttributes(oidcUser.getAttributes()));
        }
        if (principal instanceof OAuth2User oauth2User) {
            return Optional.ofNullable(resolveNameFromAttributes(oauth2User.getAttributes()));
        }
        if (authentication instanceof OAuth2AuthenticationToken token) {
            OAuth2User principal1 = token.getPrincipal();
            Map<String, Object> attrs = principal1 == null ? null : principal1.getAttributes();
            return Optional.ofNullable(resolveNameFromAttributes(attrs));
        }
        return Optional.ofNullable(authentication.getName());
    }

    private String resolveNameFromAttributes(Map<String, Object> attributes) {
        if (attributes == null) return null;
        // Common attribute keys depending on provider
        for (String key : new String[]{"name", "given_name", "preferred_username", "email"}) {
            Object v = attributes.get(key);
            if (v instanceof String s && !s.isBlank()) {
                return s;
            }
        }
        return null;
    }
}
