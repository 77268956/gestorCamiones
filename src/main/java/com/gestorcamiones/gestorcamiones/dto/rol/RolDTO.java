package com.gestorcamiones.gestorcamiones.dto.rol;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RolDTO {
    @JsonProperty("id_rol")
    private Long idRol;
    private String nombre;

    public RolDTO(Long idRol, String nombre) {
        this.idRol = idRol;
        this.nombre = nombre;
    }
}
