package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.GastoViaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface GastosViajeRepository extends JpaRepository<GastoViaje, Long> {

    // ── Dashboard queries ────────────────────────────────────────────────────

    /** Suma total de gastos de viaje en un mes/año. */
    @Query(value = """
        SELECT COALESCE(SUM(gv.monto), 0)
        FROM gastos_viaje gv
        WHERE gv.deleted_at IS NULL
          AND EXTRACT(MONTH FROM gv.fecha_gasto) = :mes
          AND EXTRACT(YEAR  FROM gv.fecha_gasto) = :ano
    """, nativeQuery = true)
    BigDecimal sumMontoByMes(@Param("mes") int mes, @Param("ano") int ano);

    /** Suma gastos de viaje agrupados por mes del año. */
    @Query(value = """
        SELECT EXTRACT(MONTH FROM gv.fecha_gasto) AS mes,
               COALESCE(SUM(gv.monto), 0)         AS total
        FROM gastos_viaje gv
        WHERE gv.deleted_at IS NULL
          AND EXTRACT(YEAR FROM gv.fecha_gasto) = :ano
        GROUP BY mes
        ORDER BY mes
    """, nativeQuery = true)
    List<Object[]> sumMontoByMesAgrupado(@Param("ano") int ano);

    /** Detalle de gastos de viaje de un mes: tipo + suma. */
    @Query(value = """
        SELECT tg.tipo_gasto AS tipo, COALESCE(SUM(gv.monto), 0) AS total
        FROM gastos_viaje gv
        JOIN tipo_gasto tg ON tg.id_tipo_gasto = gv.id_tipo_gasto
        WHERE gv.deleted_at IS NULL
          AND EXTRACT(MONTH FROM gv.fecha_gasto) = :mes
          AND EXTRACT(YEAR  FROM gv.fecha_gasto) = :ano
        GROUP BY tg.tipo_gasto
        ORDER BY total DESC
    """, nativeQuery = true)
    List<Object[]> detalleGastosByTipoMes(@Param("mes") int mes, @Param("ano") int ano);
}
