package com.gestorcamiones.gestorcamiones.entity;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import com.gestorcamiones.gestorcamiones.entity.converter.EstadoViajeConverter;
import com.gestorcamiones.gestorcamiones.entity.converter.TipoTramoConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "viaje_detalle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE viaje_detalle SET deleted_at = CURRENT_TIMESTAMP WHERE id_viaje_detalle = ?")
@SQLRestriction("deleted_at IS NULL")
public class ViajeDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_viaje_detalle")
    private Long idViajeDetalle;

    // 🔹 Relación principal

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_viaje", nullable = false)
    private Viaje viaje;

    // 🔹 Enums

    @Convert(converter = TipoTramoConverter.class)
    @Column(name = "tipo_tramo", nullable = false)
    private TipoTramo tipoTramo;

    @Convert(converter = EstadoViajeConverter.class)
    @Column(name = "estado", nullable = false)
    private EstadoViaje estado;

    // 🔹 Flags

    private Boolean pagado = false;

    private Boolean iva = false;

    // 🔹 Fechas

    @Column(name = "fecha_salida")
    private LocalDateTime fechaSalida;

    @Column(name = "fecha_llegada")
    private LocalDateTime fechaLlegada;

    // 🔹 Relaciones opcionales

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_camion")
    private Camion camion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_chofer")
    private Usuario chofer;

    @OneToMany(mappedBy = "viajeDetalle", cascade = CascadeType.ALL)
    private List<GastoViaje> gastos;

    // 🔹 Auditoría

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
