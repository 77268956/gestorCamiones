package com.gestorcamiones.gestorcamiones.service.viaje;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestorcamiones.gestorcamiones.dto.auditoria.ViajeAuditoriaDTO;
import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.lote.LoteResumenDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ActualizarViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.DetalleViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ListaViajesDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ViajeUpsertDTO;
import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
import com.gestorcamiones.gestorcamiones.entity.*;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import com.gestorcamiones.gestorcamiones.repository.LoteRepository;
import com.gestorcamiones.gestorcamiones.repository.ViajeLoteRepository;
import com.gestorcamiones.gestorcamiones.repository.ViajeRepository;
import com.gestorcamiones.gestorcamiones.service.auditoria.AuditoriaDetalladaService;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de viajes para V2.
 * Ya no hay relación directa viaje-cliente (se maneja vía lotes).
 * precioViaje fue eliminado de viaje_detalle.
 * Los clientes se asocian indirectamente: viaje → viaje_lote → lote → cliente.
 */
@Service
public class ViajeService implements IViajeService {

    private ViajeRepository viajeRepository;
    private ViajeDetallesService viajeDetallesService;
    private final ViajeLoteRepository viajeLoteRepository;
    private final LoteRepository loteRepository;
    private final AuditoriaDetalladaService auditori;
    private final ObjectMapper objectMapper;

    public ViajeService(ViajeRepository viajeRepository,
                        ViajeDetallesService viajeDetallesService,
                        ViajeLoteRepository viajeLoteRepository,
                        LoteRepository loteRepository,
                        AuditoriaDetalladaService auditori,
                        ObjectMapper objectMapper) {
        this.viajeRepository = viajeRepository;
        this.viajeDetallesService = viajeDetallesService;
        this.viajeLoteRepository = viajeLoteRepository;
        this.loteRepository = loteRepository;
        this.auditori = auditori;
        this.objectMapper = objectMapper;
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

            // separar IDA y VUELTA
            List<DetalleViajeDTO> ida = new ArrayList<>();
            List<DetalleViajeDTO> vuelta = new ArrayList<>();

            BigDecimal gastoTotal = BigDecimal.ZERO;

            int contador = 0;
            for (ViajeDetalle detalle : viaje.getDetalles()) {

                // separar por tipo
                DetalleViajeDTO detalleDTO = toDetalleDTO(detalle);
                if (detalle.getTipoTramo() == TipoTramo.ida) {
                    ida.add(detalleDTO);
                } else if (detalle.getTipoTramo() == TipoTramo.vuelta) {
                    vuelta.add(detalleDTO);
                }

                if (detalle.getGastos() != null) {
                    for (GastoViaje gastos : detalle.getGastos()) {
                        if (gastos.getMonto() != null) {
                            gastoTotal = gastoTotal.add(gastos.getMonto());
                        }
                    }
                }

                if (detalle.getEstado() != EstadoViaje.cancelado && detalle.getEstado() != EstadoViaje.completado) {
                    contador++;
                }
            }

            dto.setViajesActivos(contador);
            dto.setListaIDa(ida);
            dto.setListaVuelta(vuelta);

            dto.setViajesTotales(ida.size() + vuelta.size());

            dto.setGastoTotal(gastoTotal);

            // V2: Lotes asociados al viaje
            List<LoteResumenDTO> lotesDTO = new ArrayList<>();
            if (viaje.getViajeLotes() != null) {
                for (ViajeLote vl : viaje.getViajeLotes()) {
                    if (vl.getLote() != null) {
                        lotesDTO.add(toLoteResumenDTO(vl.getLote()));
                    }
                }
            }
            dto.setLotes(lotesDTO);
            dto.setTotalLotes(lotesDTO.size());

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

        // V2: Asociar lotes al viaje
        syncLotes(viaje, dto.getLoteIds());

        return dto;
    }

    private Viaje guardarViaje(ViajeUpsertDTO dto, Usuario usuario) {

        Viaje viaje = new Viaje();
        viaje.setNombreViaje(dto.getNombreViaje());
        viaje.setAdmin(usuario);
        viajeRepository.save(viaje);

        // Auditoría: usar snapshot DTO para evitar serialización del grafo completo (lazy init).
        JsonNode despuesJson = objectMapper.valueToTree(toAuditoriaDTO(viaje));

        auditori.registrar(
                "viajes",
                usuario.getIdUsuarios(),
                AccionAuditoria.CREATE,
                usuario.getNombre(),
                null,
                despuesJson,
                viaje.getIdViaje()
        );
        return viaje;
    }

    @Transactional
    @Override
    public ActualizarViajeDTO actualizarViaje(Long idViaje, ActualizarViajeDTO dto, Usuario usuario) {
        // usuario admin
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no autenticado correctamente");
        }
        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        JsonNode antesJson = objectMapper.valueToTree(toAuditoriaDTO(viaje));

        viaje.setNombreViaje(dto.getNombreViaje());
        viaje.setAdmin(usuario);

        if (dto.getTramos() != null) {
            viajeDetallesService.actualizarTramos(dto.getTramos(), viaje, usuario);
        }

        // V2: Sincronizar lotes
        syncLotes(viaje, dto.getLoteIds());

        viajeRepository.save(viaje);

        JsonNode despuesJson = objectMapper.valueToTree(toAuditoriaDTO(viaje));
        auditori.registrar(
                "viajes",
                usuario.getIdUsuarios(),
                AccionAuditoria.UPDATE,
                usuario.getNombre(),
                antesJson,
                despuesJson,
                viaje.getIdViaje()
        );
        return dto;
    }

    public ViajeUpsertDTO obtenerViaje(Long idViaje) {
        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        ViajeUpsertDTO dto = new ViajeUpsertDTO();
        dto.setIdViaje(viaje.getIdViaje());
        dto.setNombreViaje(viaje.getNombreViaje());

        List<TramoDTO> tramos = new ArrayList<>();
        for (ViajeDetalle detalle : viaje.getDetalles()) {
            TramoDTO tramo = new TramoDTO();
            tramo.setId(detalle.getIdViajeDetalle());
            tramo.setTipoTramo(detalle.getTipoTramo());
            tramo.setEstadoViaje(detalle.getEstado());
            tramo.setPagado(Boolean.TRUE.equals(detalle.getPagado()));
            tramo.setIva(Boolean.TRUE.equals(detalle.getIva()));
            tramo.setFechaSalida(detalle.getFechaSalida());
            tramo.setFechaEntrada(detalle.getFechaLlegada());

            // Ubicación (V2)
            tramo.setPaisSalida(detalle.getPaisSalida());
            tramo.setPaisDestino(detalle.getPaisDestino());
            tramo.setDireccionSalida(detalle.getDireccionSalida());
            tramo.setDireccionDestino(detalle.getDireccionDestino());
            tramo.setObservaciones(detalle.getObservaciones());

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

        // V2: Incluir IDs de lotes asociados
        List<Long> loteIds = new ArrayList<>();
        if (viaje.getViajeLotes() != null) {
            for (ViajeLote vl : viaje.getViajeLotes()) {
                if (vl.getLote() != null) {
                    loteIds.add(vl.getLote().getIdLote());
                }
            }
        }
        dto.setLoteIds(loteIds);

        return dto;
    }

    /**
     * Sincroniza la relación M:N viaje-lote.
     * Elimina las asociaciones actuales y crea las nuevas.
     */
    @Transactional
    protected void syncLotes(Viaje viaje, List<Long> loteIds) {
        if (loteIds == null) return;

        // Limpiar asociaciones existentes
        viaje.getViajeLotes().clear();
        viajeLoteRepository.deleteByViaje_IdViaje(viaje.getIdViaje());
        viajeLoteRepository.flush();

        if (loteIds.isEmpty()) return;

        // Buscar lotes válidos
        List<Lote> lotes = loteRepository.findAllByIdLoteInAndDeletedAtIsNull(loteIds);

        for (Lote lote : lotes) {
            ViajeLote vl = new ViajeLote();
            vl.setViaje(viaje);
            vl.setLote(lote);
            viajeLoteRepository.save(vl);
            viaje.getViajeLotes().add(vl);
        }
    }

    private DetalleViajeDTO toDetalleDTO(ViajeDetalle detalle) {
        DetalleViajeDTO dto = new DetalleViajeDTO();

        dto.setId(detalle.getIdViajeDetalle());
        dto.setTipoTramo(detalle.getTipoTramo());
        dto.setEstadoViaje(detalle.getEstado());
        dto.setPagado(detalle.getPagado());
        dto.setIva(detalle.getIva());

        // Ubicación (V2)
        dto.setPaisSalida(detalle.getPaisSalida());
        dto.setPaisDestino(detalle.getPaisDestino());
        dto.setDireccionSalida(detalle.getDireccionSalida());
        dto.setDireccionDestino(detalle.getDireccionDestino());
        dto.setObservaciones(detalle.getObservaciones());

        BigDecimal gastosTotal = BigDecimal.ZERO;
        if (detalle.getGastos() != null) {
            for (GastoViaje gasto : detalle.getGastos()) {
                if (gasto.getMonto() != null) {
                    gastosTotal = gastosTotal.add(gasto.getMonto());
                }
            }
        }
        dto.setGastoTotal(gastosTotal);

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

    /**
     * Convierte un Lote a su DTO resumido para la vista de viajes.
     */
    private LoteResumenDTO toLoteResumenDTO(Lote lote) {
        LoteResumenDTO dto = new LoteResumenDTO();
        dto.setIdLote(lote.getIdLote());
        dto.setNumeroLote(lote.getNumeroLote());
        dto.setEstado(lote.getEstado() != null ? lote.getEstado().getDbValue() : null);
        dto.setNombreEncargado(lote.getNombreEncargado());
        dto.setPeso(lote.getPeso());
        dto.setValorDeclarado(lote.getValorDeclarado());
        dto.setDescripcion(lote.getDescripcion());

        if (lote.getCategoria() != null) {
            dto.setCategoriaNombre(lote.getCategoria().getNombre());
        }
        if (lote.getClienteRemitente() != null) {
            dto.setRemitenteNombre(lote.getClienteRemitente().getNombre());
        }
        if (lote.getClienteDestinatario() != null) {
            dto.setDestinatarioNombre(lote.getClienteDestinatario().getNombre());
        }
        return dto;
    }

    private ViajeAuditoriaDTO toAuditoriaDTO(Viaje viaje) {
        ViajeAuditoriaDTO dto = new ViajeAuditoriaDTO();
        if (viaje == null) {
            return dto;
        }

        dto.setIdViaje(viaje.getIdViaje());
        dto.setNombreViaje(viaje.getNombreViaje());

        if (viaje.getAdmin() != null) {
            dto.setAdminId(viaje.getAdmin().getIdUsuarios());
            String nombre = viaje.getAdmin().getNombre() != null ? viaje.getAdmin().getNombre() : "";
            String apellido = viaje.getAdmin().getApellido() != null ? viaje.getAdmin().getApellido() : "";
            dto.setAdminNombre((nombre + " " + apellido).trim());
        }

        if (viaje.getDetalles() != null) {
            List<ViajeAuditoriaDTO.TramoAuditoriaDTO> tramos = new ArrayList<>();
            for (ViajeDetalle detalle : viaje.getDetalles()) {
                tramos.add(toAuditoriaTramoDTO(detalle));
            }
            dto.setTramos(tramos);
        }

        return dto;
    }

    private ViajeAuditoriaDTO.TramoAuditoriaDTO toAuditoriaTramoDTO(ViajeDetalle detalle) {
        ViajeAuditoriaDTO.TramoAuditoriaDTO dto = new ViajeAuditoriaDTO.TramoAuditoriaDTO();
        if (detalle == null) {
            return dto;
        }

        dto.setIdViajeDetalle(detalle.getIdViajeDetalle());
        dto.setTipoTramo(detalle.getTipoTramo());
        dto.setEstado(detalle.getEstado());
        dto.setPagado(detalle.getPagado());
        dto.setIva(detalle.getIva());

        // Ubicación (V2)
        dto.setPaisSalida(detalle.getPaisSalida());
        dto.setPaisDestino(detalle.getPaisDestino());
        dto.setDireccionSalida(detalle.getDireccionSalida());
        dto.setDireccionDestino(detalle.getDireccionDestino());
        dto.setObservaciones(detalle.getObservaciones());

        dto.setFechaSalida(detalle.getFechaSalida());
        dto.setFechaLlegada(detalle.getFechaLlegada());

        if (detalle.getCamion() != null) {
            dto.setCamionId(detalle.getCamion().getIdCamion());
            dto.setCamionNombre(detalle.getCamion().getNombre());
            dto.setCamionPlaca(detalle.getCamion().getPlaca());
        }

        if (detalle.getChofer() != null) {
            dto.setChoferId(detalle.getChofer().getIdUsuarios());
            String nombre = detalle.getChofer().getNombre() != null ? detalle.getChofer().getNombre() : "";
            String apellido = detalle.getChofer().getApellido() != null ? detalle.getChofer().getApellido() : "";
            dto.setChoferNombre((nombre + " " + apellido).trim());
        }

        BigDecimal gastosTotal = BigDecimal.ZERO;
        if (detalle.getGastos() != null) {
            for (GastoViaje gasto : detalle.getGastos()) {
                if (gasto != null && gasto.getMonto() != null) {
                    gastosTotal = gastosTotal.add(gasto.getMonto());
                }
            }
        }
        dto.setGastoTotal(gastosTotal);

        return dto;
    }

    @Transactional
    public void eliminarViaje(Long idViaje, Usuario usuario) {

        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new RuntimeException("Viaje no encontrado"));

        // Auditoría consistente: capturar el "antes" antes de borrar.
        JsonNode antesJson = objectMapper.valueToTree(toAuditoriaDTO(viaje));
        viajeRepository.delete(viaje);
        auditori.registrar(
                "viajes",
                usuario.getIdUsuarios(),
                AccionAuditoria.DELETE,
                usuario.getNombre(),
                antesJson,
                null,
                viaje.getIdViaje()
        );
    }
}
