package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.gasto.GastosGeneralesDTO;
import com.gestorcamiones.gestorcamiones.entity.GastosGenerales;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface GastosGeneralesMapper {

    @Mapping(target = "idGastosGenerales", source = "idGastosGenerales")
    @Mapping(target = "idTipoGasto", source = "tipoGasto.idTipoGasto")
    @Mapping(target = "nombreTipoGasto", source = "tipoGasto.tipoGasto")
    @Mapping(target = "idAdmin", source = "admin.idUsuarios")
    @Mapping(target = "nombreAdmin", source = "admin.nombre")
    GastosGeneralesDTO toDTO(GastosGenerales entity);

    List<GastosGeneralesDTO> toDTO(List<GastosGenerales> entities);
}
