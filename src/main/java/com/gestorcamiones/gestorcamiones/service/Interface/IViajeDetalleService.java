package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.Viaje;

import java.util.List;

public interface IViajeDetalleService {
    public void guardarTramos (List<TramoDTO> tramosDTO, Viaje viaje, Usuario usuarioAdmin);
}
