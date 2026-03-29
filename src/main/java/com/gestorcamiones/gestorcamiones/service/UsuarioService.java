package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.usuario.CrearUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.usuario.EditarUsuarioDTO;
import com.gestorcamiones.gestorcamiones.dto.usuario.UsuarioPerfilDTO;
import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCuenta;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Rol;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.mapper.UsuarioMapper;
import com.gestorcamiones.gestorcamiones.repository.CamionRepository;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import com.gestorcamiones.gestorcamiones.repository.RolRepository;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.IUsuarioService;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Implementa la logica de negocio para administracion de usuarios y credenciales.
 */
@Service
public class UsuarioService implements IUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final LoginRepository loginRepository;
    private final RolRepository rolRepository;
    private final CamionRepository camionRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioMapper usuarioMapper;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            LoginRepository loginRepository,
            RolRepository rolRepository,
            CamionRepository camionRepository,
            PasswordEncoder passwordEncoder,
            UsuarioMapper usuarioMapper
    ) {
        this.usuarioRepository = usuarioRepository;
        this.loginRepository = loginRepository;
        this.rolRepository = rolRepository;
        this.camionRepository = camionRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioMapper = usuarioMapper;
    }

    @Override
    public Page<UsuarioPerfilDTO> listarUsuarios(Pageable pageable, String texto, EstadoEmpleado estado) {
        String textoNormalizado = (texto == null || texto.isBlank()) ? "" : texto.trim();
        Page<Usuario> page = usuarioRepository.buscarFiltrados(textoNormalizado, estado, pageable);
        return page.map(usuarioMapper::mapToPerfilDTO);
    }

    @Override
    public EstadoEmpleado[] estados() {
        return EstadoEmpleado.values();
    }


    @Override
    public UsuarioPerfilDTO obtenerPerfil(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return usuarioMapper.mapToPerfilDTO(usuario);
    }

    @Override
    @Transactional
    public UsuarioPerfilDTO crearUsuario(CrearUsuarioDTO dto) {

        Rol rol = rolRepository.findById(dto.getId_rol())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));

        if (dto.getEstadoEmpleado() == null) {
            throw new IllegalArgumentException("El estado del usuario esta vacio");
        }

        Camion camion = null;
        if (dto.getCamionId() != null) {
            camion = camionRepository.findById(dto.getCamionId())
                    .orElseThrow(() -> new IllegalArgumentException("Camion no encontrado"));
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setTelefono(dto.getTelefono());
        usuario.setDui(dto.getDui());
        usuario.setEstadoEmpleado(dto.getEstadoEmpleado());
        usuario.setRol(rol);
        usuario.setCamion(camion);

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        Login login = new Login();
        login.setEmail(dto.getEmail());
        login.setPassword(passwordEncoder.encode(dto.getPassword()));
        login.setUsuario(dto.getNombre());
        login.setEstadoCuenta(EstadoCuenta.habilitado);
        login.setUsuarioEntidad(usuarioGuardado);

        loginRepository.save(login);

        usuarioGuardado.setLogin(login);
        return usuarioMapper.mapToPerfilDTO(usuarioGuardado);
    }

    @Override
    @Transactional
    public UsuarioPerfilDTO editarUsuario(Long id, EditarUsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("El usuario no se encontro" + id));

        Long rolId = null;
        if (dto.getRol() != null && !dto.getRol().isBlank()) {
            rolId = Long.valueOf(dto.getRol());
        }

        Rol rol = rolId == null
                ? usuario.getRol()
                : rolRepository.findById(rolId)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado"));

        if (usuarioRepository.existsByNombreAndApellidoAndIdUsuariosNot(dto.getNombre(), dto.getApellido(), id)) {
            throw new IllegalArgumentException("El usuario ya existe");
        }

        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setTelefono(dto.getTelefono());
        usuario.setDui(dto.getDui());
        if (dto.getEstadoEmpleado() != null) {
            usuario.setEstadoEmpleado(dto.getEstadoEmpleado());
        }
        usuario.setRol(rol);

        Camion camion = null;
        if (dto.getCamionId() != null) {
            camion = camionRepository.findById(dto.getCamionId())
                    .orElseThrow(() -> new IllegalArgumentException("Camion no encontrado"));
        }
        usuario.setCamion(camion);

        // cudardar el usuarios
        usuarioRepository.save(usuario);

        // loguin
        Login login = loginRepository.findByUsuarioEntidad_IdUsuarios(id)
                .orElseThrow(() -> new IllegalArgumentException("El login no se encontro" + id));

        // validar campos
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            if (loginRepository.existsByEmailIgnoreCaseAndIdLoginNot(dto.getEmail(), login.getIdLogin())) {
                throw new IllegalArgumentException("El email ya esta registrado");
            }
            login.setEmail(dto.getEmail());
        }

        if (dto.getUsuario() != null && !dto.getUsuario().isBlank()) {
            if (loginRepository.existsByUsuarioIgnoreCaseAndIdLoginNot(dto.getUsuario(), login.getIdLogin())) {
                throw new IllegalArgumentException("El usuario ya esta registrado");
            }
            login.setUsuario(dto.getUsuario());
        }

        if (dto.getPassword() != null && !dto.getPassword().trim().equals("")) {
            login.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        // cuardar login
        loginRepository.save(login);

        usuario.setLogin(login);
        return usuarioMapper.mapToPerfilDTO(usuario);
    }


    @Override
    @Transactional
    public void eliminarUsuario(Long id) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        loginRepository.findByUsuarioEntidad_IdUsuarios(id)
                .ifPresent(loginRepository::delete);

        usuarioRepository.delete(usuario);
    }
}
