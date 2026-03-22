package com.gestorcamiones.gestorcamiones.dto;

import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
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

    BigDecimal ganaciaTotal = BigDecimal.valueOf(0);
    BigDecimal gastoTotal = BigDecimal.valueOf(0);

    private List<ViajeDetalle> listaVuelta;
    private List<ViajeDetalle> listaIDa;

}