package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.GastoViaje;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.Viaje;
import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
import com.gestorcamiones.gestorcamiones.mapper.GastosViajesMapper;
import com.gestorcamiones.gestorcamiones.repository.CamionRepository;
import com.gestorcamiones.gestorcamiones.repository.TipoGastoRepository;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import com.gestorcamiones.gestorcamiones.repository.ViajesDetallerRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.IViajeDetalleService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ViajeDetallesService implements IViajeDetalleService {

    private final ViajesDetallerRepository viajesDetallerRepository;
    private final GastosViajeServicie gastosService;
    private final GastosViajesMapper mapper;
    private final CamionRepository camionRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoGastoRepository tipoGastoRepository;

    public ViajeDetallesService(ViajesDetallerRepository viajesDetallerRepository,
                                GastosViajeServicie gastosService,
                                GastosViajesMapper mapper,
                                CamionRepository camionRepository,
                                UsuarioRepository usuarioRepository,
                                TipoGastoRepository tipoGastoRepository) {
        this.viajesDetallerRepository = viajesDetallerRepository;
        this.gastosService = gastosService;
        this.mapper = mapper;
        this.camionRepository = camionRepository;
        this.usuarioRepository = usuarioRepository;
        this.tipoGastoRepository = tipoGastoRepository;
    }


    @Override
    public void guardarTramos(List<TramoDTO> tramo, Viaje viaje, Usuario usuarioAdmin) {
        for (TramoDTO dto : tramo) {
            ViajeDetalle detalle = guardarDetalle(dto, viaje);

            if (dto.getGastoViaje() != null) {
                GastoViaje gasto = mapper.toEntity(dto.getGastoViaje());
                gasto.setViajeDetalle(detalle);

                long idTipoGasto = dto.getGastoViaje().getIdTipoGasto();
                if (idTipoGasto <= 0) {
                    throw new IllegalArgumentException("idTipoGasto es requerido para gastos de viaje");
                }
                TipoGasto tipoGasto = tipoGastoRepository.findById(idTipoGasto)
                        .orElseThrow(() -> new IllegalArgumentException("TipoGasto no encontrado"));
                gasto.setTipoGasto(tipoGasto);
                gasto.setUsuarioAdmin(usuarioAdmin);
                gastosService.guardarGasto(gasto);
            }

            viaje.getDetalles().add(detalle);
        }
    }

    private ViajeDetalle guardarDetalle(TramoDTO dto, Viaje viaje){
        ViajeDetalle detalle = new ViajeDetalle();
        detalle.setViaje(viaje);
        detalle.setTipoTramo(dto.getTipoTramo());
        detalle.setEstado(dto.getEstadoViaje());
        detalle.setPagado(dto.isPagado());
        detalle.setIva(dto.isIva());
        detalle.setFechaSalida(dto.getFechaSalida());
        detalle.setFechaLlegada(dto.getFechaEntrada());

        if (dto.getIdCamion() > 0) {
            detalle.setCamion(camionRepository.findById(dto.getIdCamion())
                    .orElseThrow(() -> new IllegalArgumentException("Camion no encontrado")));
        }
        if (dto.getIdConductor() > 0) {
            detalle.setChofer(usuarioRepository.findById(dto.getIdConductor())
                    .orElseThrow(() -> new IllegalArgumentException("Conductor no encontrado")));
        }
        viajesDetallerRepository.save(detalle);
        return detalle;
    }
}
