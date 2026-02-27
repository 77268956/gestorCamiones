package com.gestorcamiones.gestorcamiones.entity.Enum;

public enum EstadoViaje {
    cargando("cargando"),
    en_camino("en camino"),
    descargando("descargando"),
    con_fallas("con fallas"),
    cancelado("cancelado"),
    completado("completado");

    private final String dbValue;

    EstadoViaje(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static EstadoViaje fromDbValue(String dbValue) {
        for (EstadoViaje value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("EstadoViaje invalido: " + dbValue);
    }
}
