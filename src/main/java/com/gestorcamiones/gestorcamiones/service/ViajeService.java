package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.ListaViajesDTO;
import com.gestorcamiones.gestorcamiones.entity.Cliente;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.Viaje;
import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
import com.gestorcamiones.gestorcamiones.repository.ClienteRepository;
import com.gestorcamiones.gestorcamiones.repository.ViajeRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.IViajeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ViajeService implements IViajeService{

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
            List<ViajeDetalle> ida = new ArrayList<>();
            List<ViajeDetalle> vuelta = new ArrayList<>();

            BigDecimal gananciaTotal = BigDecimal.ZERO;
            BigDecimal gastoTotal = BigDecimal.ZERO;

            for (ViajeDetalle detalle : viaje.getDetalles()) {

                // separar por tipo
                if (detalle.getTipoTramo() == TipoTramo.ida) {
                    ida.add(detalle);
                } else if (detalle.getTipoTramo() == TipoTramo.vuelta) {
                    vuelta.add(detalle);
                }

                // ejemplo de cálculo (ajusta según tu lógica real)
                if (detalle.getPagado() != null) {

                    gananciaTotal = gananciaTotal.add(detalle.);
                }


            }

            dto.setListaIDa(ida);
            dto.setListaVuelta(vuelta);

            dto.setGanaciaTotal(gananciaTotal);
            dto.setGastoTotal(gastoTotal);

            return dto;
        });
    }

    @Override
    public CrearViajeDTO CrearViaje(CrearViajeDTO dto, Usuario usuario) {
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no autenticado correctamente");
        }

        Cliente cliente = clienteRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        Viaje viaje = new Viaje();
        viaje.setNombreViaje(dto.getNombreViaje());
        viaje.setAdmin(usuario);
        viaje.setCliente(cliente);

        // 🔥 agregar detalles ANTES de guardar
        viajeDetallesService.agregrarViaje(dto.getTramos(), viaje);

        // 🔥 guardar todo junto (padre + hijos)
        viajeRepository.save(viaje);

        return dto;
    }

    @Override
    public CrearViajeDTO actualizarViaje(Long idViaje, CrearViajeDTO dto) {
        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        viaje.setNombreViaje(dto.getNombreViaje());

        // 🔥 limpiar detalles
        viaje.getDetalles().clear();

        // 🔥 agregar nuevos
        viajeDetallesService.agregrarViaje(dto.getTramos(), viaje);

        viajeRepository.save(viaje);
        return dto;
    }


    public void eliminarViaje(Long idViaje) {

        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        viajeRepository.delete(viaje);
    }
}
