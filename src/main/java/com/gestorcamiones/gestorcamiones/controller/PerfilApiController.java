package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.usuario.IUsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/perfil")
public class PerfilApiController {

    private final IUsuarioService usuarioService;

    public PerfilApiController(IUsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
        }

        String nuevaPassword = request.get("password");
        if (nuevaPassword == null || nuevaPassword.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña no puede estar vacía"));
        }

        try {
            usuarioService.cambiarPassword(userDetails.getIdUsuario(), nuevaPassword);
            return ResponseEntity.ok(Map.of("message", "Contraseña actualizada con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
