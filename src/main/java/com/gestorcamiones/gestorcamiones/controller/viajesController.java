package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.viaje.ActualizarViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.ViajeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Controller
@RestController("api/camion")

public class viajesController {
    private ViajeService viajeService;

    public viajesController(ViajeService viajeService) {
        this.viajeService = viajeService;
    }

    @PostMapping("/viajes")
    public CrearViajeDTO crearViaje(
            @RequestBody CrearViajeDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return viajeService.CrearViaje(dto, userDetails.getUsuario());
    }

    @PutMapping("/viajes/{idViaje}")
    public ActualizarViajeDTO actualizarViaje(
            @PathVariable Long idViaje,
            @RequestBody ActualizarViajeDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return viajeService.actualizarViaje(idViaje, dto, userDetails.getUsuario());
    }
}
