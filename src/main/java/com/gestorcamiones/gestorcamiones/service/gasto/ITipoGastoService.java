package com.gestorcamiones.gestorcamiones.service.gasto;

import com.gestorcamiones.gestorcamiones.dto.gasto.TiposgastosDTO;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ITipoGastoService {

    List<TiposgastosDTO> listaTiposGastos();
    Page<TiposgastosDTO> listaTiposGastosFiltros();

    TiposgastosDTO agregarTipoGasto(TiposgastosDTO dto, Usuario usuario);
    TiposgastosDTO actualizarTipoGasto(long id, TiposgastosDTO dto, Usuario usuario);
    void eliminarTipoGasto(long id, Usuario usuario);
}
