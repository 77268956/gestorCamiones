package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.CategoriaIngresoExtra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoriaIngresoExtraRepository extends JpaRepository<CategoriaIngresoExtra, Long> {

    @Query(
            value = """
                    select cie.*
                    from categoria_ingreso_extra cie
                    where (CAST(:texto AS TEXT) IS NULL
                        OR CAST(cie.nombre AS TEXT) ILIKE concat('%', CAST(:texto AS TEXT), '%'))
                    ORDER BY cie.id_categoria_ingreso_extra DESC;
                    """,
            nativeQuery = true
    )
    List<CategoriaIngresoExtra> buscarFiltrados(@Param("texto") String texto);
}
