package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.auditoria.AuditoriaLoginPageDTO;
import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaDetallada;
import com.gestorcamiones.gestorcamiones.service.auditoria.IAuditoriaDetalladaService;
import com.gestorcamiones.gestorcamiones.service.auditoria.IAuditoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@Tag(name = "Auditoria", description = "Operaciones de consulta de bitacora del sistema.")
public class AuditoriaController {

    private final IAuditoriaService auditoriaService;
    public final IAuditoriaDetalladaService auditoriaDetalladaService;

    public AuditoriaController(IAuditoriaService auditoriaService, IAuditoriaDetalladaService auditoriaDetalladaService) {
        this.auditoriaService = auditoriaService;
        this.auditoriaDetalladaService = auditoriaDetalladaService;
    }

    @GetMapping("/login")
    @Operation(summary = "Auditoria universal de login", description = "Consolida eventos de login, logout e intentos fallidos.")
    public AuditoriaLoginPageDTO obtenerAuditoriaLogin(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta,
            @RequestParam(required = false) String tipoEvento,
            @RequestParam(required = false) String resultado,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return auditoriaService.obtenerAuditoriaLogin(desde, hasta, tipoEvento, resultado, q, page, size);
    }

    @GetMapping("/detallada")
    @Operation(summary = "Auditoria detallada", description = "Lista auditoria detallada del sistema.")
    public Page<AuditoriaDetallada> listAuditoriaDetallada(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta,
            @RequestParam(required = false) String tabla,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return auditoriaDetalladaService.obtenerAuditoriaDetallada(desde, hasta, tabla, accion, q, page, size);
    }


}
