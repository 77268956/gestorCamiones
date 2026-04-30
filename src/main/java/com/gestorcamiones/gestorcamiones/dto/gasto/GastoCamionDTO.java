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
public class GastoCamionDTO {
    private Long id;

    private Long idCamion;
    private Long idTipoGasto;
    private String tipoGasto;

    private BigDecimal monto;
    private String descripcion;
    private LocalDate fechaGasto;
    private String evidenciaUrl;
}

