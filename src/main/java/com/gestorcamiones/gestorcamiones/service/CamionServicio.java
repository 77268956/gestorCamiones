package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCamion;
import org.springframework.stereotype.Service;

@Service
public class CamionServicio {

    public CamionServicio() {
    }

    public EstadoCamion[] listarEstados() {
        return EstadoCamion.values();
    }

}
