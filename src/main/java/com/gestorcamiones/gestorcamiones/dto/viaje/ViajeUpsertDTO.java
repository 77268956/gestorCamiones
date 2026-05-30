package com.gestorcamiones.gestorcamiones.dto.viaje;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO base para crear/actualizar viajes (V2).
 * Ya no lleva idCliente. Los lotes se asocian vía loteIds.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ViajeUpsertDTO {

    @JsonProperty("id_vieje")
    private long idViaje;
    private String nombreViaje;

    private List<TramoDTO> tramos;

    // V2: IDs de lotes a asociar con este viaje
    private List<Long> loteIds;
}
