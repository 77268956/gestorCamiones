package com.gestorcamiones.gestorcamiones.service.viaje;

import com.gestorcamiones.gestorcamiones.dto.viaje.ActualizarViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ListaViajesDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface IViajeService {

    Page<ListaViajesDTO> listaViejes(Pageable pageable, String texto, EstadoViaje estado, LocalDate fecehaIncio, LocalDate fecehaFin);
    CrearViajeDTO CrearViaje(CrearViajeDTO dto, Usuario usuario);
    ActualizarViajeDTO actualizarViaje(Long idViaje, ActualizarViajeDTO dto, Usuario usuario);
}
