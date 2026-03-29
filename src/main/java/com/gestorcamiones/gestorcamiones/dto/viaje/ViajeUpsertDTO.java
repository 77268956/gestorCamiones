package com.gestorcamiones.gestorcamiones.dto.viaje;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gestorcamiones.gestorcamiones.dto.tramo.TramoDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ViajeUpsertDTO {

    @JsonProperty("id_vieje")
    private long idViaje;
    private String nombreViaje;
    private long idCliente;

    private List<TramoDTO> tramos;
}
