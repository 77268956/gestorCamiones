package com.gestorcamiones.gestorcamiones.dto.lote;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO resumido de un lote para mostrar en la vista de viajes.
 * Muestra datos clave: número, estado, remitente, destinatario, categoría.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoteResumenDTO {
    private Long idLote;
    private String numeroLote;
    private String estado;
    private String categoriaNombre;
    private String remitenteNombre;
    private String destinatarioNombre;
    private String nombreEncargado;
    private BigDecimal peso;
    private BigDecimal valorDeclarado;
    private String descripcion;
    private boolean asignado;
    private String tipoTramo;
}
