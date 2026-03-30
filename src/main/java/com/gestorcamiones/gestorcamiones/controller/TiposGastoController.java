package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.gasto.TiposgastosDTO;
import com.gestorcamiones.gestorcamiones.service.gasto.TipoGastoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.mapstruct.Mapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tipogasto")
@Tag(name = "tipoGasto" , description = "Operaciones para majar los tipos de gastos")
public class TiposGastoController {
    private final TipoGastoService service;

    public TiposGastoController(TipoGastoService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista de tipos de gastos", description = "Retorna todos los tipo de gastos que hay")
    List<TiposgastosDTO> listaTiposGasto(){
        return service.listaTiposGastos();
    }
}
