package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "gastos_viaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE gastos_viaje SET deleted_at = CURRENT_TIMESTAMP WHERE id_gasto_viaje = ?")
@SQLRestriction("deleted_at IS NULL")
public class GastoViaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_gasto_viaje")
    private Long idGastoViaje;

    // 🔹 Relaciones

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_viaje_detalle", nullable = false)
    private ViajeDetalle viajeDetalle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_gasto", nullable = false)
    private TipoGasto tipoGasto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_admin")
    private Usuario admin;

    // 🔹 Datos del gasto

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    private String descripcion;

    @Column(name = "evidencia_url")
    private String evidenciaUrl;

    @Column(name = "fecha_gasto")
    private LocalDate fechaGasto;

    // 🔹 Auditoría

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}