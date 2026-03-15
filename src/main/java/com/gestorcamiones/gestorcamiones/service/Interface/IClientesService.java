package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.ClienteDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IClientesService {
    Page<ClienteDTO> listar(Pageable pageable, String texto);
    ClienteDTO crear(ClienteDTO dto);
    ClienteDTO editar(Long id, ClienteDTO dto);
    void eliminar(Long id);
}
