package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Tabla intermedia que relaciona viajes con lotes (M:N).
 * Tabla nueva en la version 2 de la base de datos.
 */
@Entity
@Table(name = "viaje_lote")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ViajeLote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_viaje_lote")
    private Long idViajeLote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_viaje", nullable = false)
    private Viaje viaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote", nullable = false)
    private Lote lote;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
