package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "backup_registros")
public class BackupRegistro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "archivo_original", nullable = false, length = 255)
    private String archivoOriginal;

    @Column(name = "archivo_cifrado", nullable = false, length = 255)
    private String archivoCifrado;

    @Column(name = "ruta_interna", nullable = false, length = 255)
    private String rutaInterna;

    @Column(name = "ruta_externa", nullable = false, length = 255)
    private String rutaExterna;

    @Column(name = "ruta_nube", length = 255)
    private String rutaNube;

    @Column(nullable = false, length = 30)
    private String origen;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(length = 500)
    private String detalle;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "restaurado_en")
    private LocalDateTime restauradoEn;
}
