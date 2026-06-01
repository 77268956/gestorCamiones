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

    @Column(name = "archivo_original", nullable = false, columnDefinition = "text")
    private String archivoOriginal;

    @Column(name = "archivo_cifrado", nullable = false, columnDefinition = "text")
    private String archivoCifrado;

    @Column(name = "ruta_interna", nullable = false, columnDefinition = "text")
    private String rutaInterna;

    @Column(name = "ruta_externa", nullable = false, columnDefinition = "text")
    private String rutaExterna;

    @Column(name = "ruta_nube", columnDefinition = "text")
    private String rutaNube;

    @Column(name = "drive_file_id", length = 255)
    private String driveFileId;

    @Column(name = "drive_web_view_link", columnDefinition = "text")
    private String driveWebViewLink;

    @Column(name = "drive_estado", length = 30)
    private String driveEstado;

    @Column(nullable = false, length = 30)
    private String origen;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(columnDefinition = "text")
    private String detalle;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "restaurado_en")
    private LocalDateTime restauradoEn;
}
