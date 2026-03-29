package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastoViajeDTO;
import com.gestorcamiones.gestorcamiones.entity.GastoViaje;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GastosViajesMapper {

    @Mapping(source = "idGastoViaje", target = "id")
    @Mapping(source = "viajeDetalle.idViajeDetalle", target = "idViajeDetalle")
    @Mapping(source = "tipoGasto.idTipoGasto", target = "idTipoGasto")
    @Mapping(source = "usuarioAdmin.idUsuarios", target = "idUsuarioAdmin")
    GastoViajeDTO toDto(GastoViaje gastoViaje);



    @Mapping(source = "id", target = "idGastoViaje")
    @Mapping(target = "viajeDetalle", ignore = true)
    @Mapping(target = "tipoGasto", ignore = true)
    @Mapping(target = "usuarioAdmin", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    GastoViaje toEntity(GastoViajeDTO dto);
}
