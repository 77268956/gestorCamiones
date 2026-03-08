package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.CamionDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ICamionService {

    Page<CamionDTO> listarCamiones(Pageable pageable, String texto, EstadoCamion estado);

    UsuarioPerfilDTO obtenerPerfilCamion(Long id);

    CamionDTO crearCamion(CamionDTO dto);

    CamionDTO editarCamion(Long id, CamionDTO dto);

    void eliminarCamion(Long id);

    EstadoCamion[] estadosCamion();
}
