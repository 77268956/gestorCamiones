package com.gestorcamiones.gestorcamiones.entity.Auditoria;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@AllArgsConstructor
@Table(name = "auditoria_login_fallido")
public class AuditoriaLoginFallido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String ip;
    private String userAgent;
    private String motivo;

    private LocalDateTime fecha = LocalDateTime.now();

    public AuditoriaLoginFallido() {}

    public AuditoriaLoginFallido(String email, String ip, String userAgent, String motivo) {
        this.email = email;
        this.ip = ip;
        this.userAgent = userAgent;
        this.motivo = motivo;
    }
}