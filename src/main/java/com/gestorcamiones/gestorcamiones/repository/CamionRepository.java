package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Camion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface CamionRepository  extends JpaRepository<Camion, Long> {

    boolean existsByPlaca(String placa);
    boolean existsByCodigo(String codigo);
    boolean existsByPlacaAndIdCamionNot(String placa, Long idCamion);
    boolean existsByCodigoAndIdCamionNot(String codigo, Long idCamion);


    @Query(
            value = """
                SELECT c.*
                FROM camion c
                WHERE c.deleted_at IS NULL
                  AND (:texto IS NULL
                       OR CAST(c.nombre AS TEXT) ILIKE CONCAT('%', :texto, '%')
                       OR CAST(c.modelo AS TEXT) ILIKE CONCAT('%', :texto, '%')
                       OR CAST(c.placa AS TEXT) ILIKE CONCAT('%', :texto, '%'))
                  AND (:estado IS NULL OR c.estado = :estado)
                ORDER BY c.id_camion DESC
                """,
            nativeQuery = true
    )
    List<Camion> buscarFiltrados(@Param("texto") String texto,
                                     @Param("estado") String estado);

    @Query(
            value = """
        SELECT EXISTS (
            SELECT 1
            FROM viaje_detalle
            WHERE id_camion = :idCamion
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
    boolean camionNoDisponible(
            @Param("idCamion") long idCamion,
            @Param("fechaSalida") LocalDateTime fechaSalida,
            @Param("fechaLlegada") LocalDateTime fechaLlegada
    );
}
