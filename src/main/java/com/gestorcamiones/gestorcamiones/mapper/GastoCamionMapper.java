package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoCamionDTO;
import com.gestorcamiones.gestorcamiones.entity.GastoCamion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface GastoCamionMapper {

    @Mapping(target = "id", source = "idGastoCamion")
    @Mapping(target = "idCamion", source = "camion.idCamion")
    @Mapping(target = "idTipoGasto", source = "tipoGasto.idTipoGasto")
    @Mapping(target = "tipoGasto", source = "tipoGasto.tipoGasto")
    GastoCamionDTO toDTO(GastoCamion entity);

    List<GastoCamionDTO> toDTO(List<GastoCamion> entities);
}

