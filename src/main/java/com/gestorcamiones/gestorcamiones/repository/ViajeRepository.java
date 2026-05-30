package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Viaje;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ViajeRepository extends JpaRepository<Viaje, Long> {

    @Query(
            value = """
        SELECT DISTINCT v.*
        FROM viaje v
        LEFT JOIN viaje_detalle vd ON vd.id_viaje = v.id_viaje AND vd.deleted_at IS NULL
        LEFT JOIN usuarios u ON u.id_usuarios = v.id_admin AND u.deleted_at IS NULL
        WHERE v.deleted_at IS NULL
        AND (
            CAST(:texto AS TEXT) IS NULL OR
            LOWER(v.nombre_viaje) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%')) OR
            LOWER(u.nombre) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
        )
        AND (
            CAST(:estado AS TEXT) IS NULL OR
            CAST(vd.estado AS text) = CAST(:estado AS TEXT)
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
            CAST(:texto AS TEXT) IS NULL OR
            LOWER(v.nombre_viaje) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%')) OR
            LOWER(u.nombre) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
        )
        AND (
            CAST(:estado AS TEXT) IS NULL OR
            CAST(vd.estado AS text) = CAST(:estado AS TEXT)
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

    boolean existsByNombreViajeIgnoreCaseAndIdViajeNot(String nombreViaje, Long idViaje);

    // ── Dashboard queries ────────────────────────────────────────────────────

    /** Cuenta viajes creados en un mes y año concreto (por created_at del viaje). */
    @Query(value = """
        SELECT COUNT(DISTINCT v.id_viaje)
        FROM viaje v
        WHERE v.deleted_at IS NULL
          AND EXTRACT(MONTH FROM v.created_at) = :mes
          AND EXTRACT(YEAR  FROM v.created_at) = :ano
    """, nativeQuery = true)
    long countViajesByMesYAno(@Param("mes") int mes, @Param("ano") int ano);

    /** Cuenta viajes por cada mes del año indicado (12 filas: mes, total). */
    @Query(value = """
        SELECT EXTRACT(MONTH FROM v.created_at) AS mes,
               COUNT(DISTINCT v.id_viaje)        AS total
        FROM viaje v
        WHERE v.deleted_at IS NULL
          AND EXTRACT(YEAR FROM v.created_at) = :ano
        GROUP BY mes
        ORDER BY mes
    """, nativeQuery = true)
    List<Object[]> countViajesByMesAgrupado(@Param("ano") int ano);

    /** Cuenta viajes por estado (para gráfica de dona). */
    @Query(value = """
        SELECT CAST(vd.estado AS text) AS estado,
               COUNT(DISTINCT v.id_viaje) AS total
        FROM viaje v
        JOIN viaje_detalle vd ON vd.id_viaje = v.id_viaje AND vd.deleted_at IS NULL
        WHERE v.deleted_at IS NULL
        GROUP BY vd.estado
    """, nativeQuery = true)
    List<Object[]> countViajesByEstado();

    /** Suma ingresos del mes: valor_declarado de lotes en viajes pagados. */
    @Query(value = """
        SELECT COALESCE(SUM(l.valor_declarado), 0)
        FROM viaje v
        JOIN viaje_detalle vd ON vd.id_viaje = v.id_viaje AND vd.deleted_at IS NULL
        JOIN viaje_lote vl    ON vl.id_viaje = v.id_viaje
        JOIN lote l           ON l.id_lote   = vl.id_lote  AND l.deleted_at IS NULL
        WHERE v.deleted_at IS NULL
          AND vd.pagado = true
          AND EXTRACT(MONTH FROM v.created_at) = :mes
          AND EXTRACT(YEAR  FROM v.created_at) = :ano
    """, nativeQuery = true)
    BigDecimal sumIngresosByMes(@Param("mes") int mes, @Param("ano") int ano);

    /** Suma ingresos agrupados por mes del año. */
    @Query(value = """
        SELECT EXTRACT(MONTH FROM v.created_at) AS mes,
               COALESCE(SUM(l.valor_declarado), 0) AS total
        FROM viaje v
        JOIN viaje_detalle vd ON vd.id_viaje = v.id_viaje AND vd.deleted_at IS NULL
        JOIN viaje_lote vl    ON vl.id_viaje = v.id_viaje
        JOIN lote l           ON l.id_lote   = vl.id_lote  AND l.deleted_at IS NULL
        WHERE v.deleted_at IS NULL
          AND vd.pagado = true
          AND EXTRACT(YEAR FROM v.created_at) = :ano
        GROUP BY mes
        ORDER BY mes
    """, nativeQuery = true)
    List<Object[]> sumIngresosByMesAgrupado(@Param("ano") int ano);

    /** Lista de viajes en un mes y año concreto con detalles para reportes. */
    @Query(value = """
        SELECT v.id_viaje AS id,
               v.nombre_viaje AS nombre,
               u.nombre AS chofer,
               CAST(vd.estado AS text) AS estado,
               vd.fecha_salida AS fechaSalida,
               vd.fecha_llegada AS fechaLlegada,
               vd.pagado AS pagado
        FROM viaje v
        JOIN viaje_detalle vd ON vd.id_viaje = v.id_viaje AND vd.deleted_at IS NULL
        JOIN usuarios u ON u.id_usuarios = vd.id_chofer
        WHERE v.deleted_at IS NULL
          AND EXTRACT(MONTH FROM v.created_at) = :mes
          AND EXTRACT(YEAR  FROM v.created_at) = :ano
        ORDER BY v.id_viaje DESC
    """, nativeQuery = true)
    List<Object[]> findViajesReporteMensual(@Param("mes") int mes, @Param("ano") int ano);
}

