package de.schrell.drives;

import de.schrell.drives.config.multitenancy.DatabaseInitializationTracker;
import de.schrell.drives.config.multitenancy.InitializationNotificationFilter;
import de.schrell.drives.config.multitenancy.TenantFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, InitializationNotificationFilter initializationNotificationFilter) {
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
            )
            .addFilterBefore(new TenantFilter(), BasicAuthenticationFilter.class)
            .addFilterAfter(initializationNotificationFilter, TenantFilter.class)
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .authorizeHttpRequests(authorizeRequests -> authorizeRequests
                .requestMatchers("/.well-known/**", "/error", "/favicon.ico", "/*.js", "/*.css", "/*.png", "/index.html").permitAll()
                .anyRequest().authenticated())
            .oauth2Login(withDefaults());
        return http.build();
    }

    @Bean
    public InitializationNotificationFilter initializationNotificationFilter(DatabaseInitializationTracker initializationTracker) {
        return new InitializationNotificationFilter(initializationTracker);
    }

    private static final class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}