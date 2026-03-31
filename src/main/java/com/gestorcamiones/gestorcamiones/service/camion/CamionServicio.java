package com.gestorcamiones.gestorcamiones.service.camion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestorcamiones.gestorcamiones.dto.camion.CamionDTO;
import com.gestorcamiones.gestorcamiones.dto.usuario.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import com.gestorcamiones.gestorcamiones.mapper.CamionMapper;
import com.gestorcamiones.gestorcamiones.repository.CamionRepository;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.auditoria.AuditoriaDetalladaService;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementa la logica de negocio para gestion del catalogo de camiones.
 */
@Service
public class CamionServicio implements ICamionService {

    private final CamionRepository camionRepository;
    private final CamionMapper camionMapper;
    private final AuditoriaDetalladaService auditori;
    private final ObjectMapper objectMapper;



    public CamionServicio(CamionRepository camionRepository, CamionMapper camionMapper, AuditoriaDetalladaService auditori, ObjectMapper objectMapper) {
        this.camionRepository = camionRepository;
        this.camionMapper = camionMapper;
        this.auditori = auditori;
        this.objectMapper = objectMapper;
    }


    @Override
    public Page<CamionDTO> listarCamiones(Pageable pageable, String texto, EstadoCamion estado) {
        String textoNormalizado = (texto == null || texto.isBlank()) ? null : texto.trim();
        String estadoNormalizado = (estado == null) ? null : estado.name();
        List<CamionDTO> filtrados = camionRepository.buscarFiltrados(textoNormalizado, estadoNormalizado)
                .stream()
                .map(camionMapper::toDTO)
                .toList();

        int pageSize = Math.max(pageable.getPageSize(), 1);
        int start = (int) Math.min(pageable.getOffset(), filtrados.size());
        int end = Math.min(start + pageSize, filtrados.size());

        return new PageImpl<>(filtrados.subList(start, end), pageable, filtrados.size());
    }

    @Override
    public UsuarioPerfilDTO obtenerPerfilCamion(Long id) {
        return null;
    }

    @Override
    @Transactional
    public CamionDTO crearCamion(CamionDTO dto, CustomUserDetails admin) {
        Camion camion = camionMapper.toEntity(dto);
        if (camionRepository.existsByPlaca(dto.getPlaca())) {
            throw new IllegalArgumentException("La placa ya esta registrada");
        }

        if (camionRepository.existsByCodigo(dto.getCodigo())) {
            throw new IllegalArgumentException("El codigo ya esta registrado");
        }

        Camion camionGuardado = camionRepository.save(camion);

        JsonNode despuesJson = objectMapper.valueToTree(camionGuardado);

        auditori.registrar(
                "camiones",
                admin.getIdUsuario(),
                AccionAuditoria.CREATE,
                admin.getUsername(),
                null,
                despuesJson,
                camion.getIdCamion()
        );


        return camionMapper.toDTO(camionGuardado);
    }

    @Override
    public CamionDTO editarCamion(Long id, CamionDTO dto, CustomUserDetails admin) {
        Camion camion = camionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Camion no encontrado con ID: " + id));

        JsonNode antesJson = objectMapper.valueToTree(camion);
        if (camionRepository.existsByPlacaAndIdCamionNot(dto.getPlaca(), id)) {
            throw new IllegalArgumentException("La placa ya esta registrada");
        }

        if (camionRepository.existsByCodigoAndIdCamionNot(dto.getCodigo(), id)) {
            throw new IllegalArgumentException("El codigo ya esta registrado");
        }

        camion.setPlaca(dto.getPlaca());
        camion.setCodigo(dto.getCodigo());
        camion.setNombre(dto.getNombre());
        camion.setEstadoCamion(dto.getEstadoCamion());
        camion.setModelo(dto.getModelo());
        camion.setComentario(dto.getComentario());
        Camion camionGuardado = camionRepository.save(camion);

        JsonNode despuesJson = objectMapper.valueToTree(camionGuardado);
        auditori.registrar(
                "camiones",
                admin.getIdUsuario(),
                AccionAuditoria.UPDATE,
                admin.getUsername(),
                antesJson,
                despuesJson,
                camion.getIdCamion()
        );
        return camionMapper.toDTO(camionGuardado);
    }

    @Override
    @Transactional
    public void eliminarCamion(Long id, CustomUserDetails admin) {
        Camion camion = camionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Camion no encontrado con ID: " + id));
        camionRepository.delete(camion);

        JsonNode antesJson = objectMapper.valueToTree(camion);
        auditori.registrar(
                "camiones",
                admin.getIdUsuario(),
                AccionAuditoria.DELETE,
                admin.getUsername(),
                antesJson,
                null,
                camion.getIdCamion()
        );
    }

    @Override
    public EstadoCamion[] estadosCamion() {
        return EstadoCamion.values();
    }
}
