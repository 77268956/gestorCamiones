package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
import com.gestorcamiones.gestorcamiones.repository.ViajesDetallerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador ligero para operaciones de parche en tramos (ViajeDetalle).
 * Permite actualizar pagado e iva sin editar el viaje completo.
 */
@RestController
@RequestMapping("/api/viajes/tramo")
public class ViajeTramoController {

    private final ViajesDetallerRepository repo;

    public ViajeTramoController(ViajesDetallerRepository repo) {
        this.repo = repo;
    }

    /**
     * PATCH /api/viajes/tramo/{id}/pagado
     * Body: { "valor": true/false }
     */
    @PatchMapping("/{id}/pagado")
    public ResponseEntity<Map<String, Object>> togglePagado(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        ViajeDetalle detalle = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Tramo no encontrado: " + id));
        Boolean valor = body.getOrDefault("valor", !Boolean.TRUE.equals(detalle.getPagado()));
        detalle.setPagado(valor);
        repo.save(detalle);
        return ResponseEntity.ok(Map.of("id", id, "pagado", valor));
    }

    /**
     * PATCH /api/viajes/tramo/{id}/iva
     * Body: { "valor": true/false }
     */
    @PatchMapping("/{id}/iva")
    public ResponseEntity<Map<String, Object>> toggleIva(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        ViajeDetalle detalle = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Tramo no encontrado: " + id));
        Boolean valor = body.getOrDefault("valor", !Boolean.TRUE.equals(detalle.getIva()));
        detalle.setIva(valor);
        repo.save(detalle);
        return ResponseEntity.ok(Map.of("id", id, "iva", valor));
    }
}
