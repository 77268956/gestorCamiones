package com.gestorcamiones.gestorcamiones.service.viaje;

import com.gestorcamiones.gestorcamiones.dto.viaje.ActualizarViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.DetalleViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ListaViajesDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ViajeUpsertDTO;
import com.gestorcamiones.gestorcamiones.entity.Cliente;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.Viaje;
import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
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
                                            EstadoViaje estado,
                                            LocalDate fechaInicio,
                                            LocalDate fechaFin) {

        Page<Viaje> viajesPage = viajeRepository.findAll(pageable);

        return viajesPage.map(viaje -> {

            ListaViajesDTO dto = new ListaViajesDTO();

            dto.setId(viaje.getIdViaje());
            dto.setNombreVieje(viaje.getNombreViaje());

            // admin
            if (viaje.getAdmin() != null) {
                dto.setNombreAdmin(viaje.getAdmin().getNombre());
            }

            // cliente
            if (viaje.getCliente() != null) {
                dto.setNombreEmpleado(viaje.getCliente().getNombre());
            }

            // separar IDA y VUELTA
            List<DetalleViajeDTO> ida = new ArrayList<>();
            List<DetalleViajeDTO> vuelta = new ArrayList<>();

            BigDecimal gananciaTotal = BigDecimal.ZERO;
            BigDecimal gastoTotal = BigDecimal.ZERO;

            for (ViajeDetalle detalle : viaje.getDetalles()) {

                // separar por tipo
                DetalleViajeDTO detalleDTO = toDetalleDTO(detalle);
                if (detalle.getTipoTramo() == TipoTramo.ida) {
                    ida.add(detalleDTO);
                } else if (detalle.getTipoTramo() == TipoTramo.vuelta) {
                    vuelta.add(detalleDTO);
                }

                // ejemplo de calculo (ajusta segun tu logica real)
                if (detalle.getPagado() != null) {
                    // gananciaTotal = gananciaTotal.add(...);
                }
            }

            dto.setListaIDa(ida);
            dto.setListaVuelta(vuelta);

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

        viajeDetallesService.guardarTramos(dto.getTramos(), viaje, usuario);
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

        viaje.getDetalles().clear();

        if (dto.getTramos() != null) {
            viajeDetallesService.guardarTramos(dto.getTramos(), viaje, usuario);
        }

        viajeRepository.save(viaje);
        return dto;
    }

    private DetalleViajeDTO toDetalleDTO(ViajeDetalle detalle) {
        DetalleViajeDTO dto = new DetalleViajeDTO();
        dto.setId(detalle.getIdViajeDetalle());
        dto.setTipoTramo(detalle.getTipoTramo());
        dto.setEstadoViaje(detalle.getEstado());
        dto.setPagado(detalle.getPagado());
        dto.setIva(detalle.getIva());
        dto.setFechaSalida(detalle.getFechaSalida());
        dto.setFechaEntrada(detalle.getFechaLlegada());
        if (detalle.getCamion() != null) {
            dto.setCamionId(detalle.getCamion().getIdCamion());
        }
        if (detalle.getChofer() != null) {
            dto.setConductorId(detalle.getChofer().getIdUsuarios());
        }
        return dto;
    }

    public void eliminarViaje(Long idViaje) {

        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        viajeRepository.delete(viaje);
    }
}
