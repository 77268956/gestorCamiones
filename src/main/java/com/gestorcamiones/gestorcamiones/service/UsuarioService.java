package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.entity.EstadoCuenta;
import com.gestorcamiones.gestorcamiones.entity.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Rol;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import com.gestorcamiones.gestorcamiones.repository.RolRepository;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final LoginRepository loginRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            LoginRepository loginRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.loginRepository = loginRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario crearConLogin(String nombre, String email, String password, String role) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El correo es obligatorio");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("La contrasena es obligatoria");
        }
        String emailNormalizado = email.trim().toLowerCase();
        if (usuarioRepository.existsByNombre(nombre)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese nombre");
        }
        if (loginRepository.findByEmail(emailNormalizado).isPresent()) {
            throw new IllegalArgumentException("Ya existe un login con ese correo");
        }

        String normalizedRole = normalizeRole(role);
        Rol rolEntidad = rolRepository.findByRol(normalizedRole)
                .orElseThrow(() -> new IllegalArgumentException("No existe el rol en base de datos: " + normalizedRole));

        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEstadoEmpleado(EstadoEmpleado.activo);
        usuario.setRol(rolEntidad);
        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        Login login = new Login();
        login.setUsuario(nombre);
        login.setEmail(emailNormalizado);
        login.setPassword(passwordEncoder.encode(password));
        login.setEstadoCuenta(EstadoCuenta.habilitado);
        login.setUsuarioEntidad(usuarioGuardado);
        loginRepository.save(login);

        return usuarioGuardado;
    }

    public List<Usuario> listar() {
        return usuarioRepository.findAll();
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "ROLE_USER";
        }
        String normalizedRole = role.trim().toUpperCase();
        if (!normalizedRole.startsWith("ROLE_")) {
            normalizedRole = "ROLE_" + normalizedRole;
        }
        if (!normalizedRole.equals("ROLE_USER") && !normalizedRole.equals("ROLE_ADMIN")) {
            throw new IllegalArgumentException("Rol invalido. Usa ROLE_USER o ROLE_ADMIN");
        }
        return normalizedRole;
    }
}
