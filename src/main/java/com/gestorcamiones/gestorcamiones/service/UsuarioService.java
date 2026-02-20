package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario guardar(Usuario usuario) {
        if (usuarioRepository.existsByNombre(usuario.getNombre())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese nombre");
        }
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }

        if (usuario.getRole() == null || usuario.getRole().isBlank()) {
            usuario.setRole("ROLE_USER");
        } else {
            String normalizedRole = usuario.getRole().toUpperCase();
            if (!normalizedRole.startsWith("ROLE_")) {
                normalizedRole = "ROLE_" + normalizedRole;
            }
            if (!normalizedRole.equals("ROLE_USER") && !normalizedRole.equals("ROLE_ADMIN")) {
                throw new IllegalArgumentException("Rol invalido. Usa ROLE_USER o ROLE_ADMIN");
            }
            usuario.setRole(normalizedRole);
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        usuario.setEnabled(true);
        return usuarioRepository.save(usuario);
    }

    public List<Usuario> listar() {
        return usuarioRepository.findAll();
    }

    @Override
    public UserDetails loadUserByUsername(String input) throws UsernameNotFoundException {

        Usuario user;

        if (input.contains("@")) {
            // Es un email
            user = usuarioRepository.findByEmail(input)
                    .orElseThrow(() -> new UsernameNotFoundException("Email no encontrado: " + input));
        } else {
            // Es un username
            user = usuarioRepository.findByNombre(input)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + input));
        }
        return new CustomUserDetails(user);
    }

}

