package com.gestorcamiones.gestorcamiones.service.viaje;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ActualizarViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.DetalleViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ListaViajesDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ViajeUpsertDTO;
import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.*;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import com.gestorcamiones.gestorcamiones.repository.ClienteRepository;
import com.gestorcamiones.gestorcamiones.repository.ViajeRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ViajeService implements IViajeService {

    private ViajeRepository viajeRepository;
    private ClienteRepository clienteRepository;
    private ViajeDetallesService viajeDetallesService;

    public ViajeService(ViajeRepository viajeRepository,
                        ClienteRepository clienteRepository,
                        ViajeDetallesService viajeDetallesService) {
        this.viajeRepository = viajeRepository;
        this.clienteRepository = clienteRepository;
        this.viajeDetallesService = viajeDetallesService;
    }

    @Override
    public Page<ListaViajesDTO> listaViejes(Pageable pageable,
                                            String texto,
                                            String estado,
                                            LocalDate fechaInicio,
                                            LocalDate fechaFin,
                                            boolean excluirCompletados) {

        String estadoFiltro = (estado != null && !estado.isBlank()) ? estado : null;
        Page<Viaje> viajesPage = viajeRepository.viajesFiltrados(
                texto,
                estadoFiltro,
                fechaInicio,
                fechaFin,
                excluirCompletados,
                pageable
        );

        return viajesPage.map(viaje -> {

            ListaViajesDTO dto = new ListaViajesDTO();

            dto.setId_viaje(viaje.getIdViaje());
            dto.setNombreVieje(viaje.getNombreViaje());

            // admin
            if (viaje.getAdmin() != null) {
                dto.setNombreAdmin(viaje.getAdmin().getNombre());
                dto.setId_admin(viaje.getAdmin().getIdUsuarios());
            }

            // cliente
            if (viaje.getCliente() != null) {
                dto.setNombreEmpleado(viaje.getCliente().getNombre());
                dto.setId_chofer(viaje.getCliente().getId());
            }

            // separar IDA y VUELTA
            List<DetalleViajeDTO> ida = new ArrayList<>();
            List<DetalleViajeDTO> vuelta = new ArrayList<>();

            BigDecimal totalGenetado = BigDecimal.ZERO;
            BigDecimal gananciaTotal = BigDecimal.ZERO;
            BigDecimal gastoTotal = BigDecimal.ZERO;

            int condador =0;
            for (ViajeDetalle detalle : viaje.getDetalles()) {

                // separar por tipo
                DetalleViajeDTO detalleDTO = toDetalleDTO(detalle);
                if (detalle.getTipoTramo() == TipoTramo.ida) {
                    ida.add(detalleDTO);

                } else if (detalle.getTipoTramo() == TipoTramo.vuelta) {
                    vuelta.add(detalleDTO);
                }


                if (detalle.getPrecioViaje() != null) {
                    totalGenetado = totalGenetado.add(detalle.getPrecioViaje());
                }

                if (detalle.getGastos() != null) {
                    for (GastoViaje gastos: detalle.getGastos()){
                        if (gastos.getMonto() != null) {
                            gastoTotal = gastoTotal.add(gastos.getMonto());
                        }
                    }
                }
                gananciaTotal = totalGenetado.subtract(gastoTotal);

                if (detalle.getEstado() != EstadoViaje.cancelado && detalle.getEstado() != EstadoViaje.completado) {
                   dto.setViajesActivos(condador++);
                }

            }

            dto.setListaIDa(ida);
            dto.setListaVuelta(vuelta);

            dto.setViajesTotales(ida.size() + vuelta.size());

            dto.setIngresoTotal(totalGenetado);
            dto.setGanaciaTotal(gananciaTotal);
            dto.setGastoTotal(gastoTotal);

            return dto;
        });
    }

    @Transactional
    @Override
    public CrearViajeDTO CrearViaje(CrearViajeDTO dto, Usuario usuario) {
        // el usuario es el admin
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no autenticado correctamente");
        }

        Viaje viaje = guardarViaje(dto, usuario);

        viajeDetallesService.crearTramos(dto.getTramos(), viaje, usuario);
        return dto;
    }

    private Viaje guardarViaje(ViajeUpsertDTO dto, Usuario usuario) {

        Cliente cliente = clienteRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        Viaje viaje = new Viaje();
        viaje.setNombreViaje(dto.getNombreViaje());
        viaje.setAdmin(usuario);
        viaje.setCliente(cliente);
        viajeRepository.save(viaje);
        return viaje;
    }

    @Transactional
    @Override
    public ActualizarViajeDTO actualizarViaje(Long idViaje, ActualizarViajeDTO dto, Usuario usuario) {
        // u
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no autenticado correctamente");
        }
        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        viaje.setNombreViaje(dto.getNombreViaje());

        viaje.setAdmin(usuario);
        if (dto.getIdCliente() > 0) {
            Cliente cliente = clienteRepository.findById(dto.getIdCliente())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
            viaje.setCliente(cliente);
        }

        if (dto.getTramos() != null) {
            viajeDetallesService.actualizarTramos(dto.getTramos(), viaje, usuario);
        }

        viajeRepository.save(viaje);
        return dto;
    }

    public ViajeUpsertDTO obtenerViaje(Long idViaje) {
        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        ViajeUpsertDTO dto = new ViajeUpsertDTO();
        dto.setIdViaje(viaje.getIdViaje());
        dto.setNombreViaje(viaje.getNombreViaje());
        if (viaje.getCliente() != null) {
            dto.setIdCliente(viaje.getCliente().getId());
            dto.setClienteNombre(viaje.getCliente().getNombre());
        }

        List<TramoDTO> tramos = new ArrayList<>();
        for (ViajeDetalle detalle : viaje.getDetalles()) {
            TramoDTO tramo = new TramoDTO();
            tramo.setId(detalle.getIdViajeDetalle());
            tramo.setTipoTramo(detalle.getTipoTramo());
            tramo.setEstadoViaje(detalle.getEstado());
            tramo.setPagado(Boolean.TRUE.equals(detalle.getPagado()));
            tramo.setIva(Boolean.TRUE.equals(detalle.getIva()));
            tramo.setPrecioViaje(detalle.getPrecioViaje());
            tramo.setFechaSalida(detalle.getFechaSalida());
            tramo.setFechaEntrada(detalle.getFechaLlegada());

            if (detalle.getCamion() != null) {
                tramo.setIdCamion(detalle.getCamion().getIdCamion());
                tramo.setCamionNombre(detalle.getCamion().getNombre());
                tramo.setCamionPlaca(detalle.getCamion().getPlaca());
            }
            if (detalle.getChofer() != null) {
                tramo.setIdConductor(detalle.getChofer().getIdUsuarios());
                String nombre = detalle.getChofer().getNombre() != null ? detalle.getChofer().getNombre() : "";
                String apellido = detalle.getChofer().getApellido() != null ? detalle.getChofer().getApellido() : "";
                tramo.setConductorNombre((nombre + " " + apellido).trim());
            }

            if (detalle.getGastos() != null) {
                List<GastoViajeDTO> gastos = new ArrayList<>();
                for (GastoViaje gasto : detalle.getGastos()) {
                    GastoViajeDTO gastoDTO = new GastoViajeDTO();
                    gastoDTO.setId(gasto.getIdGastoViaje());
                    gastoDTO.setIdViajeDetalle(detalle.getIdViajeDetalle());
                    if (gasto.getTipoGasto() != null) {
                        gastoDTO.setIdTipoGasto(gasto.getTipoGasto().getIdTipoGasto());
                    }
                    if (gasto.getUsuarioAdmin() != null) {
                        gastoDTO.setIdUsuarioAdmin(gasto.getUsuarioAdmin().getIdUsuarios());
                    }
                    gastoDTO.setMonto(gasto.getMonto());
                    gastoDTO.setDescripcion(gasto.getDescripcion());
                    gastoDTO.setEvidenciaUrl(gasto.getEvidenciaUrl());
                    gastoDTO.setFechaGasto(gasto.getFechaGasto());
                    gastos.add(gastoDTO);
                }
                tramo.setGastos(gastos);
            }

            tramos.add(tramo);
        }
        dto.setTramos(tramos);
        return dto;
    }

    private DetalleViajeDTO toDetalleDTO(ViajeDetalle detalle) {
        DetalleViajeDTO dto = new DetalleViajeDTO();

        dto.setId(detalle.getIdViajeDetalle());
        dto.setTipoTramo(detalle.getTipoTramo());
        dto.setEstadoViaje(detalle.getEstado());
        dto.setPagado(detalle.getPagado());
        dto.setIva(detalle.getIva());
        dto.setPrecioViaje(detalle.getPrecioViaje());
        BigDecimal gastosTotal = BigDecimal.ZERO;
        if (detalle.getGastos() != null) {
            for (GastoViaje gasto : detalle.getGastos()) {
                if (gasto.getMonto() != null) {
                    gastosTotal = gastosTotal.add(gasto.getMonto());
                }
            }
        }
        dto.setGastoTotal(gastosTotal);
        if (detalle.getPrecioViaje() != null) {
            dto.setGananciaTotal(detalle.getPrecioViaje().subtract(gastosTotal));
        } else {
            dto.setGananciaTotal(gastosTotal.negate());
        }
        dto.setFechaSalida(detalle.getFechaSalida());
        dto.setFechaEntrada(detalle.getFechaLlegada());
        if (detalle.getCamion() != null) {
            dto.setCamionId(detalle.getCamion().getIdCamion());
            dto.setCamionNombre(detalle.getCamion().getNombre());
            dto.setCamionPlaca(detalle.getCamion().getPlaca());
        }
        if (detalle.getChofer() != null) {
            dto.setConductorId(detalle.getChofer().getIdUsuarios());
            String nombre = detalle.getChofer().getNombre() != null ? detalle.getChofer().getNombre() : "";
            String apellido = detalle.getChofer().getApellido() != null ? detalle.getChofer().getApellido() : "";
            dto.setConductorNombre((nombre + " " + apellido).trim());
        }
        return dto;
    }

    public void eliminarViaje(Long idViaje) {

        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        viajeRepository.delete(viaje);
    }
}
