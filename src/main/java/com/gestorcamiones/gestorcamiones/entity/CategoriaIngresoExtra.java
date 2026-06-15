package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "categoria_ingreso_extra")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE categoria_ingreso_extra SET deleted_at = CURRENT_TIMESTAMP WHERE id_categoria_ingreso_extra = ?")
@SQLRestriction("deleted_at IS NULL")
public class CategoriaIngresoExtra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria_ingreso_extra")
    private Long idCategoriaIngresoExtra;

    @Column(nullable = false, unique = true)
    private String nombre;

    private String descripcion;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
