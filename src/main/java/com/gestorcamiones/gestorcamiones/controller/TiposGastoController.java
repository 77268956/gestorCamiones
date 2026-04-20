package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.gasto.TiposgastosDTO;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.gasto.TipoGastoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipogasto")
@Tag(name = "tipoGasto" , description = "Operaciones para majar los tipos de gastos")
public class TiposGastoController {
    private final TipoGastoService service;

    public TiposGastoController(TipoGastoService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista de tipos de gastos", description = "Retorna todos los tipo de gastos que hay")
    List<TiposgastosDTO> listaTiposGasto(){
        return service.listaTiposGastos();
    }

    @PostMapping
    @Operation(summary = "Crear tipo de gasto", description = "Crea un nuevo tipo de gasto.")
    public ResponseEntity<TiposgastosDTO> crear(
            @RequestBody TiposgastosDTO dto,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        return ResponseEntity.ok(service.agregarTipoGasto(dto, admin.getUsuario()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar tipo de gasto", description = "Actualiza un tipo de gasto por id.")
    public ResponseEntity<TiposgastosDTO> actualizar(
            @PathVariable long id,
            @RequestBody TiposgastosDTO dto,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        return ResponseEntity.ok(service.actualizarTipoGasto(id, dto, admin.getUsuario()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar tipo de gasto", description = "Elimina logicamente un tipo de gasto por id.")
    public ResponseEntity<Void> eliminar(
            @PathVariable long id,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        service.eliminarTipoGasto(id, admin.getUsuario());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(params = {"page", "size"})
    @Operation(summary = "Lista de tipos de gastos con filtros", description = "Retorna todos los tipo de gastos que hay con un busacador")
    Page<TiposgastosDTO> listaTiposGastoFiltro(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam (required = false) String q){
        Pageable pageable = PageRequest.of(page, size);
        return service.listaTiposGastosFiltros(pageable, q);
    }
}
