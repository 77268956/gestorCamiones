package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.entity.EstadoCamion;
import com.gestorcamiones.gestorcamiones.service.CamionServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/camion")
public class CamionController {

    private final CamionServicio camionService;

    public CamionController(CamionServicio camionService) {
        this.camionService = camionService;
    }

    @GetMapping("/estados")
    public EstadoCamion[] listarEstados() {
        return camionService.listarEstados();
    }
}