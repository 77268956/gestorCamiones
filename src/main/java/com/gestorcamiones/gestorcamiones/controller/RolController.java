package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.RolDTO;
import com.gestorcamiones.gestorcamiones.service.RolService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rol")
public class RolController {
    private final RolService rolService;

    public RolController(RolService rolService) {
        this.rolService = rolService;
    }

    @GetMapping("/estados")
    public List<RolDTO> listar() {
        return rolService.listarTodos().stream()
                .map(rol -> new RolDTO(rol.getIdRol(), rol.getRol()))
                .collect(Collectors.toList());
    }
}
