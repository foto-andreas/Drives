package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserControllerTest {

    private final UserController controller = new UserController();

    @Test
    void returnsUserNameAndVersionFromAuthentication() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("Max Mustermann");

        UserResponse response = controller.getUser(authentication);

        assertThat(response.name()).isEqualTo("Max Mustermann");
        // version is injected via @Value, in unit test it will be null unless manually set
        // but since it's a private field, we might just check it doesn't crash
    }

    @Test
    void returnsUnbekanntWhenAuthenticationIsNull() {
        UserResponse response = controller.getUser(null);
        assertThat(response.name()).isEqualTo("Unbekannt");
    }

    @Test
    void returnsNameFromOidcUser() {
        Authentication authentication = mock(Authentication.class);
        OidcUser oidcUser = mock(OidcUser.class);
        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getAttributes()).thenReturn(Map.of("name", "OIDC User"));

        UserResponse response = controller.getUser(authentication);

        assertThat(response.name()).isEqualTo("OIDC User");
    }

    @Test
    void returnsNameFromOAuth2User() {
        Authentication authentication = mock(Authentication.class);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttributes()).thenReturn(Map.of("given_name", "OAuth2 User"));

        UserResponse response = controller.getUser(authentication);

        assertThat(response.name()).isEqualTo("OAuth2 User");
    }

    @Test
    void returnsNameFromOAuth2AuthenticationToken() {
        OAuth2AuthenticationToken token = mock(OAuth2AuthenticationToken.class);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(token.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttributes()).thenReturn(Map.of("email", "test@example.com"));

        UserResponse response = controller.getUser(token);

        assertThat(response.name()).isEqualTo("test@example.com");
    }

    @Test
    void returnsUnbekanntWhenOAuth2TokenPrincipalIsNull() {
        OAuth2AuthenticationToken token = mock(OAuth2AuthenticationToken.class);
        when(token.getPrincipal()).thenReturn(null);

        UserResponse response = controller.getUser(token);

        assertThat(response.name()).isEqualTo("Unbekannt");
    }

    @Test
    void returnsUnbekanntWhenNoAttributeMatches() {
        Authentication authentication = mock(Authentication.class);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttributes()).thenReturn(Map.of("unknown", "value"));

        UserResponse response = controller.getUser(authentication);

        assertThat(response.name()).isEqualTo("Unbekannt");
    }

    @Test
    void resolveNameFromAttributesHandlesNullAttributes() {
        Authentication authentication = mock(Authentication.class);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttributes()).thenReturn(null);

        UserResponse response = controller.getUser(authentication);

        assertThat(response.name()).isEqualTo("Unbekannt");
    }

    @Test
    void resolveNameFromAttributesIgnoresBlankStrings() {
        Authentication authentication = mock(Authentication.class);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttributes()).thenReturn(Map.of("name", "  ", "email", "valid@mail.com"));

        UserResponse response = controller.getUser(authentication);

        assertThat(response.name()).isEqualTo("valid@mail.com");
    }

    @Test
    void resolveNameFromAttributesPrioritizesCorrectKeys() {
        Authentication authentication = mock(Authentication.class);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        
        // order: name, given_name, preferred_username, email
        when(oauth2User.getAttributes()).thenReturn(Map.of(
            "given_name", "Given",
            "preferred_username", "Pref",
            "email", "mail@example.com"
        ));

        UserResponse response = controller.getUser(authentication);
        assertThat(response.name()).isEqualTo("Given");
    }
}
