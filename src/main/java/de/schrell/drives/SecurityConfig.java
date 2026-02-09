package de.schrell.drives;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorizeRequests -> authorizeRequests.anyRequest().authenticated())
            .oauth2Login(oauth2Login -> {

            });
        return http.build();
    }
}