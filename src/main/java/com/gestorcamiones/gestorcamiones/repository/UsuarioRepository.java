package com.gestorcamiones.gestorcamiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.gestorcamiones.gestorcamiones.entity.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombre(String nombre);
    Optional<Usuario> findByEmail(String email);
    boolean existsByNombre(String nombre);
    boolean existsByEmail(String email);

}

