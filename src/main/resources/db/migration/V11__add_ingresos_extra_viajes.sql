-- V11: Creación de tablas para registrar ingresos extra (estadías) en los viajes.

-- Creación de la tabla de categorías de ingresos extra
CREATE TABLE IF NOT EXISTS "categoria_ingreso_extra"
(
    "id_categoria_ingreso_extra" SERIAL PRIMARY KEY,
    "nombre"                     varchar UNIQUE NOT NULL,
    "descripcion"                text,
    "created_at"                 timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"                 timestamp DEFAULT NULL
);

-- Creación de la tabla de ingresos extra de viaje
CREATE TABLE IF NOT EXISTS "ingreso_extra_viaje"
(
    "id_ingreso_extra_viaje"     SERIAL PRIMARY KEY,
    "id_viaje_detalle"           integer        NOT NULL,
    "id_categoria_ingreso_extra" integer        NOT NULL,
    "monto"                      decimal(12, 2) NOT NULL,
    "descripcion"                text,
    "fecha_ingreso"              date,
    "created_at"                 timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"                 timestamp DEFAULT NULL
);

-- Foreign keys
ALTER TABLE "ingreso_extra_viaje"
    ADD CONSTRAINT fk_ingreso_extra_viaje_detalle
    FOREIGN KEY ("id_viaje_detalle") REFERENCES "viaje_detalle" ("id_viaje_detalle");

ALTER TABLE "ingreso_extra_viaje"
    ADD CONSTRAINT fk_ingreso_extra_viaje_categoria
    FOREIGN KEY ("id_categoria_ingreso_extra") REFERENCES "categoria_ingreso_extra" ("id_categoria_ingreso_extra");

-- Índices
CREATE INDEX IF NOT EXISTS idx_ingreso_extra_viaje_id_viaje_detalle ON "ingreso_extra_viaje" ("id_viaje_detalle");
CREATE INDEX IF NOT EXISTS idx_ingreso_extra_viaje_id_categoria ON "ingreso_extra_viaje" ("id_categoria_ingreso_extra");
CREATE INDEX IF NOT EXISTS idx_ingreso_extra_viaje_activo ON "ingreso_extra_viaje" ("id_ingreso_extra_viaje") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categoria_ingreso_extra_activo ON "categoria_ingreso_extra" ("id_categoria_ingreso_extra") WHERE deleted_at IS NULL;

-- Trigger updated_at para tablas nuevas
CREATE TRIGGER trigger_categoria_ingreso_extra
    BEFORE UPDATE ON "categoria_ingreso_extra"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_ingreso_extra_viaje
    BEFORE UPDATE ON "ingreso_extra_viaje"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- Actualización de triggers de soft delete
CREATE OR REPLACE FUNCTION soft_delete_viaje()
    RETURNS TRIGGER AS
$$
BEGIN
    UPDATE viaje_detalle
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id_viaje = OLD.id_viaje
      AND deleted_at IS NULL;

    UPDATE gastos_viaje
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id_viaje_detalle IN (SELECT id_viaje_detalle
                               FROM viaje_detalle
                               WHERE id_viaje = OLD.id_viaje)
      AND deleted_at IS NULL;

    UPDATE ingreso_extra_viaje
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id_viaje_detalle IN (SELECT id_viaje_detalle
                               FROM viaje_detalle
                               WHERE id_viaje = OLD.id_viaje)
      AND deleted_at IS NULL;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_viaje_detalle()
    RETURNS TRIGGER AS
$$
BEGIN
    UPDATE gastos_viaje
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id_viaje_detalle = OLD.id_viaje_detalle
      AND deleted_at IS NULL;

    UPDATE ingreso_extra_viaje
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id_viaje_detalle = OLD.id_viaje_detalle
      AND deleted_at IS NULL;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Semilla de datos
INSERT INTO "categoria_ingreso_extra" ("nombre", "descripcion") VALUES 
('Estadía', 'Pago por estadías adicionales del viaje'),
('Daño por retraso', 'Compensación por demoras o retrasos causados por el cliente'),
('Otros ingresos', 'Cualquier otro ingreso adicional no especificado')
ON CONFLICT (nombre) DO NOTHING;
