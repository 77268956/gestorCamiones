package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.CrearCamionDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import com.gestorcamiones.gestorcamiones.service.CamionServicio;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/camiones")
public class CamionController {

    private final CamionServicio camionService;

    public CamionController(CamionServicio camionService) {
        this.camionService = camionService;
    }

    @GetMapping("/estados")
    public EstadoCamion[] listarEstados() {
        return camionService.estadosCamion();
    }

    @GetMapping
    public List<CrearCamionDTO> listarCamiones() {
        return camionService.listarCamiones();
    }

    @PostMapping
    public ResponseEntity<CrearCamionDTO> crearCamion(
            @Valid @RequestBody CrearCamionDTO dto) {

        return ResponseEntity.ok(camionService.crearCamion(dto));
    }
}
