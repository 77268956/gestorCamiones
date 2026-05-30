package com.gestorcamiones.gestorcamiones.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioCreadoResponseDTO {
    private UsuarioPerfilDTO usuario;
    private String passwordTemporal;
}

