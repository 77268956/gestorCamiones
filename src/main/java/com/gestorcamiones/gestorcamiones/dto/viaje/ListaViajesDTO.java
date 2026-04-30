package com.gestorcamiones.gestorcamiones.dto.viaje;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ListaViajesDTO {
    private String nombreVieje;
    private long id_viaje;

    private String nombreAdmin;
    private long id_admin;

    private long idCamion;

    private BigDecimal gastoTotal = BigDecimal.ZERO;

    private int viajesTotales;
    private int viajesActivos;

    private List<DetalleViajeDTO> listaVuelta;
    private List<DetalleViajeDTO> listaIDa;

    private List<GastoViajeDTO> gastoViajes;
}
