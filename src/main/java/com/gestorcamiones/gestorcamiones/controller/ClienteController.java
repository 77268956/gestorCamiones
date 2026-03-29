package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.cliente.ClienteDTO;
import com.gestorcamiones.gestorcamiones.service.cliente.IClientesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clientes")
@Tag(name = "Clientes", description = "Operaciones de administracion de clientes.")
public class ClienteController {

    private final IClientesService clientesService;

    public ClienteController(IClientesService clientesService) {
        this.clientesService = clientesService;
    }

    @GetMapping
    @Operation(summary = "Listar clientes", description = "Obtiene la lista de clientes con paginacion.")
    public Page<ClienteDTO> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return clientesService.listar(pageable, q);
    }

    @PostMapping
    @Operation(summary = "Crear cliente", description = "Registra un nuevo cliente.")
    public ResponseEntity<ClienteDTO> crear(@Valid @RequestBody ClienteDTO dto) {
        return ResponseEntity.ok(clientesService.crear(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar cliente", description = "Actualiza los datos de un cliente.")
    public ResponseEntity<ClienteDTO> editar(@PathVariable Long id, @Valid @RequestBody ClienteDTO dto) {
        return ResponseEntity.ok(clientesService.editar(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cliente", description = "Elimina un cliente por su id.")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        clientesService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
