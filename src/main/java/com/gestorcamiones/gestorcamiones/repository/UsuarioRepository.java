package com.gestorcamiones.gestorcamiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
}
