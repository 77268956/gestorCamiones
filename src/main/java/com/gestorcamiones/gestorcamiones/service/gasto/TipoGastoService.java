package com.gestorcamiones.gestorcamiones.service.gasto;

import com.gestorcamiones.gestorcamiones.dto.gasto.TiposgastosDTO;
import com.gestorcamiones.gestorcamiones.entity.TipoGasto;
import com.gestorcamiones.gestorcamiones.mapper.TipoGastoMapper;
import com.gestorcamiones.gestorcamiones.repository.TipoGastoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TipoGastoService implements  ITipoGastoService{
    private final TipoGastoRepository tipoGastoRepository;
    private final TipoGastoMapper tipoGastoMapper;

    public TipoGastoService(TipoGastoRepository tipoGastoRepository, TipoGastoMapper tipoGastoMapper) {
        this.tipoGastoRepository = tipoGastoRepository;
        this.tipoGastoMapper = tipoGastoMapper;
    }

    @Override
    public List<TiposgastosDTO> listaTiposGastos() {
        return tipoGastoMapper.toDTO(tipoGastoRepository.findAll());
    }
}
