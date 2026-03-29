package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.cliente.ClienteDTO;
import com.gestorcamiones.gestorcamiones.entity.Cliente;
import com.gestorcamiones.gestorcamiones.mapper.ClienteMapper;
import com.gestorcamiones.gestorcamiones.repository.ClienteRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.IClientesService;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ClientesService implements IClientesService {

    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;

    public ClientesService(ClienteRepository clienteRepository, ClienteMapper clienteMapper) {
        this.clienteRepository = clienteRepository;
        this.clienteMapper = clienteMapper;
    }

    @Override
    public Page<ClienteDTO> listar(Pageable pageable, String texto) {
        String textoNormalizado = (texto == null || texto.isBlank()) ? "" : texto.trim();
        Page<Cliente> page = clienteRepository.buscarFiltrados(textoNormalizado, pageable);
        return page.map(clienteMapper::toDTO);
    }

    @Override
    @Transactional
    public ClienteDTO crear(ClienteDTO dto) {
        if (dto.getDuiNit() != null && !dto.getDuiNit().isBlank()) {
            if (clienteRepository.existsByDuiNit(dto.getDuiNit())) {
                throw new IllegalArgumentException("El DUI/NIT ya esta registrado");
            }
        }

        Cliente cliente = clienteMapper.toEntity(dto);
        Cliente guardado = clienteRepository.save(cliente);
        return clienteMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public ClienteDTO editar(Long id, ClienteDTO dto) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));

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
        return clienteMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));
        clienteRepository.delete(cliente);
    }
}
