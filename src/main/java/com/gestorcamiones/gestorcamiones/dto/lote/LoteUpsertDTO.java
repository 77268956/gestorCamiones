package com.gestorcamiones.gestorcamiones.dto.lote;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class LoteUpsertDTO {
    private String numeroLote;
    private String estado; // dbValue (ej: en_transito)
    private Long idCategoria;
    private Long idClienteRemitente;
    private Long idClienteDestinatario;
    private String nombreEncargado;
    private BigDecimal peso;
    private String descripcion;
    private BigDecimal valorDeclarado;
    private String tipoTramo;
}

