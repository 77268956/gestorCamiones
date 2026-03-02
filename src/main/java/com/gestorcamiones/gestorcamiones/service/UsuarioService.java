package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.EditarUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCuenta;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Rol;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.mapper.UsuarioMapper;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import com.gestorcamiones.gestorcamiones.repository.RolRepository;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.IUsuarioService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementa la logica de negocio para administracion de usuarios y credenciales.
 */
@Service
public class UsuarioService implements IUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final LoginRepository loginRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            LoginRepository loginRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.loginRepository = loginRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UsuarioPerfilDTO> listarUsuarios() {
        return usuarioRepository.findAll()
                .stream()
                .map(UsuarioMapper::mapToPerfilDTO)
                .toList();
    }

    @Override
    public EstadoEmpleado[] estados() {
        return EstadoEmpleado.values();
    }


    @Override
    public UsuarioPerfilDTO obtenerPerfil(Long id) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return UsuarioMapper.mapToPerfilDTO(usuario);
    }

    @Override
    @Transactional
    public UsuarioPerfilDTO crearUsuario(CrearUsuarioDTO dto) {

        Rol rol = rolRepository.findById(dto.getId_rol())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        if (dto.getEstadoEmpleado() == null) {
            throw new RuntimeException("El estado del usuario es null");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setTelefono(dto.getTelefono());
        usuario.setDui(dto.getDui());
        usuario.setEstadoEmpleado(dto.getEstadoEmpleado());
        usuario.setRol(rol);

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        Login login = new Login();
        login.setEmail(dto.getEmail());
        login.setPassword(passwordEncoder.encode(dto.getPassword()));
        login.setUsuario(dto.getNombre());
        login.setEstadoCuenta(EstadoCuenta.habilitado);
        login.setUsuarioEntidad(usuarioGuardado);

        loginRepository.save(login);

        return UsuarioMapper.mapToPerfilDTO(usuario);
    }

    @Override
    public UsuarioPerfilDTO editarUsuario(Long id, EditarUsuarioDTO editarUsuarioDTO) {
        return null;
    }


    @Override
    @Transactional
    public void eliminarUsuario(Long id) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuarioRepository.delete(usuario);
    }

    /*
    @Override
@Transactional
public UsuarioPerfilDTO editarUsuario(Long id, EditarUsuarioDTO dto) {

    Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    usuario.setNombre(dto.getNombre());
    usuario.setApellido(dto.getApellido());
    usuario.setTelefono(dto.getTelefono());
    usuario.setDui(dto.getDui());
    usuario.setEstadoEmpleado(dto.getEstadoEmpleado());

    Usuario actualizado = usuarioRepository.save(usuario);

    return mapToPerfilDTO(actualizado);
}
     */


}
