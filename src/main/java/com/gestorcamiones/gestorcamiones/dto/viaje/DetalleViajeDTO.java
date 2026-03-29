package com.gestorcamiones.gestorcamiones.dto.viaje;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DetalleViajeDTO {
    private Long id;
    private Long camionId;
    private Long conductorId;

    private EstadoViaje estadoViaje;
    private TipoTramo tipoTramo;

    private Boolean pagado;
    private Boolean iva;

    private LocalDateTime fechaSalida;
    private LocalDateTime fechaEntrada;
}
