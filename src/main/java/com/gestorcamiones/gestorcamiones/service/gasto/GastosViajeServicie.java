package com.gestorcamiones.gestorcamiones.service.gasto;

import com.gestorcamiones.gestorcamiones.entity.GastoViaje;
import com.gestorcamiones.gestorcamiones.repository.GastosViajeRepository;
import org.springframework.stereotype.Service;

@Service
public class GastosViajeServicie implements IGastosViaje {
    private final GastosViajeRepository gastosViajeRepository;

    public GastosViajeServicie(GastosViajeRepository gastosViajeRepository) {
        this.gastosViajeRepository = gastosViajeRepository;
    }

    @Override
    public void guardarGasto(GastoViaje gasto) {
        gastosViajeRepository.save(gasto);
    }
}
