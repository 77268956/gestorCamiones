package com.gestorcamiones.gestorcamiones.dto.viaje;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.Pais;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DetalleViajeDTO {
    private Long id;
    private Long camionId;
    private Long conductorId;
    private String camionNombre;
    private String camionPlaca;
    private String conductorNombre;

    private EstadoViaje estadoViaje;
    private TipoTramo tipoTramo;

    private Boolean pagado;
    private Boolean iva;
    private BigDecimal gastoTotal;
    private BigDecimal gananciaTotal;

    // Ubicación (V2)
    private Pais paisSalida;
    private Pais paisDestino;
    private String direccionSalida;
    private String direccionDestino;
    private String observaciones;

    private LocalDateTime fechaSalida;
    private LocalDateTime fechaEntrada;
}
