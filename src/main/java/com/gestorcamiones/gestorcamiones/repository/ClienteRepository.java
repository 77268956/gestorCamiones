package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    boolean existsByDuiNit(String duiNit);
    boolean existsByDuiNitAndIdNot(String duiNit, Long id);

    @Query(
            value = """
                SELECT c.*
                FROM clientes c
                WHERE c.deleted_at IS NULL
                  AND (:texto IS NULL
                       OR CAST(c.nombre AS TEXT) ILIKE CONCAT('%', :texto, '%')
                       OR CAST(c.telefono AS TEXT) ILIKE CONCAT('%', :texto, '%')
                       OR CAST(c.dui_nit AS TEXT) ILIKE CONCAT('%', :texto, '%'))
                ORDER BY c.id_cliente DESC
                """,
            countQuery = """
                SELECT COUNT(*)
                FROM clientes c
                WHERE c.deleted_at IS NULL
                  AND (:texto IS NULL
                       OR CAST(c.nombre AS TEXT) ILIKE CONCAT('%', :texto, '%')
                       OR CAST(c.telefono AS TEXT) ILIKE CONCAT('%', :texto, '%')
                       OR CAST(c.dui_nit AS TEXT) ILIKE CONCAT('%', :texto, '%'))
                """,
            nativeQuery = true
    )
    Page<Cliente> buscarFiltrados(@Param("texto") String texto, Pageable pageable);
}
