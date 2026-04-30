package com.gestorcamiones.gestorcamiones.dto.auditoria;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.Pais;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Snapshot "plano" para auditoría de Viaje.
 * Evita serializar el grafo completo de entidades (y LazyInitializationException),
 * especialmente cadenas como Viaje.admin.rol.usuarios.
 * Actualizado para V2: sin cliente directo, sin precioViaje, con ubicacion.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ViajeAuditoriaDTO {

    private Long idViaje;
    private String nombreViaje;

    private Long adminId;
    private String adminNombre;

    private List<TramoAuditoriaDTO> tramos;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TramoAuditoriaDTO {
        private Long idViajeDetalle;
        private TipoTramo tipoTramo;
        private EstadoViaje estado;

        private Boolean pagado;
        private Boolean iva;

        // Ubicación (V2)
        private Pais paisSalida;
        private Pais paisDestino;
        private String direccionSalida;
        private String direccionDestino;
        private String observaciones;

        private LocalDateTime fechaSalida;
        private LocalDateTime fechaLlegada;

        private Long camionId;
        private String camionNombre;
        private String camionPlaca;

        private Long choferId;
        private String choferNombre;

        private BigDecimal gastoTotal;
    }
}
