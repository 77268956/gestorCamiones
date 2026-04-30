package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoCamionDTO;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.gasto.GastoCamionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/camiones/{idCamion}/gastos")
@Tag(name = "Gastos Camion", description = "Operaciones para gastos asociados a un camion.")
public class GastoCamionController {

    private final GastoCamionService gastoCamionService;

    public GastoCamionController(GastoCamionService gastoCamionService) {
        this.gastoCamionService = gastoCamionService;
    }

    @GetMapping
    @Operation(summary = "Listar gastos de camion", description = "Retorna la lista de gastos asociados a un camion.")
    public List<GastoCamionDTO> listar(@PathVariable Long idCamion) {
        return gastoCamionService.listarPorCamion(idCamion);
    }

    @PostMapping
    @Operation(summary = "Crear gasto de camion", description = "Crea un gasto asociado a un camion.")
    public ResponseEntity<GastoCamionDTO> crear(
            @PathVariable Long idCamion,
            @RequestBody GastoCamionDTO dto,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        return ResponseEntity.ok(gastoCamionService.crearGasto(idCamion, dto, admin.getUsuario()));
    }

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Crear gasto de camion (con evidencia)", description = "Crea un gasto asociado a un camion, permitiendo subir archivo de evidencia.")
    public ResponseEntity<GastoCamionDTO> crearConEvidencia(
            @PathVariable Long idCamion,
            @RequestParam("idTipoGasto") Long idTipoGasto,
            @RequestParam("monto") BigDecimal monto,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "fechaGasto", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaGasto,
            @RequestPart(value = "evidencia", required = false) MultipartFile evidencia,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        GastoCamionDTO dto = new GastoCamionDTO();
        dto.setIdTipoGasto(idTipoGasto);
        dto.setMonto(monto);
        dto.setDescripcion(descripcion);
        dto.setFechaGasto(fechaGasto);
        return ResponseEntity.ok(gastoCamionService.crearGastoConArchivo(idCamion, dto, evidencia, admin.getUsuario()));
    }

    @DeleteMapping("/{idGasto}")
    @Operation(summary = "Eliminar gasto de camion", description = "Elimina logicamente un gasto asociado a un camion.")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long idCamion,
            @PathVariable Long idGasto,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        gastoCamionService.eliminarGasto(idCamion, idGasto, admin.getUsuario());
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{idGasto}", consumes = "multipart/form-data")
    @Operation(summary = "Editar gasto de camion", description = "Edita un gasto asociado a un camion. Evidencia es opcional.")
    public ResponseEntity<GastoCamionDTO> editar(
            @PathVariable Long idCamion,
            @PathVariable Long idGasto,
            @RequestParam("idTipoGasto") Long idTipoGasto,
            @RequestParam("monto") BigDecimal monto,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "fechaGasto", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaGasto,
            @RequestPart(value = "evidencia", required = false) MultipartFile evidencia,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        GastoCamionDTO dto = new GastoCamionDTO();
        dto.setIdTipoGasto(idTipoGasto);
        dto.setMonto(monto);
        dto.setDescripcion(descripcion);
        dto.setFechaGasto(fechaGasto);
        return ResponseEntity.ok(gastoCamionService.editarGastoConArchivo(idCamion, idGasto, dto, evidencia, admin.getUsuario()));
    }
}
