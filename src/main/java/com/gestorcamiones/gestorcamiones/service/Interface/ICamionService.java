package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.CamionDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;

import java.util.List;

public interface ICamionService {

    List<CamionDTO> listarCamiones();

    UsuarioPerfilDTO obtenerPerfilCamion(Long id);

    CamionDTO crearCamion(CamionDTO dto);

    CamionDTO editarCamion(Long id, CamionDTO dto);

    void eliminarCamion(Long id);

    EstadoCamion[] estadosCamion();
}
