package de.schrell.drives.drives.domain.entities;

import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(doNotUseGetters = true)
@Entity
public class Drive {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;


    @ManyToOne
    @JoinColumn(name = "template_id")
    @Nullable
    private DriveTemplate template;

    private LocalDate date;

    @Nullable
    private Reason reason;

    @Nullable
    @Column(name = "from_location")
    private String fromLocation;

    @Nullable
    @Column(name = "to_location")
    private String toLocation;

    @Nullable
    @Column(name = "drive_length")
    private Integer driveLength;
}
