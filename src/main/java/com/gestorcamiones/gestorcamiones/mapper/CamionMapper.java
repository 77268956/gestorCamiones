package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.camion.CamionDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CamionMapper {

    @Mapping(target = "id", source = "idCamion")
    CamionDTO toDTO(Camion camion);

    @Mapping(target = "idCamion", source = "id")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Camion toEntity(CamionDTO dto);
}
