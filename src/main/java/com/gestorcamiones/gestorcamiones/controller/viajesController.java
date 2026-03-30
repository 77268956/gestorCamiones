package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.viaje.ActualizarViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ListaViajesDTO;
import com.gestorcamiones.gestorcamiones.dto.viaje.ViajeUpsertDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.viaje.ViajeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/viajes")

public class viajesController {
    private ViajeService viajeService;

    public viajesController(ViajeService viajeService) {
        this.viajeService = viajeService;
    }

    @GetMapping("/estados")
    public EstadoViaje[] listarEstados() {
        return EstadoViaje.values();
    }

    @GetMapping
    public Page<ListaViajesDTO> listarViajes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "false") boolean excluirCompletados,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return viajeService.listaViejes(pageable, q, estado, fechaInicio, fechaFin, excluirCompletados);
    }

    @GetMapping("/{idViaje}")
    public ViajeUpsertDTO obtenerViaje(@PathVariable Long idViaje) {
        return viajeService.obtenerViaje(idViaje);
    }

    @PostMapping
    public CrearViajeDTO crearViaje(
            @RequestBody CrearViajeDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return viajeService.CrearViaje(dto, userDetails.getUsuario());
    }

    @PutMapping("/{idViaje}")
    public ActualizarViajeDTO actualizarViaje(
            @PathVariable Long idViaje,
            @RequestBody ActualizarViajeDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return viajeService.actualizarViaje(idViaje, dto, userDetails.getUsuario());
    }
}
