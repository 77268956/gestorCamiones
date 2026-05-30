package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "historial_backup")
public class HistorialBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "backup_id")
    private Long backupId;

    @Column(nullable = false, length = 40)
    private String accion;

    @Column(nullable = false, length = 30)
    private String origen;

    @Column(length = 500)
    private String detalle;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;
}
