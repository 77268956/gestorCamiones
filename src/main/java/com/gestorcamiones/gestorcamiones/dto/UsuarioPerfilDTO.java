package com.gestorcamiones.gestorcamiones.dto;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioPerfilDTO {

    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String usuario;
    private String telefono;
    private String dui;
    private String rol;
    private Long rolId;
    private EstadoEmpleado estado;
    private String fotoUrl;
}
