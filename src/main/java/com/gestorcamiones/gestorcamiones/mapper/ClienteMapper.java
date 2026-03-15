package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.ClienteDTO;
import com.gestorcamiones.gestorcamiones.entity.Cliente;

public class ClienteMapper {

    public static ClienteDTO toDTO(Cliente cliente) {
        return new ClienteDTO(
                cliente.getId(),
                cliente.getNombre(),
                cliente.getTelefono(),
                cliente.getDireccion(),
                cliente.getDuiNit()
        );
    }

    public static Cliente toEntity(ClienteDTO dto) {
        Cliente cliente = new Cliente();
        cliente.setId(dto.getId());
        cliente.setNombre(dto.getNombre());
        cliente.setTelefono(dto.getTelefono());
        cliente.setDireccion(dto.getDireccion());
        cliente.setDuiNit(dto.getDuiNit());
        return cliente;
    }
}
