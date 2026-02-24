package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody CrearUsuarioRequest request) {
        try {
            Usuario creado = usuarioService.crearConLogin(request.nombre(), request.email(), request.password(), "ROLE_USER");
            return ResponseEntity.ok(Map.of(
                    "id", creado.getId(),
                    "nombre", creado.getNombre()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public List<UsuarioItemResponse> listar() {
        return usuarioService.listar().stream().map(this::toResponse).toList();
    }

    private UsuarioItemResponse toResponse(Usuario usuario) {
        Login login = usuario.getLogin();
        String email = login != null ? login.getEmail() : null;
        String estadoCuenta = login != null && login.getEstadoCuenta() != null ? login.getEstadoCuenta().name() : null;
        String rol = usuario.getRol() != null ? usuario.getRol().getRol() : null;
        return new UsuarioItemResponse(usuario.getId(), usuario.getNombre(), email, rol, estadoCuenta);
    }

    public record CrearUsuarioRequest(String nombre, String email, String password) {
    }

    public record UsuarioItemResponse(Long id, String nombre, String email, String rol, String estadoCuenta) {
    }
}
