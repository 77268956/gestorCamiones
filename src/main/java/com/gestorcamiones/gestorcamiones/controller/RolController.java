package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.RolDTO;
import com.gestorcamiones.gestorcamiones.service.RolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Endpoint REST para exponer roles de usuarios.
 */
@RestController
@RequestMapping("/api/rol")
@Tag(name = "Roles", description = "Consulta de roles disponibles en el sistema.")
public class RolController {
    private final RolService rolService;
    public RolController(RolService rolService) {
        this.rolService = rolService;
    }

    @GetMapping("/estados")
    @Operation(summary = "Listar roles", description = "Retorna los roles existentes para asignacion de usuarios.")
    public List<RolDTO> listar() {
        return rolService.listarTodos().stream()
                .map(rol -> new RolDTO(rol.getIdRol(), rol.getRol()))
                .collect(Collectors.toList());
    }
}
