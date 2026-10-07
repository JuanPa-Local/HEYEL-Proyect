package com.heyel.domain.paciente;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "pacientes")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Nullable for accounts created before explicit acceptance was introduced.
    // Never infer or backfill consent for existing patients.
    private LocalDateTime termsAcceptedAt;

    @Column(length = 50)
    private String termsVersion;

    // Campos Opcionales
    @Column(nullable = true)
    private String phone;

    @Column(nullable = true)
    private String address;

    @Column(nullable = true)
    private String avatarUrl;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    // TODO: Implementar roles si se requiere más adelante (ej. PACIENTE, ADMIN, MEDICO)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.PACIENTE;

    public enum Role {
        PACIENTE,
        MEDICO,
        ADMIN
    }

    // TODO: Implementar relación con Examen más adelante cuando la entidad Examen esté definida
    /*
    @OneToMany(mappedBy = "paciente", cascade = CascadeType.ALL)
    private List<Examen> examenes;
    */

    public void updateProfile(String phone, String address, String avatarUrl) {
        this.address = address;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
    }
}