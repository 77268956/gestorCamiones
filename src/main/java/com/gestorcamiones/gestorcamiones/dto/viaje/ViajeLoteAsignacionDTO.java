package com.gestorcamiones.gestorcamiones.dto.viaje;

import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Asignacion de un lote a un viaje con su tramo (ida/vuelta).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ViajeLoteAsignacionDTO {
    private Long idLote;
    private String numeroLote;
    private String estado;
    private String nombreEncargado;
    private BigDecimal valorDeclarado;
    private TipoTramo tipoTramo;
}
