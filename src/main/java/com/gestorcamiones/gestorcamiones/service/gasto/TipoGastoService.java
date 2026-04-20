package com.gestorcamiones.gestorcamiones.service.gasto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestorcamiones.gestorcamiones.dto.gasto.TiposgastosDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.mapper.TipoGastoMapper;
import com.gestorcamiones.gestorcamiones.repository.TipoGastoRepository;
import com.gestorcamiones.gestorcamiones.service.auditoria.AuditoriaDetalladaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TipoGastoService implements  ITipoGastoService{
    private final TipoGastoRepository tipoGastoRepository;
    private final TipoGastoMapper tipoGastoMapper;
    private final AuditoriaDetalladaService auditoria;
    private final ObjectMapper objectMapper;

    public TipoGastoService(TipoGastoRepository tipoGastoRepository, TipoGastoMapper tipoGastoMapper, AuditoriaDetalladaService auditoria, ObjectMapper objectMapper) {
        this.tipoGastoRepository = tipoGastoRepository;
        this.tipoGastoMapper = tipoGastoMapper;
        this.auditoria = auditoria;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<TiposgastosDTO> listaTiposGastos() {
        return tipoGastoMapper.toDTO(tipoGastoRepository.findAll());
    }

    @Override
    public Page<TiposgastosDTO> listaTiposGastosFiltros() {
        return null;
    }

    public Page<TiposgastosDTO> listaTiposGastosFiltros(
                                                        Pageable pageable,
                                                        String texto) {
        String textoNormalizado = (texto == null || texto.isBlank()) ? null : texto.trim();

        List<TiposgastosDTO> filtrados = tipoGastoRepository.buscarFiltrados(textoNormalizado)
                .stream().map(tipoGastoMapper ::toDTO)
                .toList();

        int pageSize = Math.max(pageable.getPageSize(), 1);
        int start = (int) Math.min(pageable.getOffset(), filtrados.size());
        int end = Math.min(start + pageSize, filtrados.size());

        return new PageImpl<>(filtrados.subList(start, end), pageable, filtrados.size());
    }

    @Override
    public TiposgastosDTO agregarTipoGasto(TiposgastosDTO dto, Usuario usuario) {

        if (dto == null) {
            throw new IllegalArgumentException("El tipo no fue recibido");
        }

        TipoGasto entity = tipoGastoMapper.toEntity(dto);
        TipoGasto guardado = tipoGastoRepository.save(entity);

        JsonNode despuesJson = objectMapper.valueToTree(guardado);

        auditoria.registrar(
                "tipo_gasto",
                usuario.getIdUsuarios(),
                AccionAuditoria.CREATE,
                usuario.getNombre() + " " + usuario.getApellido(),
                null,
                despuesJson,
                guardado.getIdTipoGasto()
        );

        return tipoGastoMapper.toDTO(guardado);
    }


    @Override
    public TiposgastosDTO actualizarTipoGasto(long id, TiposgastosDTO dto, Usuario usuario) {
        if (dto == null){
            throw new IllegalArgumentException("No se recivieron los datos");
        }

        TipoGasto tipoGasto = tipoGastoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No se encontro el tipo de gasto"));
        JsonNode antesJson = objectMapper.valueToTree(tipoGasto);

        tipoGasto.setTipoGasto(dto.getTipoGasto());
        TipoGasto guardado = tipoGastoRepository.save(tipoGasto);

        JsonNode despuesJson = objectMapper.valueToTree(guardado);
        auditoria.registrar(
                "tipo_gasto",
                usuario.getIdUsuarios(),
                AccionAuditoria.UPDATE,
                usuario.getNombre() + " " + usuario.getApellido(),
                antesJson,
                despuesJson,
                guardado.getIdTipoGasto()
        );

        return tipoGastoMapper.toDTO(guardado);
    }

    @Override
    public void eliminarTipoGasto(long id, Usuario usuario) {
        TipoGasto tipoGasto = tipoGastoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No se encontro el tipo de gasto"));

        JsonNode antesJson = objectMapper.valueToTree(tipoGasto);
        tipoGastoRepository.delete(tipoGasto);

        auditoria.registrar(
                "tipo_gasto",
                usuario.getIdUsuarios(),
                AccionAuditoria.DELETE,
                usuario.getNombre() + " " + usuario.getApellido(),
                antesJson,
                null,
                tipoGasto.getIdTipoGasto()
        );
    }
}
