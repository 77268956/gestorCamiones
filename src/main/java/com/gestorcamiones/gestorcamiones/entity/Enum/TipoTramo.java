package com.gestorcamiones.gestorcamiones.entity.Enum;

public enum TipoTramo {
    ida("ida"),
    vuelta("vuelta");

    private final String dbValue;

    TipoTramo(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static TipoTramo fromDbValue(String dbValue) {
        for (TipoTramo value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("TipoTramo invalido: " + dbValue);
    }
}
