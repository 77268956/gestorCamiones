package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.camion.CamionDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.camion.CamionServicio;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Expone los endpoints REST para consulta y creacion de camiones.
 */
@RestController
@RequestMapping("/api/camiones")
@Tag(name = "Camiones", description = "Operaciones relacionadas con el catalogo de camiones.")
public class CamionController {

    private final CamionServicio camionService;

    public CamionController(CamionServicio camionService) {
        this.camionService = camionService;
    }

    @GetMapping("/estados")
    @Operation(summary = "Listar estados de camion", description = "Devuelve todos los estados posibles para registrar un camion.")
    public EstadoCamion[] listarEstados() {
        return camionService.estadosCamion();
    }

    @GetMapping
    @Operation(summary = "Listar camiones", description = "Retorna el listado de camiones registrados.")
    public Page<CamionDTO> listarCamiones(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "idCamion,desc") String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) EstadoCamion estado,
            @RequestParam(defaultValue = "false") boolean excluirAsignados,
            @RequestParam(required = false) Long viajeIdActual
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return camionService.listarCamiones(pageable, q, estado, excluirAsignados, viajeIdActual);
    }

    @PostMapping
    @Operation(summary = "Crear camion", description = "Registra un nuevo camion con los datos enviados en el body.")
    public ResponseEntity<CamionDTO> crearCamion(
            @Valid @RequestBody CamionDTO dto,
            @AuthenticationPrincipal CustomUserDetails admin) {
        return ResponseEntity.ok(camionService.crearCamion(dto, admin));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update camion", description = "Update un camion")
    public ResponseEntity<CamionDTO> updateCamion(
            @PathVariable Long id,
            @Valid @RequestBody CamionDTO dto,
            @AuthenticationPrincipal CustomUserDetails admin
    ){
        return ResponseEntity.ok(camionService.editarCamion(id, dto, admin));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar camion", description = "Elimina logicamente un camion por su id.")
    public ResponseEntity<Void> eliminarCamion(@PathVariable Long id,
                                               @AuthenticationPrincipal CustomUserDetails admin) {
        camionService.eliminarCamion(id, admin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/foto", consumes = "multipart/form-data")
    @Operation(summary = "Subir foto de camion", description = "Sube y asocia una foto al perfil del camion.")
    public ResponseEntity<Map<String, String>> subirFoto(
            @PathVariable Long id,
            @RequestParam("foto") MultipartFile foto,
            @AuthenticationPrincipal CustomUserDetails admin
    ) {
        String url = camionService.subirFoto(id, foto, admin);
        return ResponseEntity.ok(Map.of("fotoUrl", url));
    }
}
