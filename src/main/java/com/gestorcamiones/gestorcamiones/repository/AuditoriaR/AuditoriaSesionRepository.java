package com.gestorcamiones.gestorcamiones.repository.AuditoriaR;

import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaSesion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditoriaSesionRepository
        extends JpaRepository<AuditoriaSesion, Long> {
}
