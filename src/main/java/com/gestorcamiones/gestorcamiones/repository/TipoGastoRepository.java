package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Camion;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TipoGastoRepository extends JpaRepository<TipoGasto, Long> {


    @Query(
            value = """
                    select tg.*
                    from tipo_gasto tg
                    where (:texto IS NULL
                        OR CAST(tg.tipo_gasto AS TEXT) ILIKE concat('%', :texto, '%'))
                    ORDER BY tg.id_tipo_gasto DESC;
                    
                    """,
            nativeQuery = true
    )
    List<TipoGasto> buscarFiltrados(@Param("texto") String texto);


}
