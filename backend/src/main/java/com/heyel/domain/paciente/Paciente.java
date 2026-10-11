package com.heyel.domain.paciente;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime termsAcceptedAt;

    @Column(length = 50)
    private String termsVersion;

    private String phone;

    private String address;

    private String avatarUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.PACIENTE;

    public enum Role {
        PACIENTE,
        MEDICO,
        ADMIN
    }

    public void updateProfile(String phone, String address, String avatarUrl) {
        this.phone = phone;
        this.address = address;
        this.avatarUrl = avatarUrl;
    }
}