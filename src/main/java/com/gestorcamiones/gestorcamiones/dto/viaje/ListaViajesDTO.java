package com.gestorcamiones.gestorcamiones.dto.viaje;

import com.gestorcamiones.gestorcamiones.dto.lote.LoteResumenDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para la lista de viajes (V2).
 * Ya no hay relación directa viaje-cliente ni precioViaje.
 * Los clientes se manejan a través de lotes (viaje_lote → lote → clientes).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ListaViajesDTO {
    private String nombreVieje;
    private long id_viaje;

    private String nombreAdmin;
    private long id_admin;

    private BigDecimal gastoTotal = BigDecimal.ZERO;
    private BigDecimal ingresoExtraTotal = BigDecimal.ZERO;

    private int viajesTotales;
    private int viajesActivos;

    private List<DetalleViajeDTO> listaVuelta;
    private List<DetalleViajeDTO> listaIDa;

    // V2: Lotes asociados al viaje
    private List<LoteResumenDTO> lotes;
    private int totalLotes;
}
