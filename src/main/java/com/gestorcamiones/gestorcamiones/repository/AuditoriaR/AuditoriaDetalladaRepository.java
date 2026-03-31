package com.gestorcamiones.gestorcamiones.repository.AuditoriaR;

import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaDetallada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditoriaDetalladaRepository extends JpaRepository<AuditoriaDetallada, Long>, JpaSpecificationExecutor<AuditoriaDetallada> {
}
