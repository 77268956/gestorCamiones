package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "viaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE viaje SET deleted_at = CURRENT_TIMESTAMP WHERE id_viaje = ?")
@SQLRestriction("deleted_at IS NULL")
public class Viaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_viaje")
    private Long idViaje;

    @Column(name = "nombre_viaje")
    private String nombreViaje;

    // 🔹 Relaciones

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_admin", nullable = false)
    private Usuario admin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @OneToMany(
            mappedBy = "viaje",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ViajeDetalle> detalles = new ArrayList<>();

    // 🔹 Auditoría

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void addDetalle(ViajeDetalle detalle) {
        detalles.add(detalle);
        detalle.setViaje(this);
    }

    public void removeDetalle(ViajeDetalle detalle) {
        detalles.remove(detalle);
        detalle.setViaje(null);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Viaje)) return false;
        return idViaje != null && idViaje.equals(((Viaje) o).idViaje);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
