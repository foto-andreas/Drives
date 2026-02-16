package de.schrell.drives;

import de.schrell.drives.drives.domain.repositories.DriveRepository;
import de.schrell.drives.drives.domain.repositories.DriveTemplateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@SpringBootApplication
@ConfigurationPropertiesScan
@Slf4j
public class FahrtenApplication {

	public static void main(String[] args) {
		SpringApplication.run(FahrtenApplication.class, args);
	}

	@Bean
	CommandLineRunner init(DriveTemplateRepository driveTemplatRepository, DriveRepository driveRepository, JdbcTemplate jdbcTemplate) {
		return args -> {
        };
    }
}
