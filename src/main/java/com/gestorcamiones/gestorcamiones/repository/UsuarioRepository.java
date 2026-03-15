package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombre(String nombre);

    boolean existsByNombreAndApellido(String nombre, String apellido);
    boolean existsByNombreAndApellidoAndIdUsuariosNot(String nombre, String apellido, Long idUsuarios);

    boolean existsByRol(String rol);
    boolean existsByEstadoEmpleado(EstadoEmpleado estadoEmpleado);

    boolean existsByNombre(String nombre);

    @EntityGraph(attributePaths = {"rol", "login"})
    @Query("""
            select u
            from Usuario u
            left join u.login l
            where (:texto is null
                   or lower(u.nombre) like lower(concat('%', :texto, '%'))
                   or lower(u.apellido) like lower(concat('%', :texto, '%'))
                   or lower(u.telefono) like lower(concat('%', :texto, '%'))
                   or lower(u.dui) like lower(concat('%', :texto, '%'))
                   or lower(l.email) like lower(concat('%', :texto, '%')))
              and (:estado is null or u.estadoEmpleado = :estado)
            """)
    Page<Usuario> buscarFiltrados(@Param("texto") String texto,
                                  @Param("estado") EstadoEmpleado estado,
                                  Pageable pageable);
}

