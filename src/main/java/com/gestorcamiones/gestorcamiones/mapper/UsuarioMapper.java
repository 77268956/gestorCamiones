package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Usuario;

public class UsuarioMapper {

    public static UsuarioPerfilDTO mapToPerfilDTO(Usuario usuario) {
        Login login = usuario.getLogin();

        return new UsuarioPerfilDTO(
                usuario.getIdUsuarios(),
                usuario.getNombre(),
                usuario.getApellido(),
                login != null ? login.getEmail() : null,
                login != null ? login.getUsuario() : null,
                usuario.getTelefono(),
                usuario.getDui(),
                usuario.getRol() != null ? usuario.getRol().getRol() : null,
                usuario.getRol() != null ? usuario.getRol().getIdRol() : null,
                usuario.getEstadoEmpleado(),
                usuario.getFotoUrl()
        );
    }

}
