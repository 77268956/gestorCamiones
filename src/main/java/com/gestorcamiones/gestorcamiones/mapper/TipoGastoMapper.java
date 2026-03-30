package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.gasto.TiposgastosDTO;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
@Mapper(componentModel = "spring")
public interface TipoGastoMapper {

    @Mapping(source = "idTipoGasto", target = "id")
    TiposgastosDTO toDTO(TipoGasto tipoGasto);

    List<TiposgastosDTO> toDTO(List<TipoGasto> lista);
}