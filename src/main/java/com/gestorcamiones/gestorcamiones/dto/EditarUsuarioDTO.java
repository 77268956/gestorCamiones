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
public class EditarUsuarioDTO {
    //datos solo del usuario
    private long idUsuario;
    private String nombre;
    private String apellido;
    EstadoEmpleado estadoEmpleado;
    private String telefono;
    private String dui;
    private String fotoUrl;

    //datos solo de rol
    private String rol;

    //datos de login
    private String usuario;
    private String email;
    private String password;
}
