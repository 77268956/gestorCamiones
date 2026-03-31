package com.gestorcamiones.gestorcamiones.service.auditoria;

import com.fasterxml.jackson.databind.JsonNode;
import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaDetallada;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public interface IAuditoriaDetalladaService {

    void registrar(
            String tabla,
            Long usuarioId,
            AccionAuditoria accion,
            String nombre,
            JsonNode datosAntes,
            JsonNode datosDespues,
            Long idRegistro
    );

    Page<AuditoriaDetallada> obtenerAuditoriaDetallada(
            LocalDateTime desde,
            LocalDateTime hasta,
            String tabla,
            String accion,
            String q,
            int page,
            int size
    );

    List<AuditoriaDetallada> lsitaAuditoria();
}
