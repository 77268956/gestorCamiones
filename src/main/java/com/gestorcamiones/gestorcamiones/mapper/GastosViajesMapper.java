package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.entity.GastoViaje;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GastosViajesMapper {

    @Mapping(source = "idGastoViaje", target = "id")
    @Mapping(source = "viajeDetalle.id", target = "idViajeDetalle")
    @Mapping(source = "tipoGasto.id", target = "idTipoGasto")
    @Mapping(source = "usuarioAdmin.id", target = "idUsuarioAdmin")

    GastoViajeDTO toDto(GastoViaje gastoViaje);



    @Mapping(source = "id", target = "idGastoViaje")
    @Mapping(target = "viajeDetalle", ignore = true)
    @Mapping(target = "tipoGasto", ignore = true)
    @Mapping(target = "usuarioAdmin", ignore = true)

    GastoViaje toEntity(GastoViajeDTO dto);
}

