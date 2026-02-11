package de.schrell.drives;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Explizite Zuweisung für .well-known
        registry.addResourceHandler("/.well-known/**")
                .addResourceLocations("classpath:/static/.well-known/")
                .setCachePeriod(0); // Zum Testen Caching deaktivieren

        // Standard für andere statische Ressourcen
        registry.addResourceHandler("/favicon.ico")
                .addResourceLocations("classpath:/static/");
    }
}