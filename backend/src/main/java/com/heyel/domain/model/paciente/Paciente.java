package com.heyel.domain.model;

import jakarta.persistence.Entity;

@Entity
@Table(name = "pacientes")
@Data
@NoArgsConstructor
@AllArgsCOnstructor

public class paciente {
    @Id
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String password;
}