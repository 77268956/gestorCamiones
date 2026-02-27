package com.gestorcamiones.gestorcamiones.entity.converter;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoViaje;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class EstadoViajeConverter implements AttributeConverter<EstadoViaje, String> {

    @Override
    public String convertToDatabaseColumn(EstadoViaje attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public EstadoViaje convertToEntityAttribute(String dbData) {
        return dbData == null ? null : EstadoViaje.fromDbValue(dbData);
    }
}
