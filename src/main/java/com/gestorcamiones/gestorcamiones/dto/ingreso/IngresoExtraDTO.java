package com.gestorcamiones.gestorcamiones.dto.ingreso;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IngresoExtraDTO {

    private long id;
    private Long idViajeDetalle;
    private long idCategoriaIngresoExtra;
    private String categoriaNombre;

    private BigDecimal monto;
    private String descripcion;
    private LocalDate fechaIngreso;
}
