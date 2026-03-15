package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.EditarUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IUsuarioService {

    Page<UsuarioPerfilDTO> listarUsuarios(Pageable pageable, String texto, EstadoEmpleado estado);

    UsuarioPerfilDTO obtenerPerfil(Long id);

    UsuarioPerfilDTO crearUsuario(CrearUsuarioDTO crearUsuarioDTO);

    UsuarioPerfilDTO editarUsuario(Long id, EditarUsuarioDTO dto);

    void eliminarUsuario(Long id);

    EstadoEmpleado[] estados();
}
