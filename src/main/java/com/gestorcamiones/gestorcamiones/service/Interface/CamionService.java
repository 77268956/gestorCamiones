package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.CrearCamionDTO;
import com.gestorcamiones.gestorcamiones.dto.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.EditarUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;

import java.util.List;

public interface CamionService {

    List<CrearCamionDTO> listarCamiones();

    UsuarioPerfilDTO obtenerPerfilCamion(Long id);

    CrearCamionDTO crearCamion(CrearCamionDTO dto);

    CrearCamionDTO editarCamion(Long id, Camion camion);

    void eliminarCamion(Long id);

    EstadoCamion[] estadosCamion();
}
