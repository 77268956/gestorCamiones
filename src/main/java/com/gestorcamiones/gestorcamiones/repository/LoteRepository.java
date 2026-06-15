package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.Lote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoteRepository extends JpaRepository<Lote, Long> {

    List<Lote> findAllByDeletedAtIsNull();

    List<Lote> findAllByIdLoteInAndDeletedAtIsNull(List<Long> ids);

    Optional<Lote> findByIdLoteAndDeletedAtIsNull(Long idLote);
}
