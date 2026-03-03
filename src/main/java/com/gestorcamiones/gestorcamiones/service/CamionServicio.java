package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.CamionDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import com.gestorcamiones.gestorcamiones.mapper.CamionMapper;
import com.gestorcamiones.gestorcamiones.repository.CamionRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.ICamionService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementa la logica de negocio para gestion del catalogo de camiones.
 */
@Service
public class CamionServicio implements ICamionService {

    private final CamionRepository camionRepository;

    public CamionServicio(CamionRepository camionRepository) {
        this.camionRepository = camionRepository;
    }


    @Override
    public List<CamionDTO> listarCamiones() {
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
    public CamionDTO crearCamion(CamionDTO dto) {
        Camion camion = CamionMapper.toEntity(dto);
        Camion camionGuardado = camionRepository.save(camion);
        return CamionMapper.toDTO(camionGuardado);
    }

    @Override
    public CamionDTO editarCamion(Long id, CamionDTO dto) {
        Camion camion = camionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Camión no encontrado con ID: " + id));

        camion.setPlaca(dto.getPlaca());
        camion.setCodigo(dto.getCodigo());
        camion.setNombre(dto.getNombre());
        camion.setEstadoCamion(dto.getEstadoCamion());
        camion.setModelo(dto.getModelo());
        camion.setComentario(dto.getComentario());
        Camion camionGuardado = camionRepository.save(camion);
        return CamionMapper.toDTO(camionGuardado);
    }

    @Override
    @Transactional
    public void eliminarCamion(Long id) {
        Camion camion = camionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Camión no encontrado con ID: " + id));
        camionRepository.delete(camion);
    }

    @Override
    public EstadoCamion[] estadosCamion() {
        return EstadoCamion.values();
    }

}
