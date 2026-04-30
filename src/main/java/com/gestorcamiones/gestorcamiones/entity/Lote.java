package com.gestorcamiones.gestorcamiones.entity;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoLote;
import com.gestorcamiones.gestorcamiones.entity.converter.EstadoLoteConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Lote de carga que se transporta en un viaje.
 * Reemplaza la relacion directa viaje-cliente de la V1.
 * Un lote tiene un remitente y un destinatario (ambos clientes).
 * Tabla nueva en la version 2 de la base de datos.
 */
@Entity
@Table(name = "lote")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE lote SET deleted_at = CURRENT_TIMESTAMP WHERE id_lote = ?")
@SQLRestriction("deleted_at IS NULL")
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lote")
    private Long idLote;

    @Column(name = "numero_lote", unique = true)
    private String numeroLote;

    @Convert(converter = EstadoLoteConverter.class)
    @Column(name = "estado", nullable = false)
    private EstadoLote estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria")
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente_remitente", nullable = false)
    private Cliente clienteRemitente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente_destinatario", nullable = false)
    private Cliente clienteDestinatario;

    @Column(name = "nombre_encargado")
    private String nombreEncargado;

    @Column(precision = 10, scale = 2)
    private BigDecimal peso;

    private String descripcion;

    @Column(name = "valor_declarado", precision = 12, scale = 2)
    private BigDecimal valorDeclarado;

    // Relacion M:N con Viaje a traves de viaje_lote
    @OneToMany(mappedBy = "lote", cascade = CascadeType.ALL)
    private List<ViajeLote> viajeLotes = new ArrayList<>();

    // Incidencias del lote
    @OneToMany(mappedBy = "lote", cascade = CascadeType.ALL)
    private List<IncidenciaLote> incidencias = new ArrayList<>();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
