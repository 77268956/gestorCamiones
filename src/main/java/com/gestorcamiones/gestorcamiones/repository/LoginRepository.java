package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Login;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LoginRepository extends JpaRepository<Login, Long> {

    Optional<Login> findByEmail(String email);
    Optional<Login> findByUsuario(String usuario);
    Optional<Login> findByUsuarioEntidad_IdUsuarios(Long idUsuarios);

    boolean existsByUsuarioAndEmail(String usuario, String email);
    boolean existsByEmailIgnoreCaseAndIdLoginNot(String email, Long idLogin);
    boolean existsByUsuarioIgnoreCaseAndIdLoginNot(String usuario, Long idLogin);

    @Query("""
            select l
            from Login l
            left join fetch l.usuarioEntidad u
            left join fetch u.rol
            where lower(l.email) = lower(:email)
            """)
    Optional<Login> findAuthByEmail(@Param("email") String email);
}
