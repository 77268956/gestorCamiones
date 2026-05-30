package com.gestorcamiones.gestorcamiones.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BackupDTO {
    private Long id;
    private String archivoOriginal;
    private String archivoCifrado;
    private String rutaInterna;
    private String rutaExterna;
    private String rutaNube;
    private String origen;
    private String estado;
    private String detalle;
    private LocalDateTime creadoEn;
    private LocalDateTime restauradoEn;
}
