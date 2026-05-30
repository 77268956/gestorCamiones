package com.gestorcamiones.gestorcamiones.service.gasto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestorcamiones.gestorcamiones.dto.gasto.GastoCamionDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.entity.GastoCamion;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.mapper.GastoCamionMapper;
import com.gestorcamiones.gestorcamiones.repository.CamionRepository;
import com.gestorcamiones.gestorcamiones.repository.GastoCamionRepository;
import com.gestorcamiones.gestorcamiones.repository.TipoGastoRepository;
import com.gestorcamiones.gestorcamiones.service.auditoria.AuditoriaDetalladaService;
import com.gestorcamiones.gestorcamiones.service.storage.UploadStorageService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class GastoCamionService {

    private final GastoCamionRepository gastoCamionRepository;
    private final CamionRepository camionRepository;
    private final TipoGastoRepository tipoGastoRepository;
    private final GastoCamionMapper gastoCamionMapper;
    private final AuditoriaDetalladaService auditoria;
    private final ObjectMapper objectMapper;
    private final UploadStorageService uploadStorageService;

    public GastoCamionService(
            GastoCamionRepository gastoCamionRepository,
            CamionRepository camionRepository,
            TipoGastoRepository tipoGastoRepository,
            GastoCamionMapper gastoCamionMapper,
            AuditoriaDetalladaService auditoria,
            ObjectMapper objectMapper,
            UploadStorageService uploadStorageService
    ) {
        this.gastoCamionRepository = gastoCamionRepository;
        this.camionRepository = camionRepository;
        this.tipoGastoRepository = tipoGastoRepository;
        this.gastoCamionMapper = gastoCamionMapper;
        this.auditoria = auditoria;
        this.objectMapper = objectMapper;
        this.uploadStorageService = uploadStorageService;
    }

    @Transactional
    public List<GastoCamionDTO> listarPorCamion(Long idCamion) {
        if (idCamion == null) {
            throw new IllegalArgumentException("Id de camion es requerido");
        }
        return gastoCamionMapper.toDTO(
                gastoCamionRepository.findByCamion_IdCamionOrderByFechaGastoDescIdGastoCamionDesc(idCamion)
        );
    }

    @Transactional
    public GastoCamionDTO crearGasto(Long idCamion, GastoCamionDTO dto, Usuario admin) {
        if (idCamion == null) {
            throw new IllegalArgumentException("Id de camion es requerido");
        }
        if (dto == null) {
            throw new IllegalArgumentException("No se recibieron datos del gasto");
        }
        if (dto.getIdTipoGasto() == null) {
            throw new IllegalArgumentException("El tipo de gasto es obligatorio");
        }
        if (dto.getMonto() == null) {
            throw new IllegalArgumentException("El monto es obligatorio");
        }
        if (admin == null) {
            throw new IllegalArgumentException("Usuario administrador no identificado");
        }

        Camion camion = camionRepository.findById(idCamion)
                .orElseThrow(() -> new IllegalArgumentException("Camion no encontrado con ID: " + idCamion));

        TipoGasto tipo = tipoGastoRepository.findById(dto.getIdTipoGasto())
                .orElseThrow(() -> new IllegalArgumentException("Tipo de gasto no encontrado con ID: " + dto.getIdTipoGasto()));

        GastoCamion entity = new GastoCamion();
        entity.setCamion(camion);
        entity.setTipoGasto(tipo);
        entity.setMonto(dto.getMonto());
        entity.setDescripcion(dto.getDescripcion());
        entity.setEvidenciaUrl(dto.getEvidenciaUrl());
        entity.setFechaGasto(dto.getFechaGasto() != null ? dto.getFechaGasto() : LocalDate.now());
        entity.setAdmin(admin);

        GastoCamion guardado = gastoCamionRepository.save(entity);

        // Importante: no serializar entidades JPA directamente (puede disparar LazyInitializationException).
        GastoCamionDTO dtoGuardado = gastoCamionMapper.toDTO(guardado);
        JsonNode despuesJson = objectMapper.valueToTree(dtoGuardado);
        auditoria.registrar(
                "gasto_camion",
                admin.getIdUsuarios(),
                AccionAuditoria.CREATE,
                (admin.getNombre() == null ? "" : admin.getNombre()) + " " + (admin.getApellido() == null ? "" : admin.getApellido()),
                null,
                despuesJson,
                guardado.getIdGastoCamion()
        );

        return dtoGuardado;
    }

    @Transactional
    public GastoCamionDTO crearGastoConArchivo(Long idCamion, GastoCamionDTO dto, org.springframework.web.multipart.MultipartFile evidencia, Usuario admin) {
        if (dto == null) dto = new GastoCamionDTO();
        String url = uploadStorageService.store("gasto_camion", "camion_" + idCamion, evidencia);
        dto.setEvidenciaUrl(url);
        return crearGasto(idCamion, dto, admin);
    }

    @Transactional
    public void eliminarGasto(Long idCamion, Long idGasto, Usuario admin) {
        if (idCamion == null || idGasto == null) {
            throw new IllegalArgumentException("Id de camion e id de gasto son requeridos");
        }
        if (admin == null) {
            throw new IllegalArgumentException("Usuario administrador no identificado");
        }

        GastoCamion gasto = gastoCamionRepository.findById(idGasto)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado con ID: " + idGasto));

        if (gasto.getCamion() == null || gasto.getCamion().getIdCamion() == null || !gasto.getCamion().getIdCamion().equals(idCamion)) {
            throw new IllegalArgumentException("El gasto no pertenece al camion indicado");
        }

        // Importante: no serializar entidades JPA directamente (lazy collections).
        JsonNode antesJson = objectMapper.valueToTree(gastoCamionMapper.toDTO(gasto));
        gastoCamionRepository.delete(gasto);

        auditoria.registrar(
                "gasto_camion",
                admin.getIdUsuarios(),
                AccionAuditoria.DELETE,
                (admin.getNombre() == null ? "" : admin.getNombre()) + " " + (admin.getApellido() == null ? "" : admin.getApellido()),
                antesJson,
                null,
                gasto.getIdGastoCamion()
        );
    }

    @Transactional
    public GastoCamionDTO editarGastoConArchivo(Long idCamion, Long idGasto, GastoCamionDTO dto, org.springframework.web.multipart.MultipartFile evidencia, Usuario admin) {
        if (idCamion == null || idGasto == null) {
            throw new IllegalArgumentException("Id de camion e id de gasto son requeridos");
        }
        if (dto == null) {
            throw new IllegalArgumentException("No se recibieron datos del gasto");
        }
        if (dto.getIdTipoGasto() == null) {
            throw new IllegalArgumentException("El tipo de gasto es obligatorio");
        }
        if (dto.getMonto() == null) {
            throw new IllegalArgumentException("El monto es obligatorio");
        }
        if (admin == null) {
            throw new IllegalArgumentException("Usuario administrador no identificado");
        }

        GastoCamion gasto = gastoCamionRepository.findById(idGasto)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado con ID: " + idGasto));

        if (gasto.getCamion() == null || gasto.getCamion().getIdCamion() == null || !gasto.getCamion().getIdCamion().equals(idCamion)) {
            throw new IllegalArgumentException("El gasto no pertenece al camion indicado");
        }

        JsonNode antesJson = objectMapper.valueToTree(gastoCamionMapper.toDTO(gasto));

        TipoGasto tipo = tipoGastoRepository.findById(dto.getIdTipoGasto())
                .orElseThrow(() -> new IllegalArgumentException("Tipo de gasto no encontrado con ID: " + dto.getIdTipoGasto()));

        gasto.setTipoGasto(tipo);
        gasto.setMonto(dto.getMonto());
        gasto.setDescripcion(dto.getDescripcion());
        gasto.setFechaGasto(dto.getFechaGasto() != null ? dto.getFechaGasto() : gasto.getFechaGasto());

        String nuevaUrl = uploadStorageService.store("gasto_camion", "camion_" + idCamion + "_gasto_" + idGasto, evidencia);
        if (nuevaUrl != null) {
            gasto.setEvidenciaUrl(nuevaUrl);
        }

        GastoCamion guardado = gastoCamionRepository.save(gasto);
        GastoCamionDTO out = gastoCamionMapper.toDTO(guardado);

        JsonNode despuesJson = objectMapper.valueToTree(out);
        auditoria.registrar(
                "gasto_camion",
                admin.getIdUsuarios(),
                AccionAuditoria.UPDATE,
                (admin.getNombre() == null ? "" : admin.getNombre()) + " " + (admin.getApellido() == null ? "" : admin.getApellido()),
                antesJson,
                despuesJson,
                guardado.getIdGastoCamion()
        );

        return out;
    }
}
