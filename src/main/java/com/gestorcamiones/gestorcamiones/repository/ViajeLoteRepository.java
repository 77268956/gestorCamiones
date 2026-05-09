package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.ViajeLote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ViajeLoteRepository extends JpaRepository<ViajeLote, Long> {

    List<ViajeLote> findByViaje_IdViaje(Long idViaje);

    void deleteByViaje_IdViaje(Long idViaje);
}
