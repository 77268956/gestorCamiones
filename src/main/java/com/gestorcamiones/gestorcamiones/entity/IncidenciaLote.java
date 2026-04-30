package com.gestorcamiones.gestorcamiones.entity;

import com.gestorcamiones.gestorcamiones.entity.Enum.TipoIncidencia;
import com.gestorcamiones.gestorcamiones.entity.converter.TipoIncidenciaConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * Incidencia ocurrida sobre un lote durante un tramo de viaje.
 * Tabla nueva en la version 2 de la base de datos.
 */
@Entity
@Table(name = "incidencia_lote")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE incidencia_lote SET deleted_at = CURRENT_TIMESTAMP WHERE id_incidencia = ?")
@SQLRestriction("deleted_at IS NULL")
public class IncidenciaLote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_incidencia")
    private Long idIncidencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote", nullable = false)
    private Lote lote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_viaje_detalle", nullable = false)
    private ViajeDetalle viajeDetalle;

    @Convert(converter = TipoIncidenciaConverter.class)
    @Column(name = "tipo_incidencia", nullable = false)
    private TipoIncidencia tipoIncidencia;

    private String descripcion;

    @Column(name = "evidencia_url")
    private String evidenciaUrl;

    @Column(name = "fecha_incidencia", nullable = false)
    private LocalDateTime fechaIncidencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reportado_por", nullable = false)
    private Usuario reportadoPor;

    @Column(columnDefinition = "boolean default false")
    private Boolean resuelto = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
