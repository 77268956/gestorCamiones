package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.GastosGenerales;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface GastosGeneralesRepository extends JpaRepository<GastosGenerales, Long> {

    /**
     * Cuenta todos los registros activos (respeta @SQLRestriction deleted_at IS NULL).
     * Se usa para construir el Page manualmente al paginar con JOIN FETCH.
     */
    @Query("SELECT COUNT(g) FROM GastosGenerales g")
    long countAll();

    /**
     * Obtiene una página de IDs ordenada y paginada (sin JOIN FETCH, seguro con paginación).
     */
    @Query("SELECT g.idGastosGenerales FROM GastosGenerales g")
    List<Long> findAllIds(Pageable pageable);

    /**
     * Carga los registros completos con sus relaciones para los IDs dados.
     * Sin LIMIT → no hay conflicto entre JOIN FETCH y paginación.
     */
    @Query("SELECT g FROM GastosGenerales g JOIN FETCH g.tipoGasto JOIN FETCH g.admin " +
           "WHERE g.idGastosGenerales IN :ids")
    List<GastosGenerales> findByIdsWithRelations(@Param("ids") List<Long> ids);

    /* ── Filtro por rango de fechas ─────────────────────────────────────────── */

    @Query("SELECT COUNT(g) FROM GastosGenerales g " +
           "WHERE g.fechaGasto BETWEEN :startDate AND :endDate")
    long countByFechaGastoBetween(@Param("startDate") LocalDate startDate,
                                  @Param("endDate")   LocalDate endDate);

    @Query("SELECT g.idGastosGenerales FROM GastosGenerales g " +
           "WHERE g.fechaGasto BETWEEN :startDate AND :endDate")
    List<Long> findIdsByFechaGastoBetween(@Param("startDate") LocalDate startDate,
                                          @Param("endDate")   LocalDate endDate,
                                          Pageable pageable);

    // ── Dashboard queries ────────────────────────────────────────────────────

    /** Suma total de gastos generales en un mes/año. */
    @Query(value = """
        SELECT COALESCE(SUM(g.monto), 0)
        FROM gastos_generales g
        WHERE g.deleted_at IS NULL
          AND EXTRACT(MONTH FROM g.fecha_gasto) = :mes
          AND EXTRACT(YEAR  FROM g.fecha_gasto) = :ano
    """, nativeQuery = true)
    BigDecimal sumMontoByMes(@Param("mes") int mes, @Param("ano") int ano);

    /** Suma gastos generales agrupados por mes del año. */
    @Query(value = """
        SELECT EXTRACT(MONTH FROM g.fecha_gasto) AS mes,
               COALESCE(SUM(g.monto), 0)         AS total
        FROM gastos_generales g
        WHERE g.deleted_at IS NULL
          AND EXTRACT(YEAR FROM g.fecha_gasto) = :ano
        GROUP BY mes
        ORDER BY mes
    """, nativeQuery = true)
    List<Object[]> sumMontoByMesAgrupado(@Param("ano") int ano);

    /** Detalle de gastos generales de un mes: tipo + suma. */
    @Query(value = """
        SELECT tg.tipo_gasto AS tipo, COALESCE(SUM(g.monto), 0) AS total
        FROM gastos_generales g
        JOIN tipo_gasto tg ON tg.id_tipo_gasto = g.id_tipo_gasto
        WHERE g.deleted_at IS NULL
          AND EXTRACT(MONTH FROM g.fecha_gasto) = :mes
          AND EXTRACT(YEAR  FROM g.fecha_gasto) = :ano
        GROUP BY tg.tipo_gasto
        ORDER BY total DESC
    """, nativeQuery = true)
    List<Object[]> detalleByTipoMes(@Param("mes") int mes, @Param("ano") int ano);
}
