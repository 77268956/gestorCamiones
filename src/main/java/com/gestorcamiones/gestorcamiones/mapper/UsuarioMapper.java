package com.gestorcamiones.gestorcamiones.mapper;

import com.gestorcamiones.gestorcamiones.dto.usuario.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "id", source = "idUsuarios")
    @Mapping(target = "email", source = "login.email")
    @Mapping(target = "usuario", source = "login.usuario")
    @Mapping(target = "rol", source = "rol.rol")
    @Mapping(target = "rolId", source = "rol.idRol")
    @Mapping(target = "estado", source = "estadoEmpleado")
    @Mapping(target = "camionId", source = "camion.idCamion")
    @Mapping(target = "camionPlaca", source = "camion.placa")
    @Mapping(target = "camionModelo", source = "camion.modelo")
    UsuarioPerfilDTO mapToPerfilDTO(Usuario usuario);
}
