package com.gestorcamiones.gestorcamiones.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO que contiene toda la información necesaria para los reportes mensuales.
 */

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReporteMensualDTO {

    private int mes;
    private int ano;

    // Reporte 1: Viajes del mes
    private List<ViajeReporteDTO> viajes;
    private long totalViajes;

    // Reporte 2 & 3: Totales Financieros
    private BigDecimal ingresos;
    private BigDecimal gastoViajes;
    private BigDecimal gastoGenerales;
    private BigDecimal gastoCamiones;
    private BigDecimal totalGastos;
    private BigDecimal balance;

    // Desglose de gastos por categoría
    private Map<String, BigDecimal> desgloseGastoViajes;
    private Map<String, BigDecimal> desgloseGastoGenerales;
    private Map<String, BigDecimal> desgloseGastoCamiones;


    /**
     * DTO interno para listar los detalles de un viaje en el reporte.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViajeReporteDTO {
        private Long id;
        private String nombre;
        private String chofer;
        private String estado;
        private LocalDateTime fechaSalida;
        private LocalDateTime fechaLlegada;
        private boolean pagado;
    }
}
