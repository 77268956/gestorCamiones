package com.gestorcamiones.gestorcamiones.service.viaje;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
import com.gestorcamiones.gestorcamiones.dto.ingreso.IngresoExtraDTO;
import com.gestorcamiones.gestorcamiones.entity.GastoViaje;
import com.gestorcamiones.gestorcamiones.entity.IngresoExtraViaje;
import com.gestorcamiones.gestorcamiones.entity.CategoriaIngresoExtra;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.Viaje;
import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
import com.gestorcamiones.gestorcamiones.mapper.GastosViajesMapper;
import com.gestorcamiones.gestorcamiones.repository.CamionRepository;
import com.gestorcamiones.gestorcamiones.repository.GastosViajeRepository;
import com.gestorcamiones.gestorcamiones.repository.IngresoExtraViajeRepository;
import com.gestorcamiones.gestorcamiones.repository.CategoriaIngresoExtraRepository;
import com.gestorcamiones.gestorcamiones.repository.TipoGastoRepository;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import com.gestorcamiones.gestorcamiones.repository.ViajesDetallerRepository;
import com.gestorcamiones.gestorcamiones.service.gasto.GastosViajeServicie;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para crear/actualizar tramos de viaje.
 * Actualizado para V2: sin precioViaje, con campos de ubicacion.
 */
@Service
public class ViajeDetallesService implements IViajeDetalleService {

    private final ViajesDetallerRepository viajesDetallerRepository;
    private final GastosViajeServicie gastosService;
    private final GastosViajesMapper mapper;
    private final CamionRepository camionRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoGastoRepository tipoGastoRepository;
    private final GastosViajeRepository gastosViajeRepository;
    private final IngresoExtraViajeRepository ingresoExtraViajeRepository;
    private final CategoriaIngresoExtraRepository categoriaIngresoExtraRepository;

    public ViajeDetallesService(ViajesDetallerRepository viajesDetallerRepository,
                               GastosViajeServicie gastosService,
                               GastosViajesMapper mapper,
                               CamionRepository camionRepository,
                               UsuarioRepository usuarioRepository,
                               TipoGastoRepository tipoGastoRepository,
                               GastosViajeRepository gastosViajeRepository,
                               IngresoExtraViajeRepository ingresoExtraViajeRepository,
                               CategoriaIngresoExtraRepository categoriaIngresoExtraRepository) {
        this.viajesDetallerRepository = viajesDetallerRepository;
        this.gastosService = gastosService;
        this.mapper = mapper;
        this.camionRepository = camionRepository;
        this.usuarioRepository = usuarioRepository;
        this.tipoGastoRepository = tipoGastoRepository;
        this.gastosViajeRepository = gastosViajeRepository;
        this.ingresoExtraViajeRepository = ingresoExtraViajeRepository;
        this.categoriaIngresoExtraRepository = categoriaIngresoExtraRepository;
    }

    @Override
    public void crearTramos(List<TramoDTO> tramos, Viaje viaje, Usuario usuarioAdmin) {
        if (tramos == null || tramos.isEmpty()) return;
        for (TramoDTO dto : tramos) {
            ViajeDetalle detalle = new ViajeDetalle();
            detalle.setViaje(viaje);
            aplicarTramo(detalle, dto, null, viaje.getIdViaje());
            detalle = viajesDetallerRepository.save(detalle);
            syncGastos(detalle, dto.getGastos(), usuarioAdmin);
            syncIngresosExtra(detalle, dto.getIngresosExtra());
            viaje.addDetalle(detalle);
        }
    }

    @Override
    public void actualizarTramos(List<TramoDTO> tramos, Viaje viaje, Usuario usuarioAdmin) {
        // Validaciones iniciales
        if (tramos == null || tramos.isEmpty()) {
            // Considera si deberías eliminar todos los tramos existentes
            viaje.getDetalles().clear();
            viajesDetallerRepository.saveAll(viaje.getDetalles());
            return;
        }

        if (usuarioAdmin == null) {
            throw new IllegalArgumentException("Usuario administrador requerido");
        }

        Set<Long> idsRecibidos = new HashSet<>();

        for (TramoDTO dto : tramos) {
            ViajeDetalle detalle;

            if (dto.getId() > 0) {
                // Actualizar existente
                detalle = viajesDetallerRepository.findById(dto.getId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                String.format("Detalle de viaje no encontrado: %d", dto.getId())));

                if (!viaje.getIdViaje().equals(detalle.getViaje().getIdViaje())) {
                    throw new IllegalArgumentException(
                            String.format("El detalle %d no pertenece al viaje %d",
                                    dto.getId(), viaje.getIdViaje()));
                }
                idsRecibidos.add(detalle.getIdViajeDetalle());

            } else {
                // Reutilizar el tramo del mismo tipo si ya existe; si no, crear uno nuevo.
                detalle = viaje.getDetalles().stream()
                        .filter(d -> d.getTipoTramo() != null
                                && dto.getTipoTramo() != null
                                && d.getTipoTramo() == dto.getTipoTramo())
                        .findFirst()
                        .orElseGet(() -> {
                            ViajeDetalle nuevo = new ViajeDetalle();
                            nuevo.setViaje(viaje);
                            return nuevo;
                        });
            }

            // Aplicar cambios
            aplicarTramo(detalle, dto, detalle.getIdViajeDetalle(), viaje.getIdViaje());
            detalle = viajesDetallerRepository.save(detalle);

            // Sincronizar gastos con transacción separada si es necesario
            syncGastos(detalle, dto.getGastos(), usuarioAdmin);
            syncIngresosExtra(detalle, dto.getIngresosExtra());

            // Agregar al viaje si es nuevo
            if (!viaje.getDetalles().contains(detalle)) {
                viaje.addDetalle(detalle);
            } else if (detalle.getIdViajeDetalle() != null) {
                idsRecibidos.add(detalle.getIdViajeDetalle());
            }
        }

        // Eliminar tramos que no están en la lista actual
        List<ViajeDetalle> paraEliminar = viaje.getDetalles().stream()
                .filter(d -> d.getIdViajeDetalle() != null
                        && !idsRecibidos.contains(d.getIdViajeDetalle()))
                .collect(Collectors.toList());

        if (!paraEliminar.isEmpty()) {
            viaje.getDetalles().removeAll(paraEliminar);
            viajesDetallerRepository.deleteAll(paraEliminar);
        }
    }

     /*Mentodo original para editar (No borarr) para probar una mejora*/

    /*
    *  @Override
    public void actualizarTramos(List<TramoDTO> tramos, Viaje viaje, Usuario usuarioAdmin) {
        if (tramos == null || tramos.isEmpty()) return;
        for (TramoDTO dto : tramos) {
            ViajeDetalle detalle;
            if (dto.getId() > 0) {
                detalle = viajesDetallerRepository.findById(dto.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Detalle de viaje no encontrado"));
                if (detalle.getViaje() == null || viaje.getIdViaje() == null
                        || !viaje.getIdViaje().equals(detalle.getViaje().getIdViaje())) {
                    throw new IllegalArgumentException("El detalle no pertenece al viaje");
                }
            } else {
                // Si el frontend no manda id, intentamos matchear por tipoTramo (ida/vuelta) para editar en sitio.
                detalle = viaje.getDetalles().stream()
                        .filter(d -> d.getTipoTramo() != null && dto.getTipoTramo() != null && d.getTipoTramo() == dto.getTipoTramo())
                        .findFirst()
                        .orElseGet(() -> {
                            ViajeDetalle nuevo = new ViajeDetalle();
                            nuevo.setViaje(viaje);
                            return nuevo;
                        });
            }

            aplicarTramo(detalle, dto, detalle.getIdViajeDetalle());
            detalle = viajesDetallerRepository.save(detalle);
            syncGastos(detalle, dto.getGastos(), usuarioAdmin);
            if (!viaje.getDetalles().contains(detalle)) {
                viaje.addDetalle(detalle);
            }
        }
    }
    *
    * */

    private void aplicarTramo(ViajeDetalle detalle, TramoDTO dto, Long idDetalleExistente, Long idViajeExistente) {
        if (dto == null) return;

        // Validar que las fechas sean coherentes
        if (dto.getFechaSalida() != null && dto.getFechaEntrada() != null) {
            if (!dto.getFechaSalida().isBefore(dto.getFechaEntrada())) {
                throw new IllegalArgumentException(
                    "La fecha de salida debe ser anterior a la fecha de llegada (" + dto.getTipoTramo() + ")");
            }
        }

        validarDisponibilidad(
                dto.getIdCamion(),
                dto.getIdConductor(),
                dto.getFechaSalida(),
                dto.getFechaEntrada(),
                idDetalleExistente,
                idViajeExistente
        );

        detalle.setTipoTramo(dto.getTipoTramo());
        detalle.setEstado(dto.getEstadoViaje());
        detalle.setPagado(dto.isPagado());
        detalle.setIva(dto.isIva());
        detalle.setFechaSalida(dto.getFechaSalida());
        detalle.setFechaLlegada(dto.getFechaEntrada());

        // Ubicación (V2)
        detalle.setPaisSalida(dto.getPaisSalida());
        detalle.setPaisDestino(dto.getPaisDestino());
        detalle.setDireccionSalida(dto.getDireccionSalida());
        detalle.setDireccionDestino(dto.getDireccionDestino());
        detalle.setObservaciones(dto.getObservaciones());

        if (dto.getIdCamion() > 0) {
            detalle.setCamion(camionRepository.findById(dto.getIdCamion())
                    .orElseThrow(() -> new IllegalArgumentException("Camion no encontrado")));
        } else {
            detalle.setCamion(null);
        }

        if (dto.getIdConductor() > 0) {
            detalle.setChofer(usuarioRepository.findById(dto.getIdConductor())
                    .orElseThrow(() -> new IllegalArgumentException("Conductor no encontrado")));
        } else {
            // En V2 id_chofer es NOT NULL, el conductor es obligatorio
            throw new IllegalArgumentException("El conductor es obligatorio");
        }
    }

    private void validarDisponibilidad(long idCamion,
                                      long idConductor,
                                      LocalDateTime fechaSalida,
                                      LocalDateTime fechaLlegada,
                                      Long idDetalleExistente,
                                      Long idViajeExistente) {
        if (idCamion > 0) {
            boolean noDisponible = (idDetalleExistente != null && idDetalleExistente > 0)
                    ? camionRepository.camionNoDisponibleExcluyendoDetalle(idCamion, fechaSalida, fechaLlegada, idDetalleExistente, idViajeExistente)
                    : camionRepository.camionNoDisponible(idCamion, fechaSalida, fechaLlegada);
            if (noDisponible) {
                throw new IllegalArgumentException("Camion ya asignado a un viaje");
            }
        }

        if (idConductor > 0) {
            boolean noDisponible = (idDetalleExistente != null && idDetalleExistente > 0)
                    ? usuarioRepository.choferNoDisponibleExcluyendoDetalle(idConductor, fechaSalida, fechaLlegada, idDetalleExistente, idViajeExistente)
                    : usuarioRepository.choferNoDisponible(idConductor, fechaSalida, fechaLlegada);
            if (noDisponible) {
                throw new IllegalArgumentException("El conductor ya esta en un viaje");
            }
        }
    }

    private void syncGastos(ViajeDetalle detalle, List<GastoViajeDTO> incoming, Usuario usuarioAdmin) {
        if (detalle == null) return;
        final List<GastoViajeDTO> nuevos = incoming != null ? incoming : List.of();

        if (detalle.getGastos() == null) {
            detalle.setGastos(new ArrayList<>());
        }

        Map<Long, GastoViaje> existentes = new HashMap<>();
        for (GastoViaje g : detalle.getGastos()) {
            if (g.getIdGastoViaje() != null) {
                existentes.put(g.getIdGastoViaje(), g);
            }
        }

        // Soft-delete los que ya no vienen en el payload (edicion real, sin borrar/recrear el detalle).
        for (GastoViaje g : List.copyOf(detalle.getGastos())) {
            Long id = g.getIdGastoViaje();
            if (id == null) continue;
            boolean sigue = nuevos.stream().anyMatch(dto -> dto != null && dto.getId() > 0 && dto.getId() == id);
            if (!sigue) {
                detalle.getGastos().remove(g);
                gastosViajeRepository.delete(g);
            }
        }

        for (GastoViajeDTO gastoDTO : nuevos) {
            if (gastoDTO == null) continue;

            GastoViaje gasto;
            if (gastoDTO.getId() > 0 && existentes.containsKey(gastoDTO.getId())) {
                gasto = existentes.get(gastoDTO.getId());
            } else {
                gasto = mapper.toEntity(gastoDTO);
                gasto.setIdGastoViaje(null);
                gasto.setViajeDetalle(detalle);
                gasto.setUsuarioAdmin(usuarioAdmin);
                detalle.getGastos().add(gasto);
            }

            TipoGasto tipoGasto = tipoGastoRepository.findById(gastoDTO.getIdTipoGasto())
                    .orElseThrow(() -> new IllegalArgumentException("TipoGasto no encontrado"));
            gasto.setTipoGasto(tipoGasto);
            gasto.setMonto(gastoDTO.getMonto());
            gasto.setDescripcion(gastoDTO.getDescripcion());
            gasto.setEvidenciaUrl(gastoDTO.getEvidenciaUrl());
            gasto.setFechaGasto(gastoDTO.getFechaGasto());

            gastosService.guardarGasto(gasto);
        }
    }

    private void syncIngresosExtra(ViajeDetalle detalle, List<IngresoExtraDTO> incoming) {
        if (detalle == null) return;
        final List<IngresoExtraDTO> nuevos = incoming != null ? incoming : List.of();

        if (detalle.getIngresosExtra() == null) {
            detalle.setIngresosExtra(new ArrayList<>());
        }

        Map<Long, IngresoExtraViaje> existentes = new HashMap<>();
        for (IngresoExtraViaje i : detalle.getIngresosExtra()) {
            if (i.getIdIngresoExtraViaje() != null) {
                existentes.put(i.getIdIngresoExtraViaje(), i);
            }
        }

        // Soft-delete los que ya no vienen en el payload (edicion real, sin borrar/recrear el detalle).
        for (IngresoExtraViaje i : List.copyOf(detalle.getIngresosExtra())) {
            Long id = i.getIdIngresoExtraViaje();
            if (id == null) continue;
            boolean sigue = nuevos.stream().anyMatch(dto -> dto != null && dto.getId() > 0 && dto.getId() == id);
            if (!sigue) {
                detalle.getIngresosExtra().remove(i);
                ingresoExtraViajeRepository.delete(i);
            }
        }

        for (IngresoExtraDTO ingresoDTO : nuevos) {
            if (ingresoDTO == null) continue;

            IngresoExtraViaje ingreso;
            if (ingresoDTO.getId() > 0 && existentes.containsKey(ingresoDTO.getId())) {
                ingreso = existentes.get(ingresoDTO.getId());
            } else {
                ingreso = new IngresoExtraViaje();
                ingreso.setIdIngresoExtraViaje(null);
                ingreso.setViajeDetalle(detalle);
                detalle.getIngresosExtra().add(ingreso);
            }

            CategoriaIngresoExtra categoria = categoriaIngresoExtraRepository.findById(ingresoDTO.getIdCategoriaIngresoExtra())
                    .orElseThrow(() -> new IllegalArgumentException("CategoriaIngresoExtra no encontrada"));
            ingreso.setCategoriaIngresoExtra(categoria);
            ingreso.setMonto(ingresoDTO.getMonto());
            ingreso.setDescripcion(ingresoDTO.getDescripcion());
            ingreso.setFechaIngreso(ingresoDTO.getFechaIngreso());

            ingresoExtraViajeRepository.save(ingreso);
        }
    }
}
