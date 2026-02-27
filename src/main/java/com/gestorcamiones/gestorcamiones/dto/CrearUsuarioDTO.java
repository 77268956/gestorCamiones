package com.gestorcamiones.gestorcamiones.dto;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class CrearUsuarioDTO {

    // Datos personales
    private String nombre;
    private String apellido;
    private String telefono;
    private String dui;
    private EstadoEmpleado estadoEmpleado;

    // Login
    private String email;
    private String password;

    // Configuración
    private Long id_rol;
    private Long camionId;
}