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
@Table(name = "ingreso_extra_viaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE ingreso_extra_viaje SET deleted_at = CURRENT_TIMESTAMP WHERE id_ingreso_extra_viaje = ?")
@SQLRestriction("deleted_at IS NULL")
public class IngresoExtraViaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ingreso_extra_viaje")
    private Long idIngresoExtraViaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_viaje_detalle", nullable = false)
    private ViajeDetalle viajeDetalle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria_ingreso_extra", nullable = false)
    private CategoriaIngresoExtra categoriaIngresoExtra;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    private String descripcion;

    @Column(name = "fecha_ingreso")
    private LocalDate fechaIngreso;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
