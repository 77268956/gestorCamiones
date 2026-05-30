package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.GastoCamion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface GastoCamionRepository extends JpaRepository<GastoCamion, Long> {
    List<GastoCamion> findByCamion_IdCamionOrderByFechaGastoDescIdGastoCamionDesc(Long idCamion);

    // ── Dashboard queries ────────────────────────────────────────────────────

    /** Suma total de gastos de camión en un mes/año. */
    @Query(value = """
        SELECT COALESCE(SUM(gc.monto), 0)
        FROM gasto_camion gc
        WHERE gc.deleted_at IS NULL
          AND EXTRACT(MONTH FROM gc.fecha_gasto) = :mes
          AND EXTRACT(YEAR  FROM gc.fecha_gasto) = :ano
    """, nativeQuery = true)
    BigDecimal sumMontoByMes(@Param("mes") int mes, @Param("ano") int ano);

    /** Suma gastos de camión agrupados por mes del año. */
    @Query(value = """
        SELECT EXTRACT(MONTH FROM gc.fecha_gasto) AS mes,
               COALESCE(SUM(gc.monto), 0)         AS total
        FROM gasto_camion gc
        WHERE gc.deleted_at IS NULL
          AND EXTRACT(YEAR FROM gc.fecha_gasto) = :ano
        GROUP BY mes
        ORDER BY mes
    """, nativeQuery = true)
    List<Object[]> sumMontoByMesAgrupado(@Param("ano") int ano);

    /** Detalle de gastos de camión de un mes: tipo + suma. */
    @Query(value = """
        SELECT tg.tipo_gasto AS tipo, COALESCE(SUM(gc.monto), 0) AS total
        FROM gasto_camion gc
        JOIN tipo_gasto tg ON tg.id_tipo_gasto = gc.id_tipo_gasto
        WHERE gc.deleted_at IS NULL
          AND EXTRACT(MONTH FROM gc.fecha_gasto) = :mes
          AND EXTRACT(YEAR  FROM gc.fecha_gasto) = :ano
        GROUP BY tg.tipo_gasto
        ORDER BY total DESC
    """, nativeQuery = true)
    List<Object[]> detalleGastosByTipoMes(@Param("mes") int mes, @Param("ano") int ano);
}

