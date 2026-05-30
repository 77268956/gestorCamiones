package com.gestorcamiones.gestorcamiones.entity.Enum;

/**
 * Estados posibles para un lote de carga.
 * Los valores usan guion bajo para coincidir con el enum de PostgreSQL estado_lote_enum.
 */
public enum EstadoLote {
    en_bodega("en_bodega"),
    en_transito("en_transito"),
    entregado("entregado"),
    dañado("dañado"),
    perdido("perdido"),
    devuelto("devuelto"),
    cancelado("cancelado");

    private final String dbValue;

    EstadoLote(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static EstadoLote fromDbValue(String dbValue) {
        for (EstadoLote value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("EstadoLote invalido: " + dbValue);
    }
}
