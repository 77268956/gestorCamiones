package com.gestorcamiones.gestorcamiones.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO con los datos agregados para el dashboard principal.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResumenDTO {

    // ── KPIs del mes actual ──────────────────────────────────────────────────
    private long       viajesMes;
    private BigDecimal ingresosMes;
    private BigDecimal gastoViajesMes;
    private BigDecimal gastoGeneralesMes;
    private BigDecimal gastoCamionesMes;
    private BigDecimal totalGastosMes;
    private BigDecimal balanceMes;          // ingresos - gastos totales

    // ── Datos para gráficas anuales (índice 0 = enero) ──────────────────────
    private List<Long>       viajesPorMes;       // Gráfica de barras
    private List<BigDecimal> ingresosPorMes;     // Gráfica de líneas
    private List<BigDecimal> gastosPorMes;       // Gráfica de líneas (suma gasto viaje + general + camión)

    // ── Distribución de estados ──────────────────────────────────────────────
    private Map<String, Long> viajesPorEstado;   // Gráfica de dona

    // ── Contexto ─────────────────────────────────────────────────────────────
    private int mes;
    private int anio;

}
