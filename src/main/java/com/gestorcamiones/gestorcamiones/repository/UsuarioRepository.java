package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombre(String nombre);

    boolean existsByNombreAndApellido(String nombre, String apellido);
    boolean existsByNombreAndApellidoAndIdUsuariosNot(String nombre, String apellido, Long idUsuarios);

    boolean existsByRol_Rol(String rol);
    boolean existsByEstadoEmpleado(EstadoEmpleado estadoEmpleado);

    boolean existsByNombre(String nombre);

    // V2: el usuario ya no tiene relacion con camion. Solo cargamos rol y login.
    // @EntityGraph(attributePaths = {"rol", "login"})
    @Query(value = """
            SELECT DISTINCT u.*
            FROM usuarios u
            LEFT JOIN login l ON l.id_usuario = u.id_usuarios
            WHERE u.deleted_at IS NULL
              AND (CAST(:texto AS TEXT) IS NULL
                   OR LOWER(u.nombre) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(u.apellido) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(u.telefono) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(u.dui) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(l.email) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%')))
              AND (CAST(:estado AS TEXT) IS NULL OR CAST(u.estado_empleado AS TEXT) = CAST(:estado AS TEXT))
            ORDER BY u.id_usuarios DESC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT u.id_usuarios)
            FROM usuarios u
            LEFT JOIN login l ON l.id_usuario = u.id_usuarios
            WHERE u.deleted_at IS NULL
              AND (CAST(:texto AS TEXT) IS NULL
                   OR LOWER(u.nombre) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(u.apellido) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(u.telefono) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(u.dui) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%'))
                   OR LOWER(l.email) LIKE LOWER(CONCAT('%', CAST(:texto AS TEXT), '%')))
              AND (CAST(:estado AS TEXT) IS NULL OR CAST(u.estado_empleado AS TEXT) = CAST(:estado AS TEXT))
            """,
            nativeQuery = true)
    Page<Usuario> buscarFiltrados(@Param("texto") String texto,
                                  @Param("estado") Object estado,
                                  Pageable pageable);


    @Query(
            value = """
        SELECT EXISTS (
            SELECT 1
            FROM viaje_detalle
            WHERE id_chofer = :idChofer
              AND deleted_at IS NULL
              AND estado NOT IN ('cancelado', 'completado')
              AND (
                    (:fechaSalida BETWEEN fecha_salida AND COALESCE(fecha_llegada, :fechaSalida))
                 OR (:fechaLlegada BETWEEN fecha_salida AND COALESCE(fecha_llegada, :fechaLlegada))
                 OR (fecha_salida BETWEEN :fechaSalida AND :fechaLlegada)
              )
        )
    """,
            nativeQuery = true
    )
    boolean choferNoDisponible(
            @Param("idChofer") long idChofer,
            @Param("fechaSalida") LocalDateTime fechaSalida,
            @Param("fechaLlegada") LocalDateTime fechaLlegada
    );



    @Query(
            value = """
        SELECT EXISTS (
            SELECT 1
            FROM viaje_detalle
            WHERE id_chofer = :idChofer
              AND id_viaje_detalle <> :idViajeDetalle
              AND deleted_at IS NULL
              AND estado NOT IN ('cancelado', 'completado')
              AND (
                    (:fechaSalida BETWEEN fecha_salida AND COALESCE(fecha_llegada, :fechaSalida))
                 OR (:fechaLlegada BETWEEN fecha_salida AND COALESCE(fecha_llegada, :fechaLlegada))
                 OR (fecha_salida BETWEEN :fechaSalida AND :fechaLlegada)
              )
        )
    """,
            nativeQuery = true
    )
    boolean choferNoDisponibleExcluyendoDetalle(
            @Param("idChofer") long idChofer,
            @Param("fechaSalida") LocalDateTime fechaSalida,
            @Param("fechaLlegada") LocalDateTime fechaLlegada,
            @Param("idViajeDetalle") long idViajeDetalle
    );

}
