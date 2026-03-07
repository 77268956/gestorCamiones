package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.AuditoriaLoginPageDTO;
import com.gestorcamiones.gestorcamiones.service.Interface.IAuditoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auditoria")
@Tag(name = "Auditoria", description = "Operaciones de consulta de bitacora del sistema.")
public class AuditoriaController {

    private final IAuditoriaService auditoriaService;

    public AuditoriaController(IAuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
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
}
