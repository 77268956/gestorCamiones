-- V10: Asegurar valor por defecto para el tramo en la relacion viaje_lote
ALTER TABLE IF EXISTS "viaje_lote"
    ALTER COLUMN "tipo_tramo" SET DEFAULT 'ida';
