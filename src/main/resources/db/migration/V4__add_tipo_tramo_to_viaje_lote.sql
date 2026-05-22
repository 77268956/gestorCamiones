-- V4: Agregar columna tipo_tramo a viaje_lote
ALTER TABLE "viaje_lote"
    ADD COLUMN "tipo_tramo" tipo_tramo_enum;
