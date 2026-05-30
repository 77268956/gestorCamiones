package com.gestorcamiones.gestorcamiones.entity.converter;

import com.gestorcamiones.gestorcamiones.entity.Enum.Pais;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class PaisConverter implements AttributeConverter<Pais, String> {

    @Override
    public String convertToDatabaseColumn(Pais attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public Pais convertToEntityAttribute(String dbData) {
        return dbData == null ? null : Pais.fromDbValue(dbData);
    }
}
