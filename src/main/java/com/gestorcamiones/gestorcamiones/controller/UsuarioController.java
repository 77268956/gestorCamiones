package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.DTO.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.entity.EstadoEmpleado;
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

    // ✅ ÚNICO MÉTODO POST - Usa CrearUsuarioDTO que tiene más campos
    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody CrearUsuarioDTO dto) {
        try {
            usuarioService.crearUsuarioCompleto(dto);
            return ResponseEntity.ok(Map.of("message", "Usuario creado exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error al crear usuario: " + e.getMessage()));
        }
    }

    @GetMapping
    public List<UsuarioItemResponse> listar() {
        return usuarioService.listar().stream().map(this::toResponse).toList();
    }

    @GetMapping("/estados")
    public EstadoEmpleado[] estadoEmpleado(){
        return usuarioService.estados();
    }

    private UsuarioItemResponse toResponse(Usuario usuario) {
        Login login = usuario.getLogin();
        String email = login != null ? login.getEmail() : null;
        String estadoCuenta = login != null && login.getEstadoCuenta() != null ? login.getEstadoCuenta().name() : null;
        String rol = usuario.getRol() != null ? usuario.getRol().getRol() : null;
        return new UsuarioItemResponse(usuario.getId(), usuario.getNombre(), email, rol, estadoCuenta);
    }

    // DTOs al final
    public record UsuarioItemResponse(Long id, String nombre, String email, String rol, String estadoCuenta) {
    }
}