package com.gestorcamiones.gestorcamiones.entity.converter;

import com.gestorcamiones.gestorcamiones.entity.Enum.TipoTramo;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class TipoTramoConverter implements AttributeConverter<TipoTramo, String> {

    @Override
    public String convertToDatabaseColumn(TipoTramo attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public TipoTramo convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TipoTramo.fromDbValue(dbData);
    }
}
