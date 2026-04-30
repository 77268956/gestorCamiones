package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Viaje;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface ViajeRepository extends JpaRepository<Viaje, Long> {

    @Query(
            value = """
        SELECT DISTINCT v.*
        FROM viaje v
        LEFT JOIN viaje_detalle vd ON vd.id_viaje = v.id_viaje AND vd.deleted_at IS NULL
        LEFT JOIN usuarios u ON u.id_usuarios = v.id_admin AND u.deleted_at IS NULL
        WHERE v.deleted_at IS NULL
        AND (
            :texto IS NULL OR
            LOWER(v.nombre_viaje) LIKE LOWER(CONCAT('%', :texto, '%')) OR
            LOWER(u.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
        AND (
            :estado IS NULL OR
            CAST(vd.estado AS text) = :estado
        )
        AND (
            :excluirCompletados = false OR
            CAST(vd.estado AS text) <> 'completado'
        )
        AND (
            CAST(:fechaInicio AS date) IS NULL OR DATE(vd.fecha_salida) >= CAST(:fechaInicio AS date)
        )
        AND (
            CAST(:fechaFin AS date) IS NULL OR DATE(vd.fecha_salida) <= CAST(:fechaFin AS date)
        )
    """,
            countQuery = """
        SELECT COUNT(DISTINCT v.id_viaje)
        FROM viaje v
        LEFT JOIN viaje_detalle vd ON vd.id_viaje = v.id_viaje AND vd.deleted_at IS NULL
        LEFT JOIN usuarios u ON u.id_usuarios = v.id_admin AND u.deleted_at IS NULL
        WHERE v.deleted_at IS NULL
        AND (
            :texto IS NULL OR
            LOWER(v.nombre_viaje) LIKE LOWER(CONCAT('%', :texto, '%')) OR
            LOWER(u.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
        AND (
            :estado IS NULL OR
            CAST(vd.estado AS text) = :estado
        )
        AND (
            :excluirCompletados = false OR
            CAST(vd.estado AS text) <> 'completado'
        )
        AND (
            CAST(:fechaInicio AS date) IS NULL OR DATE(vd.fecha_salida) >= CAST(:fechaInicio AS date)
        )
        AND (
            CAST(:fechaFin AS date) IS NULL OR DATE(vd.fecha_salida) <= CAST(:fechaFin AS date)
        )
    """,
            nativeQuery = true
    )
    Page<Viaje> viajesFiltrados(
            @Param("texto") String texto,
            @Param("estado") String estado,
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("excluirCompletados") boolean excluirCompletados,
            Pageable pageable
    );
}
