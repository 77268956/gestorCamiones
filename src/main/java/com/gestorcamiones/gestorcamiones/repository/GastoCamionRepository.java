package com.gestorcamiones.gestorcamiones.repository;

import com.gestorcamiones.gestorcamiones.entity.GastoCamion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GastoCamionRepository extends JpaRepository<GastoCamion, Long> {
    List<GastoCamion> findByCamion_IdCamionOrderByFechaGastoDescIdGastoCamionDesc(Long idCamion);
}
