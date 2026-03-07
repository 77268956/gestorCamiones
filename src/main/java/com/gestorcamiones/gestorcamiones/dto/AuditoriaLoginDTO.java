package com.gestorcamiones.gestorcamiones.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaLoginDTO {
    private Long id;
    private LocalDateTime fecha;
    private String tipoEvento;
    private String usuarioEmail;
    private Long idUsuario;
    private String ip;
    private String userAgent;
    private String motivoDetalle;
    private String resultado;
}
