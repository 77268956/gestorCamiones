package com.gestorcamiones.gestorcamiones.entity.Enum;

/**
 * Tipos de incidencia sobre un lote.
 * Los valores usan guion bajo para coincidir con el enum de PostgreSQL tipo_incidencia_enum.
 */
public enum TipoIncidencia {
    daño_parcial("daño_parcial"),
    daño_total("daño_total"),
    robo("robo"),
    perdida("perdida"),
    demora("demora"),
    otro("otro");

    private final String dbValue;

    TipoIncidencia(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static TipoIncidencia fromDbValue(String dbValue) {
        for (TipoIncidencia value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("TipoIncidencia invalido: " + dbValue);
    }
}
