package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import com.gestorcamiones.gestorcamiones.entity.Viaje;
import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;

import java.util.List;

public interface IViajeDetalleService {
    public void agregrarViaje (List<TramoDTO> tramosDTO, Viaje viaje);
}
