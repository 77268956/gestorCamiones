package com.gestorcamiones.gestorcamiones.dto.tramo;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TramoDTO {

    private long id;
    private long idCamion;
    private long idConductor;

    private EstadoViaje estadoViaje;
    private TipoTramo tipoTramo;

    private boolean pagado;
    private boolean iva;

    private BigDecimal precioViaje;
    private String camionNombre;
    private String camionPlaca;
    private String conductorNombre;

    private LocalDateTime fechaSalida;
    private LocalDateTime fechaEntrada;

    private List<GastoViajeDTO> gastos;}
