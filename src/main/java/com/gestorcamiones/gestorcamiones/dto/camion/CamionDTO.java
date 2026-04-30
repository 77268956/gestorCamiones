package com.gestorcamiones.gestorcamiones.dto.camion;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CamionDTO {
    private Long id;

    @NotBlank(message = "La placa es obligatoria")
    private String placa;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El codigo es obligatorio")
    private String codigo;

    @NotBlank(message = "El modelo es obligatorio")
    private String modelo;

    private String fotoUrl;

    private String comentario;

    private BigDecimal precioCompra;

    @NotNull(message = "El estado es obligatorio")
    private EstadoCamion estadoCamion;
}
