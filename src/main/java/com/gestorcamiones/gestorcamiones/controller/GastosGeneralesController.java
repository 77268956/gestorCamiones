package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastosGeneralesDTO;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.gasto.GastosGeneralesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/gastos-generales")
@Tag(name = "Gastos Generales", description = "Operaciones para gastos generales del negocio.")
public class GastosGeneralesController {

    private final GastosGeneralesService gastosGeneralesService;

    public GastosGeneralesController(GastosGeneralesService gastosGeneralesService) {
        this.gastosGeneralesService = gastosGeneralesService;
    }

    @GetMapping
    @Operation(summary = "Listar gastos generales", description = "Retorna la lista de gastos generales, opcionalmente filtrada por fechas.")
    public org.springframework.data.domain.Page<GastosGeneralesDTO> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, 
                size, 
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Order.desc("fechaGasto"),
                        org.springframework.data.domain.Sort.Order.desc("idGastosGenerales")
                )
        );
        return gastosGeneralesService.listarPorRangoFechas(fechaInicio, fechaFin, pageable);
    }

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Crear gasto general (con evidencia)", description = "Crea un gasto general permitiendo subir archivo de evidencia.")
    public ResponseEntity<GastosGeneralesDTO> crearConEvidencia(
            @RequestParam("idTipoGasto") Long idTipoGasto,
            @RequestParam("monto") BigDecimal monto,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "fechaGasto", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaGasto,
            @RequestParam(value = "evidencia", required = false) MultipartFile evidencia,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        GastosGeneralesDTO dto = new GastosGeneralesDTO();
        dto.setIdTipoGasto(idTipoGasto);
        dto.setMonto(monto);
        dto.setDescripcion(descripcion);
        dto.setFechaGasto(fechaGasto);
        return ResponseEntity.ok(gastosGeneralesService.crearGastoConArchivo(dto, evidencia, admin.getUsuario()));
    }
    
    @PostMapping
    @Operation(summary = "Crear gasto general", description = "Crea un gasto general.")
    public ResponseEntity<GastosGeneralesDTO> crear(
            @RequestBody GastosGeneralesDTO dto,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        return ResponseEntity.ok(gastosGeneralesService.crearGasto(dto, admin.getUsuario()));
    }

    @DeleteMapping("/{idGasto}")
    @Operation(summary = "Eliminar gasto general", description = "Elimina logicamente un gasto general.")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long idGasto,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        gastosGeneralesService.eliminarGasto(idGasto, admin.getUsuario());
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{idGasto}", consumes = "multipart/form-data")
    @Operation(summary = "Editar gasto general", description = "Edita un gasto general. Evidencia es opcional.")
    public ResponseEntity<GastosGeneralesDTO> editar(
            @PathVariable Long idGasto,
            @RequestParam("idTipoGasto") Long idTipoGasto,
            @RequestParam("monto") BigDecimal monto,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "fechaGasto", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaGasto,
            @RequestParam(value = "evidencia", required = false) MultipartFile evidencia,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        GastosGeneralesDTO dto = new GastosGeneralesDTO();
        dto.setIdTipoGasto(idTipoGasto);
        dto.setMonto(monto);
        dto.setDescripcion(descripcion);
        dto.setFechaGasto(fechaGasto);
        return ResponseEntity.ok(gastosGeneralesService.editarGastoConArchivo(idGasto, dto, evidencia, admin.getUsuario()));
    }
}
