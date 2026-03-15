package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.ClienteDTO;
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

    public ClientesService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Override
    public Page<ClienteDTO> listar(Pageable pageable, String texto) {
        String textoNormalizado = (texto == null || texto.isBlank()) ? "" : texto.trim();
        Page<Cliente> page = clienteRepository.buscarFiltrados(textoNormalizado, pageable);
        return page.map(ClienteMapper::toDTO);
    }

    @Override
    @Transactional
    public ClienteDTO crear(ClienteDTO dto) {
        if (dto.getDuiNit() != null && !dto.getDuiNit().isBlank()) {
            if (clienteRepository.existsByDuiNit(dto.getDuiNit())) {
                throw new IllegalArgumentException("El DUI/NIT ya esta registrado");
            }
        }

        Cliente cliente = ClienteMapper.toEntity(dto);
        Cliente guardado = clienteRepository.save(cliente);
        return ClienteMapper.toDTO(guardado);
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
        return ClienteMapper.toDTO(guardado);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));
        clienteRepository.delete(cliente);
    }
}
