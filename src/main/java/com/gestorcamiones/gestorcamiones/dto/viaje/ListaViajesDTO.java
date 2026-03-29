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
    private long id;

    private String nombreAdmin;
    private String nombreEmpleado;
    private String nombreVieje;

    private long idCamion;

    private BigDecimal ganaciaTotal = BigDecimal.ZERO;
    private BigDecimal gastoTotal = BigDecimal.ZERO;

    private List<DetalleViajeDTO> listaVuelta;
    private List<DetalleViajeDTO> listaIDa;

    private List<GastoViajeDTO> gastoViajes;
}
