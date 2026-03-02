package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.CrearCamionDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;


public class CamionMapper {

    public static CrearCamionDTO toDTO(Camion camion) {
        return new CrearCamionDTO(
                camion.getPlaca(),
                camion.getNombre(),
                camion.getCodigo(),
                camion.getModelo(),
                camion.getFotoUrl(),
                camion.getComentario(),
                camion.getEstadoCamion()
        );
    }

    public static Camion toEntity(CrearCamionDTO dto) {
        Camion camion = new Camion();
        camion.setPlaca(dto.getPlaca());
        camion.setNombre(dto.getNombre());
        camion.setCodigo(dto.getCodigo());
        camion.setModelo(dto.getModelo());
        camion.setFotoUrl(dto.getFotoUrl());
        camion.setComentario(dto.getComentario());
        camion.setEstadoCamion(dto.getEstadoCamion());
        return camion;
    }
}