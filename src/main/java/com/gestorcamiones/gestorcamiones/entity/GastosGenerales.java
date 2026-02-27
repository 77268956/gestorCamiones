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
@Table(name = "gastos_generales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE gastos_generales SET deleted_at = CURRENT_TIMESTAMP WHERE id_gastos_generales = ?")
@SQLRestriction("deleted_at IS NULL")
public class GastosGenerales {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_gastos_generales")
    private Long idGastosGenerales;

    @Column(name = "monto", precision = 12, scale = 2)
    private BigDecimal monto;

    private String descripcion;

    @Column(name = "fecha_gasto")
    private LocalDate fechaGasto;

    @Column(name = "evidencia_url")
    private String evidenciaUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_gasto", nullable = false)
    private TipoGasto tipoGasto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_admin", nullable = false)
    private Usuario admin;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}