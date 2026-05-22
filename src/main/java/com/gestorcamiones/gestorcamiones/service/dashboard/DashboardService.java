package com.gestorcamiones.gestorcamiones.service.dashboard;

import com.gestorcamiones.gestorcamiones.dto.DashboardResumenDTO;
import com.gestorcamiones.gestorcamiones.dto.ReporteMensualDTO;
import com.gestorcamiones.gestorcamiones.dto.ReporteMensualDTO.ViajeReporteDTO;
import com.gestorcamiones.gestorcamiones.repository.GastoCamionRepository;
import com.gestorcamiones.gestorcamiones.repository.GastosGeneralesRepository;
import com.gestorcamiones.gestorcamiones.repository.GastosViajeRepository;
import com.gestorcamiones.gestorcamiones.repository.ViajeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio que agrega los datos para el dashboard principal.
 */
@Service
public class DashboardService {

    private final ViajeRepository          viajeRepo;
    private final GastosViajeRepository    gastoViajeRepo;
    private final GastosGeneralesRepository gastoGeneralRepo;
    private final GastoCamionRepository    gastoCamionRepo;

    public DashboardService(ViajeRepository viajeRepo,
                            GastosViajeRepository gastoViajeRepo,
                            GastosGeneralesRepository gastoGeneralRepo,
                            GastoCamionRepository gastoCamionRepo) {
        this.viajeRepo        = viajeRepo;
        this.gastoViajeRepo   = gastoViajeRepo;
        this.gastoGeneralRepo = gastoGeneralRepo;
        this.gastoCamionRepo  = gastoCamionRepo;
    }

    /**
     * Devuelve el resumen completo del dashboard para el año y mes actuales.
     *
     * @param mes mes (1-12)
     * @param ano año (ej. 2026)
     */
    public DashboardResumenDTO getDashboardResumen(int mes, int ano) {
        DashboardResumenDTO dto = new DashboardResumenDTO();
        dto.setMes(mes);
        dto.setAno(ano);

        // ── KPIs del mes ──────────────────────────────────────────────────────
        long viajes = viajeRepo.countViajesByMesYAno(mes, ano);
        dto.setViajesMes(viajes);

        BigDecimal ingresos      = safe(viajeRepo.sumIngresosByMes(mes, ano));
        BigDecimal gastoViajes   = safe(gastoViajeRepo.sumMontoByMes(mes, ano));
        BigDecimal gastoGeneral  = safe(gastoGeneralRepo.sumMontoByMes(mes, ano));
        BigDecimal gastoCamiones = safe(gastoCamionRepo.sumMontoByMes(mes, ano));

        BigDecimal totalGastos = gastoViajes.add(gastoGeneral).add(gastoCamiones);
        BigDecimal balance     = ingresos.subtract(totalGastos);

        dto.setIngresosMes(ingresos);
        dto.setGastoViajesMes(gastoViajes);
        dto.setGastoGeneralesMes(gastoGeneral);
        dto.setGastoCamionesMes(gastoCamiones);
        dto.setTotalGastosMes(totalGastos);
        dto.setBalanceMes(balance);

        // ── Gráficas anuales ──────────────────────────────────────────────────
        dto.setViajesPorMes(buildLongArray(viajeRepo.countViajesByMesAgrupado(ano)));
        dto.setIngresosPorMes(buildDecimalArray(viajeRepo.sumIngresosByMesAgrupado(ano)));

        // gastos totales por mes = viajes + generales + camiones
        List<BigDecimal> gv  = buildDecimalArray(gastoViajeRepo.sumMontoByMesAgrupado(ano));
        List<BigDecimal> gg  = buildDecimalArray(gastoGeneralRepo.sumMontoByMesAgrupado(ano));
        List<BigDecimal> gc  = buildDecimalArray(gastoCamionRepo.sumMontoByMesAgrupado(ano));
        List<BigDecimal> gt  = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            gt.add(gv.get(i).add(gg.get(i)).add(gc.get(i)));
        }
        dto.setGastosPorMes(gt);

        // ── Viajes por estado ─────────────────────────────────────────────────
        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (Object[] row : viajeRepo.countViajesByEstado()) {
            porEstado.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        dto.setViajesPorEstado(porEstado);

        return dto;
    }

    /**
     * Genera la información detallada para los reportes mensuales de un mes/año concreto.
     */
    public ReporteMensualDTO getReporteMensual(int mes, int ano) {
        ReporteMensualDTO dto = new ReporteMensualDTO();
        dto.setMes(mes);
        dto.setAno(ano);

        // 1. Viajes del mes
        List<Object[]> viajesRaw = viajeRepo.findViajesReporteMensual(mes, ano);
        List<ViajeReporteDTO> viajesList = new ArrayList<>();
        for (Object[] row : viajesRaw) {
            Long id = ((Number) row[0]).longValue();
            String nombre = String.valueOf(row[1]);
            String chofer = String.valueOf(row[2]);
            String estado = String.valueOf(row[3]);
            LocalDateTime fechaSalida = toLocalDateTime(row[4]);
            LocalDateTime fechaLlegada = toLocalDateTime(row[5]);
            boolean pagado = (Boolean) row[6];
            viajesList.add(new ViajeReporteDTO(id, nombre, chofer, estado, fechaSalida, fechaLlegada, pagado));
        }
        dto.setViajes(viajesList);
        dto.setTotalViajes(viajesList.size());

        // 2. Totales financieros
        BigDecimal ingresos      = safe(viajeRepo.sumIngresosByMes(mes, ano));
        BigDecimal gastoViajes   = safe(gastoViajeRepo.sumMontoByMes(mes, ano));
        BigDecimal gastoGeneral  = safe(gastoGeneralRepo.sumMontoByMes(mes, ano));
        BigDecimal gastoCamiones = safe(gastoCamionRepo.sumMontoByMes(mes, ano));

        BigDecimal totalGastos = gastoViajes.add(gastoGeneral).add(gastoCamiones);
        BigDecimal balance     = ingresos.subtract(totalGastos);

        dto.setIngresos(ingresos);
        dto.setGastoViajes(gastoViajes);
        dto.setGastoGenerales(gastoGeneral);
        dto.setGastoCamiones(gastoCamiones);
        dto.setTotalGastos(totalGastos);
        dto.setBalance(balance);

        // 3. Desgloses de gastos por categoría (para tablas detalladas)
        dto.setDesgloseGastoViajes(buildDesgloseMap(gastoViajeRepo.detalleGastosByTipoMes(mes, ano)));
        dto.setDesgloseGastoGenerales(buildDesgloseMap(gastoGeneralRepo.detalleByTipoMes(mes, ano)));
        dto.setDesgloseGastoCamiones(buildDesgloseMap(gastoCamionRepo.detalleGastosByTipoMes(mes, ano)));

        return dto;
    }

    private Map<String, BigDecimal> buildDesgloseMap(List<Object[]> rows) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String tipo = String.valueOf(row[0]);
            BigDecimal total = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            map.put(tipo, total);
        }
        return map;
    }

    private LocalDateTime toLocalDateTime(Object val) {
        if (val == null) return null;
        if (val instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime();
        }
        if (val instanceof LocalDateTime ldt) {
            return ldt;
        }
        return null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static BigDecimal safe(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    /**
     * Convierte filas [mes, total] en un array de 12 posiciones (índice 0 = enero).
     * Los meses sin datos quedan en 0.
     */
    private List<Long> buildLongArray(List<Object[]> rows) {
        Long[] arr = new Long[12];
        for (int i = 0; i < 12; i++) arr[i] = 0L;
        for (Object[] row : rows) {
            int m = ((Number) row[0]).intValue() - 1; // 0-based
            arr[m] = ((Number) row[1]).longValue();
        }
        return List.of(arr);
    }

    private List<BigDecimal> buildDecimalArray(List<Object[]> rows) {
        BigDecimal[] arr = new BigDecimal[12];
        for (int i = 0; i < 12; i++) arr[i] = BigDecimal.ZERO;
        for (Object[] row : rows) {
            int m = ((Number) row[0]).intValue() - 1; // 0-based
            arr[m] = new BigDecimal(row[1].toString());
        }
        return List.of(arr);
    }
}
