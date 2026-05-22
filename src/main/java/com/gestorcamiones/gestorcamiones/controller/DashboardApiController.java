package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.DashboardResumenDTO;
import com.gestorcamiones.gestorcamiones.dto.ReporteMensualDTO;
import com.gestorcamiones.gestorcamiones.service.dashboard.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * API REST del dashboard — devuelve JSON para actualización dinámica sin recargar la página.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardApiController {

    private final DashboardService dashboardService;

    public DashboardApiController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/resumen?mes=5&ano=2026
     * Si no se pasan parámetros, usa el mes y año actuales.
     */
    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumenDTO> resumen(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano) {

        int m = mes != null ? mes : LocalDate.now().getMonthValue();
        int a = ano != null ? ano : LocalDate.now().getYear();

        return ResponseEntity.ok(dashboardService.getDashboardResumen(m, a));
    }

    /**
     * GET /api/dashboard/reporte-mensual?mes=5&ano=2026
     * Si no se pasan parámetros, usa el mes y año actuales.
     */
    @GetMapping("/reporte-mensual")
    public ResponseEntity<ReporteMensualDTO> reporteMensual(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano) {

        int m = mes != null ? mes : LocalDate.now().getMonthValue();
        int a = ano != null ? ano : LocalDate.now().getYear();

        return ResponseEntity.ok(dashboardService.getReporteMensual(m, a));
    }
}
