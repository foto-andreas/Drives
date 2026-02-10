package de.schrell.drives.drives.api.controllers;

import de.schrell.drives.drives.api.dtos.UserResponse;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.core.Authentication;

import static org.assertj.core.api.Assertions.assertThat;

class UserControllerTest {

    @Test
    void returnsUserNameFromAuthentication() {
        // Given
        Authentication authentication = Mockito.mock(Authentication.class);
        Mockito.when(authentication.getName()).thenReturn("Max Mustermann");
        UserController controller = new UserController();

        // When
        UserResponse response = controller.getUser(authentication);

        // Then
        assertThat(response.name()).isEqualTo("Max Mustermann");
    }
}
