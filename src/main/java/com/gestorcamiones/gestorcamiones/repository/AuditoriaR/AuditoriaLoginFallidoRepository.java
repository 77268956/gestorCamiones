package com.gestorcamiones.gestorcamiones.repository.AuditoriaR;

import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaLoginFallido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditoriaLoginFallidoRepository
        extends JpaRepository<AuditoriaLoginFallido, Long> {
}