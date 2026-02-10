package de.schrell.drives;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.lang.reflect.Constructor;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:securityDb;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class SecurityConfigTest {

    @Autowired
    private SecurityFilterChain filterChain;

    @Test
    void filterChainBeanIsCreated() {
        assertNotNull(filterChain);
    }

    @Test
    void csrfCookieFilterTouchesTokenAndContinuesChain() throws Exception {
        Class<?> filterClass = Class.forName("de.schrell.drives.SecurityConfig$CsrfCookieFilter");
        Constructor<?> constructor = filterClass.getDeclaredConstructor();
        constructor.setAccessible(true);
        OncePerRequestFilter filter = (OncePerRequestFilter) constructor.newInstance();

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        CsrfToken token = new DefaultCsrfToken("X-CSRF-TOKEN", "_csrf", "token");
        request.setAttribute(CsrfToken.class.getName(), token);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}