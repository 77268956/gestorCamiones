package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.viaje.CrearViajeDTO;
import com.gestorcamiones.gestorcamiones.entity.Viaje;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ViajeMapper {

    @Mapping(target = "idViaje", source = "idViaje")
    @Mapping(target = "tramos", ignore = true)
    CrearViajeDTO toCrearViajeDTO(Viaje viaje);

    @Mapping(target = "idViaje", source = "idViaje")
    @Mapping(target = "admin", ignore = true)
    @Mapping(target = "detalles", ignore = true)
    @Mapping(target = "viajeLotes", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Viaje toEntity(CrearViajeDTO dto);
}
