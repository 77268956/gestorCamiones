package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.service.Interface.IUsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para alta y consulta de usuarios.
 */
@RestController
@RequestMapping("/api/usuarios")
@Tag(name = "Usuarios", description = "Operaciones de administracion de usuarios del sistema.")
public class UsuarioController {

    private final IUsuarioService usuarioService;

    public UsuarioController(IUsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    @Operation(summary = "Crear usuario", description = "Crea un usuario y su acceso de login asociado.")
    public ResponseEntity<UsuarioPerfilDTO> crear(@Valid @RequestBody CrearUsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.crearUsuario(dto));
    }

    @GetMapping
    @Operation(summary = "Listar usuarios", description = "Obtiene la lista de perfiles de usuario registrados.")
    public List<UsuarioPerfilDTO> listar() {
        return usuarioService.listarUsuarios();
    }

    @GetMapping("/estados")
    @Operation(summary = "Listar estados de empleado", description = "Devuelve los estados disponibles para la entidad usuario.")
    public EstadoEmpleado[] estadoEmpleado(){
        return usuarioService.estados();
    }
}
