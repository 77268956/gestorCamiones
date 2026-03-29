package com.gestorcamiones.gestorcamiones.service.viaje;

import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.Viaje;

import java.util.List;

public interface IViajeDetalleService {
    void guardarTramos(List<TramoDTO> tramosDTO, Viaje viaje, Usuario usuarioAdmin);
}
