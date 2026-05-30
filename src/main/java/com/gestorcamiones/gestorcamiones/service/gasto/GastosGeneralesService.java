package com.gestorcamiones.gestorcamiones.service.gasto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestorcamiones.gestorcamiones.dto.gasto.GastosGeneralesDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.entity.GastosGenerales;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.mapper.GastosGeneralesMapper;
import com.gestorcamiones.gestorcamiones.repository.GastosGeneralesRepository;
import com.gestorcamiones.gestorcamiones.repository.TipoGastoRepository;
import com.gestorcamiones.gestorcamiones.service.auditoria.AuditoriaDetalladaService;
import com.gestorcamiones.gestorcamiones.service.storage.UploadStorageService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GastosGeneralesService {

    private final GastosGeneralesRepository gastosGeneralesRepository;
    private final TipoGastoRepository tipoGastoRepository;
    private final GastosGeneralesMapper gastosGeneralesMapper;
    private final AuditoriaDetalladaService auditoria;
    private final ObjectMapper objectMapper;
    private final UploadStorageService uploadStorageService;

    public GastosGeneralesService(
            GastosGeneralesRepository gastosGeneralesRepository,
            TipoGastoRepository tipoGastoRepository,
            GastosGeneralesMapper gastosGeneralesMapper,
            AuditoriaDetalladaService auditoria,
            ObjectMapper objectMapper,
            UploadStorageService uploadStorageService
    ) {
        this.gastosGeneralesRepository = gastosGeneralesRepository;
        this.tipoGastoRepository = tipoGastoRepository;
        this.gastosGeneralesMapper = gastosGeneralesMapper;
        this.auditoria = auditoria;
        this.objectMapper = objectMapper;
        this.uploadStorageService = uploadStorageService;
    }

    /**
     * Lista todos los gastos con paginación segura:
     * 1) Obtiene los IDs paginados (con ORDER BY seguro).
     * 2) Carga las entidades completas con JOIN FETCH en una segunda query.
     * Esto evita el problema de Hibernate al combinar JOIN FETCH + LIMIT.
     */
    @Transactional
    public Page<GastosGeneralesDTO> listarTodo(org.springframework.data.domain.Pageable pageable) {
        long total = gastosGeneralesRepository.countAll();
        List<Long> ids = gastosGeneralesRepository.findAllIds(pageable);
        if (ids.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, total);
        }
        List<GastosGenerales> entities = gastosGeneralesRepository.findByIdsWithRelations(ids);
        // Restaurar el orden original de los IDs (el IN no garantiza orden)
        Map<Long, GastosGenerales> byId = entities.stream()
                .collect(Collectors.toMap(GastosGenerales::getIdGastosGenerales, e -> e));
        List<GastosGeneralesDTO> dtos = ids.stream()
                .filter(byId::containsKey)
                .map(id -> gastosGeneralesMapper.toDTO(byId.get(id)))
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, total);
    }

    @Transactional
    public Page<GastosGeneralesDTO> listarPorRangoFechas(LocalDate inicio, LocalDate fin, org.springframework.data.domain.Pageable pageable) {
        if (inicio != null && fin != null) {
            long total = gastosGeneralesRepository.countByFechaGastoBetween(inicio, fin);
            List<Long> ids = gastosGeneralesRepository.findIdsByFechaGastoBetween(inicio, fin, pageable);
            if (ids.isEmpty()) {
                return new PageImpl<>(Collections.emptyList(), pageable, total);
            }
            List<GastosGenerales> entities = gastosGeneralesRepository.findByIdsWithRelations(ids);
            Map<Long, GastosGenerales> byId = entities.stream()
                    .collect(Collectors.toMap(GastosGenerales::getIdGastosGenerales, e -> e));
            List<GastosGeneralesDTO> dtos = ids.stream()
                    .filter(byId::containsKey)
                    .map(id -> gastosGeneralesMapper.toDTO(byId.get(id)))
                    .collect(Collectors.toList());
            return new PageImpl<>(dtos, pageable, total);
        }
        return listarTodo(pageable);
    }

    @Transactional
    public GastosGeneralesDTO crearGasto(GastosGeneralesDTO dto, Usuario admin) {
        if (dto == null) throw new IllegalArgumentException("No se recibieron datos del gasto");
        if (dto.getIdTipoGasto() == null) throw new IllegalArgumentException("El tipo de gasto es obligatorio");
        if (dto.getMonto() == null) throw new IllegalArgumentException("El monto es obligatorio");
        if (admin == null) throw new IllegalArgumentException("Usuario administrador no identificado");

        TipoGasto tipo = tipoGastoRepository.findById(dto.getIdTipoGasto())
                .orElseThrow(() -> new IllegalArgumentException("Tipo de gasto no encontrado"));

        GastosGenerales entity = new GastosGenerales();
        entity.setTipoGasto(tipo);
        entity.setMonto(dto.getMonto());
        entity.setDescripcion(dto.getDescripcion());
        entity.setEvidenciaUrl(dto.getEvidenciaUrl());
        entity.setFechaGasto(dto.getFechaGasto() != null ? dto.getFechaGasto() : LocalDate.now());
        entity.setAdmin(admin);

        GastosGenerales guardado = gastosGeneralesRepository.save(entity);
        GastosGeneralesDTO dtoGuardado = gastosGeneralesMapper.toDTO(guardado);
        
        JsonNode despuesJson = objectMapper.valueToTree(dtoGuardado);
        auditoria.registrar(
                "gastos_generales",
                admin.getIdUsuarios(),
                AccionAuditoria.CREATE,
                (admin.getNombre() == null ? "" : admin.getNombre()) + " " + (admin.getApellido() == null ? "" : admin.getApellido()),
                null,
                despuesJson,
                guardado.getIdGastosGenerales()
        );

        return dtoGuardado;
    }

    @Transactional
    public GastosGeneralesDTO crearGastoConArchivo(GastosGeneralesDTO dto, org.springframework.web.multipart.MultipartFile evidencia, Usuario admin) {
        if (dto == null) dto = new GastosGeneralesDTO();
        String url = uploadStorageService.store("gastos_generales", "gasto_general_tmp", evidencia);
        dto.setEvidenciaUrl(url);
        return crearGasto(dto, admin);
    }

    @Transactional
    public GastosGeneralesDTO editarGastoConArchivo(Long idGasto, GastosGeneralesDTO dto, org.springframework.web.multipart.MultipartFile evidencia, Usuario admin) {
        if (idGasto == null) throw new IllegalArgumentException("Id del gasto es requerido");
        if (dto == null) throw new IllegalArgumentException("No se recibieron datos del gasto");
        if (dto.getIdTipoGasto() == null) throw new IllegalArgumentException("El tipo de gasto es obligatorio");
        if (dto.getMonto() == null) throw new IllegalArgumentException("El monto es obligatorio");
        if (admin == null) throw new IllegalArgumentException("Usuario administrador no identificado");

        GastosGenerales gasto = gastosGeneralesRepository.findById(idGasto)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado con ID: " + idGasto));

        JsonNode antesJson = objectMapper.valueToTree(gastosGeneralesMapper.toDTO(gasto));

        TipoGasto tipo = tipoGastoRepository.findById(dto.getIdTipoGasto())
                .orElseThrow(() -> new IllegalArgumentException("Tipo de gasto no encontrado"));

        gasto.setTipoGasto(tipo);
        gasto.setMonto(dto.getMonto());
        gasto.setDescripcion(dto.getDescripcion());
        gasto.setFechaGasto(dto.getFechaGasto() != null ? dto.getFechaGasto() : gasto.getFechaGasto());

        String nuevaUrl = uploadStorageService.store("gastos_generales", "gasto_general_" + idGasto, evidencia);
        if (nuevaUrl != null) {
            gasto.setEvidenciaUrl(nuevaUrl);
        }

        GastosGenerales guardado = gastosGeneralesRepository.save(gasto);
        GastosGeneralesDTO out = gastosGeneralesMapper.toDTO(guardado);

        JsonNode despuesJson = objectMapper.valueToTree(out);
        auditoria.registrar(
                "gastos_generales",
                admin.getIdUsuarios(),
                AccionAuditoria.UPDATE,
                (admin.getNombre() == null ? "" : admin.getNombre()) + " " + (admin.getApellido() == null ? "" : admin.getApellido()),
                antesJson,
                despuesJson,
                guardado.getIdGastosGenerales()
        );

        return out;
    }

    @Transactional
    public void eliminarGasto(Long idGasto, Usuario admin) {
        if (idGasto == null) throw new IllegalArgumentException("Id de gasto es requerido");
        if (admin == null) throw new IllegalArgumentException("Usuario administrador no identificado");

        GastosGenerales gasto = gastosGeneralesRepository.findById(idGasto)
                .orElseThrow(() -> new IllegalArgumentException("Gasto no encontrado con ID: " + idGasto));

        JsonNode antesJson = objectMapper.valueToTree(gastosGeneralesMapper.toDTO(gasto));
        gastosGeneralesRepository.delete(gasto);

        auditoria.registrar(
                "gastos_generales",
                admin.getIdUsuarios(),
                AccionAuditoria.DELETE,
                (admin.getNombre() == null ? "" : admin.getNombre()) + " " + (admin.getApellido() == null ? "" : admin.getApellido()),
                antesJson,
                null,
                gasto.getIdGastosGenerales()
        );
    }
}
