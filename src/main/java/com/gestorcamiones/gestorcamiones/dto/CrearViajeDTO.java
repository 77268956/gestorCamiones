package com.gestorcamiones.gestorcamiones.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CrearViajeDTO {

 private String nombreViaje;
 private long idCliente;
 private boolean tieneVuelta;

 private List<TramoDTO> tramos;

}
