package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.usuario.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.usuario.EditarUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.usuario.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.service.Interface.IUsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public Page<UsuarioPerfilDTO> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) EstadoEmpleado estado
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "idUsuarios"));
        return usuarioService.listarUsuarios(pageable, q, estado);
    }

    @GetMapping("/estados")
    @Operation(summary = "Listar estados de empleado", description = "Devuelve los estados disponibles para la entidad usuario.")
    public EstadoEmpleado[] estadoEmpleado(){
        return usuarioService.estados();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar usuario", description = "Actualiza la informacion de un usuario.")
    public ResponseEntity<UsuarioPerfilDTO> editar(
            @PathVariable Long id,
            @Valid @RequestBody EditarUsuarioDTO dto
    ) {
        return ResponseEntity.ok(usuarioService.editarUsuario(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar usuario", description = "Elimina un usuario por su id.")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }
}
