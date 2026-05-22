package com.gestorcamiones.gestorcamiones.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO con los datos agregados para el dashboard principal.
 */
public class DashboardResumenDTO {

    // ── KPIs del mes actual ──────────────────────────────────────────────────
    private long    viajesMes;
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
    private int ano;

    // ── Constructores ─────────────────────────────────────────────────────────
    public DashboardResumenDTO() {}

    // ── Getters & Setters ─────────────────────────────────────────────────────
    public long getViajesMes()                      { return viajesMes; }
    public void setViajesMes(long v)                { this.viajesMes = v; }

    public BigDecimal getIngresosMes()              { return ingresosMes; }
    public void setIngresosMes(BigDecimal v)        { this.ingresosMes = v; }

    public BigDecimal getGastoViajesMes()           { return gastoViajesMes; }
    public void setGastoViajesMes(BigDecimal v)     { this.gastoViajesMes = v; }

    public BigDecimal getGastoGeneralesMes()        { return gastoGeneralesMes; }
    public void setGastoGeneralesMes(BigDecimal v)  { this.gastoGeneralesMes = v; }

    public BigDecimal getGastoCamionesMes()         { return gastoCamionesMes; }
    public void setGastoCamionesMes(BigDecimal v)   { this.gastoCamionesMes = v; }

    public BigDecimal getTotalGastosMes()           { return totalGastosMes; }
    public void setTotalGastosMes(BigDecimal v)     { this.totalGastosMes = v; }

    public BigDecimal getBalanceMes()               { return balanceMes; }
    public void setBalanceMes(BigDecimal v)         { this.balanceMes = v; }

    public List<Long> getViajesPorMes()                  { return viajesPorMes; }
    public void setViajesPorMes(List<Long> v)            { this.viajesPorMes = v; }

    public List<BigDecimal> getIngresosPorMes()          { return ingresosPorMes; }
    public void setIngresosPorMes(List<BigDecimal> v)    { this.ingresosPorMes = v; }

    public List<BigDecimal> getGastosPorMes()            { return gastosPorMes; }
    public void setGastosPorMes(List<BigDecimal> v)      { this.gastosPorMes = v; }

    public Map<String, Long> getViajesPorEstado()        { return viajesPorEstado; }
    public void setViajesPorEstado(Map<String, Long> v)  { this.viajesPorEstado = v; }

    public int getMes()       { return mes; }
    public void setMes(int v) { this.mes = v; }

    public int getAno()       { return ano; }
    public void setAno(int v) { this.ano = v; }
}
