package com.gestorcamiones.gestorcamiones.dto.gasto;

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
public class GastosGeneralesDTO {
    private Long idGastosGenerales;
    private BigDecimal monto;
    private String descripcion;
    private LocalDate fechaGasto;
    private String evidenciaUrl;
    private Long idTipoGasto;
    private String nombreTipoGasto;
    private Long idAdmin;
    private String nombreAdmin;
}
