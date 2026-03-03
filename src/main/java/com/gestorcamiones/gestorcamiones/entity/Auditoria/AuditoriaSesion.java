package com.gestorcamiones.gestorcamiones.entity.Auditoria;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "auditoria_sesion")
public class AuditoriaSesion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idUsuario;

    private LocalDateTime fecha;

    private String tipoSesion;

    public AuditoriaSesion(Long idUsuario, String tipoSesion) {
        this.idUsuario = idUsuario;
        this.tipoSesion = tipoSesion;
        this.fecha = LocalDateTime.now();
    }

}