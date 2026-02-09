package de.schrell.drives.domain;

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
    DriveTemplate template;

    LocalDate date;

    @Nullable
    Reason reason;

    /**
     * Getter für das Feld {@link Drive#reason}.
     */
    public Reason getReason() {
        return reason == null ? template.getReason() : reason;
    }
}
