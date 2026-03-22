package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.ViajeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
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
}
