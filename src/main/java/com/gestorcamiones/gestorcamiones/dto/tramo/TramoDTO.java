package com.gestorcamiones.gestorcamiones.dto.tramo;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.Pais;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    private String camionNombre;
    private String camionPlaca;
    private String conductorNombre;

    // Ubicación (V2)
    private Pais paisSalida;
    private Pais paisDestino;
    private String direccionSalida;
    private String direccionDestino;
    private String observaciones;

    private LocalDateTime fechaSalida;
    private LocalDateTime fechaEntrada;

    private List<GastoViajeDTO> gastos;
}
