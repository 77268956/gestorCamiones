package com.gestorcamiones.gestorcamiones.entity.Enum;

/**
 * Paises de la region centroamericana y Mexico.
 * Los valores contienen espacios para coincidir con el enum de PostgreSQL paises_enum.
 */
public enum Pais {
    El_Salvador("El Salvador"),
    Guatemala("Guatemala"),
    Honduras("Honduras"),
    Nicaragua("Nicaragua"),
    Costa_Rica("Costa Rica"),
    Panama("Panama"),
    Mexico("Mexico");

    private final String dbValue;

    Pais(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static Pais fromDbValue(String dbValue) {
        for (Pais value : values()) {
            if (value.dbValue.equals(dbValue)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Pais invalido: " + dbValue);
    }
}
