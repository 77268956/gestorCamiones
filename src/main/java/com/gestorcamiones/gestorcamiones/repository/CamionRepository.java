package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Camion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CamionRepository  extends JpaRepository<Camion, Long> {

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
}
