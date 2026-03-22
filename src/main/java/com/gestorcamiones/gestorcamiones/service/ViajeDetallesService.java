package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import com.gestorcamiones.gestorcamiones.entity.Viaje;
import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
import com.gestorcamiones.gestorcamiones.repository.ViajesDetallerRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.IViajeDetalleService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ViajeDetallesService implements IViajeDetalleService {

    private ViajesDetallerRepository viajesDetallerRepository;

    public ViajeDetallesService(ViajesDetallerRepository viajesDetallerRepository) {
        this.viajesDetallerRepository = viajesDetallerRepository;
    }


    @Override
    public void agregrarViaje(List<TramoDTO> tramosDTO, Viaje viaje) {
        List<ViajeDetalle> detalles = new ArrayList<>();

        for (TramoDTO dto : tramosDTO) {

            ViajeDetalle detalle = new ViajeDetalle();

            detalle.setViaje(viaje);
            detalle.setTipoTramo(dto.getTipoTramo());
            detalle.setEstado(dto.getEstadoViaje());
            detalle.setPagado(dto.isPagado());
            detalle.setIva(dto.isIva());
            detalle.setFechaSalida(dto.getFechaSalida());
            detalle.setFechaLlegada(dto.getFechaEntrada());

            detalles.add(detalle);
        }

        viaje.setDetalles(detalles);
    }
}
