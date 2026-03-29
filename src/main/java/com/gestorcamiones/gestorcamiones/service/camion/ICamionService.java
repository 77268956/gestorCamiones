package com.gestorcamiones.gestorcamiones.service.camion;

import com.gestorcamiones.gestorcamiones.dto.camion.CamionDTO;
import com.gestorcamiones.gestorcamiones.dto.usuario.UsuarioPerfilDTO;
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
