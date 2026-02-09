package de.schrell.drives.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Entity
@Table(indexes = @Index(columnList = "name", unique = true))
public class DriveTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private int drive_length;
    private String from_location;
    private String to_location;
    private Reason reason;

}
