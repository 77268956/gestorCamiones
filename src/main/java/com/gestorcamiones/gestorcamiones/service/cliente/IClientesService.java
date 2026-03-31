package com.gestorcamiones.gestorcamiones.service.cliente;

import com.gestorcamiones.gestorcamiones.dto.cliente.ClienteDTO;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IClientesService {
    Page<ClienteDTO> listar(Pageable pageable, String texto);
    ClienteDTO crear(ClienteDTO dto, CustomUserDetails admin);
    ClienteDTO editar(Long id, ClienteDTO dto, CustomUserDetails admin);
    void eliminar(Long id, CustomUserDetails admin);
}
