package com.gestorcamiones.gestorcamiones.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO que contiene toda la información necesaria para los reportes mensuales.
 */
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

    public ReporteMensualDTO() {}

    public int getMes() { return mes; }
    public void setMes(int mes) { this.mes = mes; }

    public int getAno() { return ano; }
    public void setAno(int ano) { this.ano = ano; }

    public List<ViajeReporteDTO> getViajes() { return viajes; }
    public void setViajes(List<ViajeReporteDTO> viajes) { this.viajes = viajes; }

    public long getTotalViajes() { return totalViajes; }
    public void setTotalViajes(long totalViajes) { this.totalViajes = totalViajes; }

    public BigDecimal getIngresos() { return ingresos; }
    public void setIngresos(BigDecimal ingresos) { this.ingresos = ingresos; }

    public BigDecimal getGastoViajes() { return gastoViajes; }
    public void setGastoViajes(BigDecimal gastoViajes) { this.gastoViajes = gastoViajes; }

    public BigDecimal getGastoGenerales() { return gastoGenerales; }
    public void setGastoGenerales(BigDecimal gastoGenerales) { this.gastoGenerales = gastoGenerales; }

    public BigDecimal getGastoCamiones() { return gastoCamiones; }
    public void setGastoCamiones(BigDecimal gastoCamiones) { this.gastoCamiones = gastoCamiones; }

    public BigDecimal getTotalGastos() { return totalGastos; }
    public void setTotalGastos(BigDecimal totalGastos) { this.totalGastos = totalGastos; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public Map<String, BigDecimal> getDesgloseGastoViajes() { return desgloseGastoViajes; }
    public void setDesgloseGastoViajes(Map<String, BigDecimal> desgloseGastoViajes) { this.desgloseGastoViajes = desgloseGastoViajes; }

    public Map<String, BigDecimal> getDesgloseGastoGenerales() { return desgloseGastoGenerales; }
    public void setDesgloseGastoGenerales(Map<String, BigDecimal> desgloseGastoGenerales) { this.desgloseGastoGenerales = desgloseGastoGenerales; }

    public Map<String, BigDecimal> getDesgloseGastoCamiones() { return desgloseGastoCamiones; }
    public void setDesgloseGastoCamiones(Map<String, BigDecimal> desgloseGastoCamiones) { this.desgloseGastoCamiones = desgloseGastoCamiones; }

    /**
     * DTO interno para listar los detalles de un viaje en el reporte.
     */
    public static class ViajeReporteDTO {
        private Long id;
        private String nombre;
        private String chofer;
        private String estado;
        private LocalDateTime fechaSalida;
        private LocalDateTime fechaLlegada;
        private boolean pagado;

        public ViajeReporteDTO() {}

        public ViajeReporteDTO(Long id, String nombre, String chofer, String estado, LocalDateTime fechaSalida, LocalDateTime fechaLlegada, boolean pagado) {
            this.id = id;
            this.nombre = nombre;
            this.chofer = chofer;
            this.estado = estado;
            this.fechaSalida = fechaSalida;
            this.fechaLlegada = fechaLlegada;
            this.pagado = pagado;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getChofer() { return chofer; }
        public void setChofer(String chofer) { this.chofer = chofer; }

        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }

        public LocalDateTime getFechaSalida() { return fechaSalida; }
        public void setFechaSalida(LocalDateTime fechaSalida) { this.fechaSalida = fechaSalida; }

        public LocalDateTime getFechaLlegada() { return fechaLlegada; }
        public void setFechaLlegada(LocalDateTime fechaLlegada) { this.fechaLlegada = fechaLlegada; }

        public boolean isPagado() { return pagado; }
        public void setPagado(boolean pagado) { this.pagado = pagado; }
    }
}
