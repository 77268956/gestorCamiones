-- Upgrade schema from v1 -> v2
-- Basado en BaseDeDatos/bdd_gestor_camiones_v2.sql, convertido a "delta" (ALTER/CREATE).

-- =============================================
-- ENUMS (nuevos en v2)
-- =============================================

DO $$ BEGIN
    CREATE TYPE estado_lote_enum AS ENUM (
        'en_bodega',
        'en_transito',
        'entregado',
        'dañado',
        'perdido',
        'devuelto',
        'cancelado'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE paises_enum AS ENUM (
        'El Salvador',
        'Guatemala',
        'Honduras',
        'Nicaragua',
        'Costa Rica',
        'Panama',
        'Mexico'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_incidencia_enum AS ENUM (
        'daño_parcial',
        'daño_total',
        'robo',
        'perdida',
        'demora',
        'otro'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- CAMBIOS EN TABLAS EXISTENTES
-- =============================================

-- camion: nuevo campo
ALTER TABLE "camion"
    ADD COLUMN IF NOT EXISTS "precio_compra" decimal(12, 2);

-- usuarios: nuevo campo correo (y se elimina relacion directa con camion)
ALTER TABLE "usuarios"
    ADD COLUMN IF NOT EXISTS "correo" varchar;

CREATE UNIQUE INDEX IF NOT EXISTS uk_usuarios_correo ON "usuarios" ("correo");

-- Eliminar FK de usuarios(id_camion) si existe (en v1 la FK no tenia nombre fijo)
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT c.conname
    INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'usuarios'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%("id_camion")%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "usuarios" DROP CONSTRAINT %I', constraint_name);
    END IF;
END
$$;

DROP INDEX IF EXISTS idx_usuarios_id_camion;

ALTER TABLE "usuarios"
    DROP COLUMN IF EXISTS "id_camion";

-- login: remover columnas de bloqueo (se mantuvo historial con auditoria_login_fallido)
ALTER TABLE "login"
    DROP COLUMN IF EXISTS intentos_fallidos;

ALTER TABLE "login"
    DROP COLUMN IF EXISTS bloqueo_hasta;

-- clientes: agregar correo
ALTER TABLE "clientes"
    ADD COLUMN IF NOT EXISTS "correo" varchar;

CREATE UNIQUE INDEX IF NOT EXISTS uk_clientes_correo ON "clientes" ("correo");

-- viaje: se elimina id_cliente (la relacion pasa a lotes)
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT c.conname
    INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'viaje'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%("id_cliente")%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "viaje" DROP CONSTRAINT %I', constraint_name);
    END IF;
END
$$;

DROP INDEX IF EXISTS idx_viaje_id_cliente;

ALTER TABLE "viaje"
    DROP COLUMN IF EXISTS "id_cliente";

-- viaje_detalle: nuevas columnas de ubicacion / notas, y precioViaje deja de existir
ALTER TABLE "viaje_detalle"
    ADD COLUMN IF NOT EXISTS "pais_salida" paises_enum;

ALTER TABLE "viaje_detalle"
    ADD COLUMN IF NOT EXISTS "pais_destino" paises_enum;

ALTER TABLE "viaje_detalle"
    ADD COLUMN IF NOT EXISTS "direccion_salida" text;

ALTER TABLE "viaje_detalle"
    ADD COLUMN IF NOT EXISTS "direccion_destino" text;

ALTER TABLE "viaje_detalle"
    ADD COLUMN IF NOT EXISTS "observaciones" text;

ALTER TABLE "viaje_detalle"
    DROP COLUMN IF EXISTS "precioViaje";

-- En v2 id_chofer es NOT NULL. Si hay filas viejas con NULL, se asigna al admin del viaje.
UPDATE "viaje_detalle" vd
SET "id_chofer" = v."id_admin"
FROM "viaje" v
WHERE vd."id_viaje" = v."id_viaje"
  AND vd."id_chofer" IS NULL;

-- Aplicar NOT NULL solo si ya no quedan NULLs (para no romper migracion con data sucia)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "viaje_detalle" WHERE "id_chofer" IS NULL) THEN
        ALTER TABLE "viaje_detalle" ALTER COLUMN "id_chofer" SET NOT NULL;
    END IF;
END
$$;

-- =============================================
-- NUEVAS TABLAS (v2)
-- =============================================

CREATE TABLE IF NOT EXISTS "gasto_camion"
(
    "id_gasto_camion" SERIAL PRIMARY KEY,
    "id_camion"       integer        NOT NULL,
    "id_tipo_gasto"   integer        NOT NULL,
    "monto"           decimal(12, 2) NOT NULL,
    "descripcion"     text,
    "fecha_gasto"     date,
    "evidencia_url"   varchar,
    "id_admin"        integer        NOT NULL,
    "created_at"      timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"      timestamp DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "categoria"
(
    "id_categoria" SERIAL PRIMARY KEY,
    "nombre"       varchar NOT NULL,
    "descripcion"  text,
    "created_at"   timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"   timestamp DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "lote"
(
    "id_lote"                 SERIAL PRIMARY KEY,
    "numero_lote"             varchar UNIQUE,
    "estado"                  estado_lote_enum NOT NULL DEFAULT 'en_bodega',
    "id_categoria"            integer,
    "id_cliente_remitente"    integer NOT NULL,
    "id_cliente_destinatario" integer NOT NULL,
    "nombre_encargado"        varchar,
    "peso"                    decimal(10, 2),
    "descripcion"             text,
    "valor_declarado"         decimal(12, 2),
    "created_at"              timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"              timestamp DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "viaje_lote"
(
    "id_viaje_lote" SERIAL PRIMARY KEY,
    "id_viaje"      integer NOT NULL,
    "id_lote"       integer NOT NULL,
    "created_at"    timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "incidencia_lote"
(
    "id_incidencia"    SERIAL PRIMARY KEY,
    "id_lote"          integer              NOT NULL,
    "id_viaje_detalle" integer              NOT NULL,
    "tipo_incidencia"  tipo_incidencia_enum NOT NULL,
    "descripcion"      text,
    "evidencia_url"    varchar,
    "fecha_incidencia" timestamp            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_reportado_por" integer              NOT NULL,
    "resuelto"         boolean              DEFAULT false,
    "created_at"       timestamp            DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       timestamp            DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"       timestamp            DEFAULT NULL
);

-- =============================================
-- FOREIGN KEYS (nuevas)
-- =============================================

DO $$ BEGIN
    ALTER TABLE "gasto_camion" ADD CONSTRAINT fk_gasto_camion_camion
        FOREIGN KEY ("id_camion") REFERENCES "camion" ("id_camion");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "gasto_camion" ADD CONSTRAINT fk_gasto_camion_tipo
        FOREIGN KEY ("id_tipo_gasto") REFERENCES "tipo_gasto" ("id_tipo_gasto");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "gasto_camion" ADD CONSTRAINT fk_gasto_camion_admin
        FOREIGN KEY ("id_admin") REFERENCES "usuarios" ("id_usuarios");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "lote" ADD CONSTRAINT fk_lote_categoria
        FOREIGN KEY ("id_categoria") REFERENCES "categoria" ("id_categoria");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "lote" ADD CONSTRAINT fk_lote_remitente
        FOREIGN KEY ("id_cliente_remitente") REFERENCES "clientes" ("id_cliente");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "lote" ADD CONSTRAINT fk_lote_destinatario
        FOREIGN KEY ("id_cliente_destinatario") REFERENCES "clientes" ("id_cliente");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "viaje_lote" ADD CONSTRAINT fk_viaje_lote_viaje
        FOREIGN KEY ("id_viaje") REFERENCES "viaje" ("id_viaje");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "viaje_lote" ADD CONSTRAINT fk_viaje_lote_lote
        FOREIGN KEY ("id_lote") REFERENCES "lote" ("id_lote");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "incidencia_lote" ADD CONSTRAINT fk_incidencia_lote
        FOREIGN KEY ("id_lote") REFERENCES "lote" ("id_lote");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "incidencia_lote" ADD CONSTRAINT fk_incidencia_viaje_detalle
        FOREIGN KEY ("id_viaje_detalle") REFERENCES "viaje_detalle" ("id_viaje_detalle");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "incidencia_lote" ADD CONSTRAINT fk_incidencia_reportado_por
        FOREIGN KEY ("id_reportado_por") REFERENCES "usuarios" ("id_usuarios");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- INDICES (nuevos)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_gasto_camion_id_camion     ON "gasto_camion" ("id_camion");
CREATE INDEX IF NOT EXISTS idx_gasto_camion_id_tipo_gasto ON "gasto_camion" ("id_tipo_gasto");
CREATE INDEX IF NOT EXISTS idx_gasto_camion_fecha         ON "gasto_camion" ("fecha_gasto");
CREATE INDEX IF NOT EXISTS idx_gasto_camion_activo        ON "gasto_camion" ("id_gasto_camion") WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categoria_activo           ON "categoria" ("id_categoria") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lote_activo                ON "lote" ("id_lote") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_viaje_lote_id_viaje        ON "viaje_lote" ("id_viaje");
CREATE INDEX IF NOT EXISTS idx_viaje_lote_id_lote         ON "viaje_lote" ("id_lote");
CREATE INDEX IF NOT EXISTS idx_incidencia_lote_activo     ON "incidencia_lote" ("id_incidencia") WHERE deleted_at IS NULL;

-- =============================================
-- TRIGGERS updated_at (para tablas nuevas)
-- =============================================

DROP TRIGGER IF EXISTS trigger_gasto_camion    ON "gasto_camion";
DROP TRIGGER IF EXISTS trigger_categoria       ON "categoria";
DROP TRIGGER IF EXISTS trigger_lote            ON "lote";
DROP TRIGGER IF EXISTS trigger_incidencia_lote ON "incidencia_lote";

CREATE TRIGGER trigger_gasto_camion
    BEFORE UPDATE ON "gasto_camion"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_categoria
    BEFORE UPDATE ON "categoria"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_lote
    BEFORE UPDATE ON "lote"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_incidencia_lote
    BEFORE UPDATE ON "incidencia_lote"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

