package com.gestorcamiones.gestorcamiones.service.Interface;

import com.gestorcamiones.gestorcamiones.dto.AuditoriaLoginPageDTO;

import java.time.LocalDateTime;

public interface IAuditoriaService {


    AuditoriaLoginPageDTO obtenerAuditoriaLogin(
            LocalDateTime desde,
            LocalDateTime hasta,
            String tipoEvento,
            String resultado,
            String q,
            int page,
            int size
    );
}
