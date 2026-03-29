package com.gestorcamiones.gestorcamiones.dto;

import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.entity.ViajeDetalle;
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
public class GastoViajeDTO {

    private long id;
    private Long idViajeDetalle;
    private Long idUsuarioAdmin;

    private long idTipoGasto;

    private BigDecimal monto;
    private String descripcion;
    private String evidenciaUrl;
    private LocalDate fechaGasto;
}