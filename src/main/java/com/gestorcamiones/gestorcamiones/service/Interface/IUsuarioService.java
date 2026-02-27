package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.EditarUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;

import java.util.List;

public interface IUsuarioService {

    List<UsuarioPerfilDTO> listarUsuarios();

    UsuarioPerfilDTO obtenerPerfil(Long id);

    UsuarioPerfilDTO crearUsuario(CrearUsuarioDTO crearUsuarioDTO);

    UsuarioPerfilDTO editarUsuario(Long id, EditarUsuarioDTO editarUsuarioDTO);

    void eliminarUsuario(Long id);

    EstadoEmpleado[] estados();
}