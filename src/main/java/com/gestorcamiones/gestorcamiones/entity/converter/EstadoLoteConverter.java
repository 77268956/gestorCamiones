package com.gestorcamiones.gestorcamiones.entity.converter;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoLote;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class EstadoLoteConverter implements AttributeConverter<EstadoLote, String> {

    @Override
    public String convertToDatabaseColumn(EstadoLote attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public EstadoLote convertToEntityAttribute(String dbData) {
        return dbData == null ? null : EstadoLote.fromDbValue(dbData);
    }
}
