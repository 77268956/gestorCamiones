package com.gestorcamiones.gestorcamiones.entity.converter;

import com.gestorcamiones.gestorcamiones.entity.Enum.TipoIncidencia;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class TipoIncidenciaConverter implements AttributeConverter<TipoIncidencia, String> {

    @Override
    public String convertToDatabaseColumn(TipoIncidencia attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public TipoIncidencia convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TipoIncidencia.fromDbValue(dbData);
    }
}
