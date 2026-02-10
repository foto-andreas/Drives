package de.schrell.drives.config.multitenancy;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class TenantFilterTest {

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    @Test
    void setsTenantFromOAuth2EmailAndClearsAfterRequest() throws Exception {
        TenantFilter filter = new TenantFilter();
        Map<String, Object> attributes = Map.of("email", "foo.bar+1@example.com");
        OAuth2User oauth2User = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "email"
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(oauth2User, "n/a", oauth2User.getAuthorities())
        );

        AtomicReference<String> tenantInChain = new AtomicReference<>();
        FilterChain chain = (request, response) -> tenantInChain.set(TenantContext.getCurrentTenant());

        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        assertThat(tenantInChain.get()).isEqualTo("foo_bar_1_example_com");
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    void doesNotSetTenantForAnonymousUser() throws Exception {
        TenantFilter filter = new TenantFilter();
        AnonymousAuthenticationToken authenticationToken = new AnonymousAuthenticationToken(
                "key",
                "anonymousUser",
                List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))
        );
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);

        AtomicReference<String> tenantInChain = new AtomicReference<>();
        FilterChain chain = (request, response) -> tenantInChain.set(TenantContext.getCurrentTenant());

        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        assertThat(tenantInChain.get()).isNull();
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    void fallsBackToAuthenticationNameWhenNoOAuth2User() throws Exception {
        TenantFilter filter = new TenantFilter();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user@company.com",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        AtomicReference<String> tenantInChain = new AtomicReference<>();
        FilterChain chain = (request, response) -> tenantInChain.set(TenantContext.getCurrentTenant());

        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        assertThat(tenantInChain.get()).isEqualTo("user_company_com");
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }
}