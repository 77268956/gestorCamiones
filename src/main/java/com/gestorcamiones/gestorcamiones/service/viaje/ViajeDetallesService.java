package com.gestorcamiones.gestorcamiones.service.viaje;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
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
import com.gestorcamiones.gestorcamiones.service.gasto.GastosViajeServicie;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

            if (dto.getGastos() != null) {
                for (GastoViajeDTO gastoDTO : dto.getGastos()) {
                    GastoViaje gasto = mapper.toEntity(gastoDTO);
                    gasto.setViajeDetalle(detalle);
                    gasto.setUsuarioAdmin(usuarioAdmin);

                    TipoGasto tipoGasto = tipoGastoRepository.findById(gastoDTO.getIdTipoGasto())
                            .orElseThrow(() -> new IllegalArgumentException("TipoGasto no encontrado"));

                    gasto.setTipoGasto(tipoGasto);

                    gastosService.guardarGasto(gasto);
                }
            }

            viaje.getDetalles().add(detalle);
        }
    }

    private ViajeDetalle guardarDetalle(TramoDTO dto, Viaje viaje) {

        if (camionNoDisponible(dto.getIdCamion(), dto.getFechaSalida(), dto.getFechaEntrada())) {
            throw new IllegalArgumentException("Camión ya asignado a un viaje");
        }

        if (choferNoDisponible(dto.getIdConductor(), dto.getFechaSalida(), dto.getFechaEntrada())) {
            throw new IllegalArgumentException("El contuctor ya esta en un viaje");
        }



        ViajeDetalle detalle = new ViajeDetalle();
        detalle.setViaje(viaje);
        detalle.setTipoTramo(dto.getTipoTramo());
        detalle.setEstado(dto.getEstadoViaje());
        detalle.setPagado(dto.isPagado());
        detalle.setIva(dto.isIva());
        detalle.setFechaSalida(dto.getFechaSalida());
        detalle.setFechaLlegada(dto.getFechaEntrada());
        detalle.setPrecioViaje(dto.getPrecioViaje());

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

    private boolean camionNoDisponible(long idCamion, LocalDateTime fechaSalida, LocalDateTime fechaLlegada){
        return  camionRepository.camionNoDisponible(idCamion, fechaSalida, fechaLlegada);
    }

    private boolean choferNoDisponible(long idCamion, LocalDateTime fechaSalida, LocalDateTime fechaLlegada){
        return  usuarioRepository.choferNoDisponible(idCamion, fechaSalida, fechaLlegada);
    }
}
