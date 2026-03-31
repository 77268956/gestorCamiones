package com.gestorcamiones.gestorcamiones.service.cliente;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestorcamiones.gestorcamiones.dto.cliente.ClienteDTO;
import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaDetallada;
import com.gestorcamiones.gestorcamiones.entity.Cliente;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.mapper.ClienteMapper;
import com.gestorcamiones.gestorcamiones.repository.ClienteRepository;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.auditoria.AuditoriaDetalladaService;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ClientesService implements IClientesService {

    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    private final ObjectMapper objectMapper;

    private final AuditoriaDetalladaService auditoriaDetalladaService;

    public ClientesService(ClienteRepository clienteRepository,
                           ClienteMapper clienteMapper,
                           ObjectMapper objectMapper,
                           AuditoriaDetalladaService auditoriaDetalladaService) {
        this.clienteRepository = clienteRepository;
        this.clienteMapper = clienteMapper;
        this.objectMapper = objectMapper;
        this.auditoriaDetalladaService = auditoriaDetalladaService;
    }

    @Override
    public Page<ClienteDTO> listar(Pageable pageable, String texto) {
        String textoNormalizado = (texto == null || texto.isBlank()) ? "" : texto.trim();
        Page<Cliente> page = clienteRepository.buscarFiltrados(textoNormalizado, pageable);
        return page.map(clienteMapper::toDTO);
    }

    @Override
    @Transactional
    public ClienteDTO crear(ClienteDTO dto, CustomUserDetails admin) {

        if (dto.getDuiNit() != null && !dto.getDuiNit().isBlank()) {
            if (clienteRepository.existsByDuiNit(dto.getDuiNit())) {
                throw new IllegalArgumentException("El DUI/NIT ya esta registrado");
            }
        }

        Cliente cliente = clienteMapper.toEntity(dto);
        Cliente guardado = clienteRepository.save(cliente);

        JsonNode despuesJson = objectMapper.valueToTree(guardado);

        auditoriaDetalladaService.registrar(
                "clientes",
                admin.getIdUsuario(),
                AccionAuditoria.CREATE,
                admin.getUsername(),
                null,
                despuesJson,
                guardado.getId()
        );

        return clienteMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public ClienteDTO editar(Long id, ClienteDTO dto, CustomUserDetails admin) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));

        JsonNode antesJson = objectMapper.valueToTree(cliente);

        if (dto.getDuiNit() != null && !dto.getDuiNit().isBlank()) {
            if (clienteRepository.existsByDuiNitAndIdNot(dto.getDuiNit(), id)) {
                throw new IllegalArgumentException("El DUI/NIT ya esta registrado");
            }
        }

        cliente.setNombre(dto.getNombre());
        cliente.setTelefono(dto.getTelefono());
        cliente.setDireccion(dto.getDireccion());
        cliente.setDuiNit(dto.getDuiNit());

        Cliente guardado = clienteRepository.save(cliente);

        // 🔥 DESPUÉS
        JsonNode despuesJson = objectMapper.valueToTree(guardado);

        auditoriaDetalladaService.registrar(
                "clientes",
                admin.getIdUsuario(),
                AccionAuditoria.UPDATE,
                admin.getUsername(),
                antesJson,
                despuesJson,
                id
        );

        return clienteMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public void eliminar(Long id, CustomUserDetails admin) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));

        JsonNode antesJson = objectMapper.valueToTree(cliente);

        clienteRepository.delete(cliente);
        auditoriaDetalladaService.registrar(
                "clientes",
                admin.getIdUsuario(),
                AccionAuditoria.DELETE,
                admin.getUsername(),
                antesJson,
                null,
                id
        );
    }

}
