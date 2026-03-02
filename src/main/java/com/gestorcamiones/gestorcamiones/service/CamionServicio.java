package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.CrearCamionDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import com.gestorcamiones.gestorcamiones.mapper.CamionMapper;
import com.gestorcamiones.gestorcamiones.mapper.UsuarioMapper;
import com.gestorcamiones.gestorcamiones.repository.CamionRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.CamionService;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CamionServicio implements CamionService {

    private final CamionRepository camionRepository;

    public CamionServicio(CamionRepository camionRepository) {
        this.camionRepository = camionRepository;
    }


    @Override
    public List<CrearCamionDTO> listarCamiones() {
        return camionRepository.findAll()
                .stream()
                .map(CamionMapper::toDTO)
                .toList();
    }

    @Override
    public UsuarioPerfilDTO obtenerPerfilCamion(Long id) {
        return null;
    }


    @Override
    @Transactional
    public CrearCamionDTO crearCamion(CrearCamionDTO dto) {
        Camion camion = CamionMapper.toEntity(dto);
        Camion camionGuardado = camionRepository.save(camion);
        return CamionMapper.toDTO(camionGuardado);
    }

    @Override
    public CrearCamionDTO editarCamion(Long id, Camion camion) {
        return null;
    }

    @Override
    public void eliminarCamion(Long id) {

    }

    @Override
    public EstadoCamion[] estadosCamion() {
        return EstadoCamion.values();
    }

}
