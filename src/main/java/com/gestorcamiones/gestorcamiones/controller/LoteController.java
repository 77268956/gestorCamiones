package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.lote.LoteResumenDTO;
import com.gestorcamiones.gestorcamiones.dto.lote.LoteUpsertDTO;
import com.gestorcamiones.gestorcamiones.entity.Categoria;
import com.gestorcamiones.gestorcamiones.entity.Cliente;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoLote;
import com.gestorcamiones.gestorcamiones.entity.Lote;
import com.gestorcamiones.gestorcamiones.repository.CategoriaRepository;
import com.gestorcamiones.gestorcamiones.repository.ClienteRepository;
import com.gestorcamiones.gestorcamiones.repository.LoteRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Endpoints de Lotes (V2).
 * Se usa principalmente por el frontend de Viajes para asociar lotes a un viaje (viaje_lote).
 */
@RestController
@RequestMapping("/api/lotes")
public class LoteController {

    private final LoteRepository loteRepository;
    private final CategoriaRepository categoriaRepository;
    private final ClienteRepository clienteRepository;

    public LoteController(LoteRepository loteRepository,
                          CategoriaRepository categoriaRepository,
                          ClienteRepository clienteRepository) {
        this.loteRepository = loteRepository;
        this.categoriaRepository = categoriaRepository;
        this.clienteRepository = clienteRepository;
    }

    /**
     * Lista lotes activos (no borrados).
     * Filtros opcionales:
     * - q: busca en numeroLote / nombreEncargado / descripcion
     * - estado: filtra por valor db del enum (ej: en_transito, en_bodega, entregado)
     */
    @GetMapping
    @Transactional(readOnly = true)
    public List<LoteResumenDTO> listarLotes(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "false") boolean disponibles
    ) {
        String qNorm = q != null ? q.trim().toLowerCase(Locale.ROOT) : "";
        String estadoNorm = estado != null ? estado.trim().toLowerCase(Locale.ROOT) : "";

        return loteRepository.findAllByDeletedAtIsNull().stream()
                .filter(l -> !disponibles || l.getViajeLotes().isEmpty())
                .filter(l -> {
                    if (qNorm.isEmpty()) return true;
                    return containsIgnoreCase(l.getNumeroLote(), qNorm)
                            || containsIgnoreCase(l.getNombreEncargado(), qNorm)
                            || containsIgnoreCase(l.getDescripcion(), qNorm);
                })
                .filter(l -> {
                    if (estadoNorm.isEmpty()) return true;
                    return l.getEstado() != null
                            && l.getEstado().getDbValue() != null
                            && l.getEstado().getDbValue().trim().toLowerCase(Locale.ROOT).equals(estadoNorm);
                })
                .sorted(Comparator.comparing(Lote::getIdLote, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResumenDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/estados")
    public List<String> listarEstados() {
        return List.of(EstadoLote.values()).stream().map(EstadoLote::getDbValue).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public LoteUpsertDTO obtenerLote(@PathVariable Long id) {
        Lote lote = loteRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));
        LoteUpsertDTO dto = new LoteUpsertDTO();
        dto.setNumeroLote(lote.getNumeroLote());
        dto.setEstado(lote.getEstado() != null ? lote.getEstado().getDbValue() : null);
        dto.setIdCategoria(lote.getCategoria() != null ? lote.getCategoria().getIdCategoria() : null);
        dto.setIdClienteRemitente(lote.getClienteRemitente() != null ? lote.getClienteRemitente().getId() : null);
        dto.setIdClienteDestinatario(lote.getClienteDestinatario() != null ? lote.getClienteDestinatario().getId() : null);
        dto.setNombreEncargado(lote.getNombreEncargado());
        dto.setPeso(lote.getPeso());
        dto.setDescripcion(lote.getDescripcion());
        dto.setValorDeclarado(lote.getValorDeclarado());
        //dto.setTipoTramo(lote.get);
        return dto;
    }

    @PostMapping
    @Transactional
    public LoteResumenDTO crear(@RequestBody LoteUpsertDTO dto) {
        Lote lote = new Lote();
        aplicarUpsert(lote, dto);
        lote = loteRepository.save(lote);
        return toResumenDTO(lote);
    }

    @PutMapping("/{id}")
    @Transactional
    public LoteResumenDTO editar(@PathVariable Long id, @RequestBody LoteUpsertDTO dto) {
        Lote lote = loteRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));
        aplicarUpsert(lote, dto);
        lote = loteRepository.save(lote);
        return toResumenDTO(lote);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void eliminar(@PathVariable Long id) {
        Lote lote = loteRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));
        loteRepository.delete(lote);
    }

    private boolean containsIgnoreCase(String value, String qNorm) {
        if (value == null) return false;
        return value.toLowerCase(Locale.ROOT).contains(qNorm);
    }

    private void aplicarUpsert(Lote lote, LoteUpsertDTO dto) {
        if (dto == null) throw new IllegalArgumentException("Payload invalido");

        if (dto.getNumeroLote() == null || dto.getNumeroLote().trim().isEmpty()) {
            throw new IllegalArgumentException("El numero de lote es obligatorio");
        }
        lote.setNumeroLote(dto.getNumeroLote().trim());

        if (dto.getEstado() == null || dto.getEstado().trim().isEmpty()) {
            throw new IllegalArgumentException("El estado del lote es obligatorio");
        }
        lote.setEstado(EstadoLote.fromDbValue(dto.getEstado().trim()));

        if (dto.getIdCategoria() == null) {
            throw new IllegalArgumentException("La categoria es obligatoria");
        }
        Categoria cat = categoriaRepository.findById(dto.getIdCategoria())
                .orElseThrow(() -> new IllegalArgumentException("Categoria no encontrada"));
        lote.setCategoria(cat);

        if (dto.getIdClienteRemitente() == null) {
            throw new IllegalArgumentException("El cliente remitente es obligatorio");
        }
        Cliente remitente = clienteRepository.findById(dto.getIdClienteRemitente())
                .orElseThrow(() -> new IllegalArgumentException("Cliente remitente no encontrado"));
        lote.setClienteRemitente(remitente);

        if (dto.getIdClienteDestinatario() != null) {
            Cliente destinatario = clienteRepository.findById(dto.getIdClienteDestinatario())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente destinatario no encontrado"));
            lote.setClienteDestinatario(destinatario);
        } else {
            lote.setClienteDestinatario(null);
        }

        lote.setNombreEncargado(dto.getNombreEncargado());
        lote.setPeso(dto.getPeso());
        lote.setDescripcion(dto.getDescripcion());
        lote.setValorDeclarado(dto.getValorDeclarado());
    }

    private LoteResumenDTO toResumenDTO(Lote lote) {
        LoteResumenDTO dto = new LoteResumenDTO();
        dto.setIdLote(lote.getIdLote());
        dto.setNumeroLote(lote.getNumeroLote());
        dto.setEstado(lote.getEstado() != null ? lote.getEstado().getDbValue() : null);
        dto.setNombreEncargado(lote.getNombreEncargado());
        dto.setPeso(lote.getPeso());
        dto.setValorDeclarado(lote.getValorDeclarado());
        dto.setDescripcion(lote.getDescripcion());
        dto.setAsignado(!lote.getViajeLotes().isEmpty());

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
}
