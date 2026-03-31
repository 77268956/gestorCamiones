package com.gestorcamiones.gestorcamiones.service.viaje;

import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.Viaje;

import java.util.List;

public interface IViajeDetalleService {
    void crearTramos(List<TramoDTO> tramosDTO, Viaje viaje, Usuario usuarioAdmin);
    void actualizarTramos(List<TramoDTO> tramosDTO, Viaje viaje, Usuario usuarioAdmin);
}
