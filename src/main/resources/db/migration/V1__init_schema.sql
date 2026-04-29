-- Baseline schema (v1) - generado a partir de BaseDeDatos/bdd_gestor_camiones_mp.sql
--
-- Flyway ejecuta este script SOLO en bases vacias.

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE estado_cuenta_enum AS ENUM ('habilitado', 'bloqueado');
CREATE TYPE estado_empleado_enum AS ENUM ('activo', 'suspendido', 'baja');
CREATE TYPE estado_camion_enum AS ENUM ('activo', 'inactivo', 'taller', 'vendido');
CREATE TYPE tipo_tramo_enum AS ENUM ('ida', 'vuelta');
CREATE TYPE estado_viaje_enum AS ENUM ('cargando', 'en camino', 'descargando', 'con fallas', 'cancelado', 'completado');
CREATE TYPE auditoria_accion AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- =============================================
-- TABLAS
-- =============================================

CREATE TABLE "rol"
(
    "id_rol"      SERIAL PRIMARY KEY,
    "rol"         varchar NOT NULL,
    "descripcion" text,
    "created_at"  timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"  timestamp DEFAULT NULL
);

CREATE TABLE "camion"
(
    "id_camion"  SERIAL PRIMARY KEY,
    "placa"      varchar UNIQUE     NOT NULL,
    "nombre"     varchar,
    "codigo"     varchar UNIQUE,
    "modelo"     varchar NULL,
    "foto_url"   varchar,
    "comentario" varchar,
    "estado"     estado_camion_enum NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" timestamp DEFAULT NULL
);

CREATE TABLE "usuarios"
(
    "id_usuarios"     SERIAL PRIMARY KEY,
    "nombre"          varchar,
    "apellido"        varchar,
    "estado_empleado" estado_empleado_enum NOT NULL,
    "telefono"        varchar(15),
    "dui"             varchar UNIQUE,
    "foto_url"        varchar,
    "id_rol"          integer              NOT NULL,
    "id_camion"       integer,
    "created_at"      timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"      timestamp DEFAULT NULL
);

CREATE TABLE "login"
(
    "id_login"        SERIAL PRIMARY KEY,
    "usuario"         varchar UNIQUE,
    "email"           varchar UNIQUE,
    "password"        varchar(255),
    "estado_cuenta"   estado_cuenta_enum NOT NULL,
    "id_usuario"      integer UNIQUE     NOT NULL,
    intentos_fallidos INTEGER            NOT NULL DEFAULT 0,
    bloqueo_hasta     TIMESTAMP,
    "created_at"      timestamp                   DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      timestamp                   DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"      timestamp                   DEFAULT NULL
);

CREATE TABLE "clientes"
(
    "id_cliente" SERIAL PRIMARY KEY,
    "nombre"     varchar NOT NULL,
    "telefono"   varchar(15),
    "direccion"  text,
    "dui_nit"    varchar UNIQUE,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" timestamp DEFAULT NULL
);

CREATE TABLE "tipo_gasto"
(
    "id_tipo_gasto" SERIAL PRIMARY KEY,
    "tipo_gasto"    varchar,
    "created_at"    timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"    timestamp DEFAULT NULL
);

CREATE TABLE "gastos_generales"
(
    "id_gastos_generales" SERIAL PRIMARY KEY,
    "monto"               decimal(12, 2),
    "descripcion"         text,
    "fecha_gasto"         date,
    "evidencia_url"       varchar,
    "id_tipo_gasto"       integer NOT NULL,
    "id_admin"            integer NOT NULL,
    "created_at"          timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"          timestamp DEFAULT NULL
);

CREATE TABLE "viaje"
(
    "id_viaje"     SERIAL PRIMARY KEY,
    "nombre_viaje" varchar,
    "id_admin"     integer NOT NULL,
    "id_cliente"   integer NOT NULL,
    "created_at"   timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"   timestamp DEFAULT NULL
);

CREATE TABLE "viaje_detalle"
(
    "id_viaje_detalle" SERIAL PRIMARY KEY,
    "id_viaje"         integer           NOT NULL,
    "tipo_tramo"       tipo_tramo_enum   NOT NULL,
    "estado"           estado_viaje_enum NOT NULL,
    "pagado"           boolean   DEFAULT false,
    "iva"              boolean   DEFAULT false,
    "precioViaje"      decimal(12, 2)    NOT NULL,
    "fecha_salida"     timestamp,
    "fecha_llegada"    timestamp,
    "id_camion"        integer,
    "id_chofer"        integer,
    "created_at"       timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"       timestamp DEFAULT NULL
);

CREATE TABLE "gastos_viaje"
(
    "id_gasto_viaje"   SERIAL PRIMARY KEY,
    "id_viaje_detalle" integer        NOT NULL,
    "id_tipo_gasto"    integer        NOT NULL,
    "monto"            decimal(12, 2) NOT NULL,
    "descripcion"      text,
    "evidencia_url"    varchar,
    "fecha_gasto"      date,
    "id_admin"         integer,
    "created_at"       timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       timestamp DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"       timestamp DEFAULT NULL
);

-- =============================================
-- TABLAS DE AUDITORIA
-- =============================================

CREATE TABLE auditoria_sesion
(
    id          SERIAL PRIMARY KEY,
    id_usuario  INTEGER     NOT NULL,
    fecha       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_sesion VARCHAR(20) NOT NULL
);

CREATE TABLE auditoria_login_fallido
(
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255),
    fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip         VARCHAR(45),
    user_agent TEXT,
    motivo     VARCHAR(100)
);

CREATE TABLE auditoria_detallada
(
    id             SERIAL PRIMARY KEY,
    tabla          VARCHAR(50)      NOT NULL,
    id_registro    INTEGER          NOT NULL,
    accion         auditoria_accion NOT NULL,
    usuario_id     INTEGER          NOT NULL,
    usuario_nombre VARCHAR,
    fecha          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip             VARCHAR(45),
    user_agent     TEXT,
    datos_antes    JSONB,
    datos_despues  JSONB
);

-- =============================================
-- FOREIGN KEYS
-- =============================================

ALTER TABLE "login"
    ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuarios");

ALTER TABLE "usuarios"
    ADD FOREIGN KEY ("id_rol") REFERENCES "rol" ("id_rol");
ALTER TABLE "usuarios"
    ADD FOREIGN KEY ("id_camion") REFERENCES "camion" ("id_camion");

ALTER TABLE "gastos_generales"
    ADD FOREIGN KEY ("id_admin") REFERENCES "usuarios" ("id_usuarios");
ALTER TABLE "gastos_generales"
    ADD FOREIGN KEY ("id_tipo_gasto") REFERENCES "tipo_gasto" ("id_tipo_gasto");

ALTER TABLE "viaje"
    ADD FOREIGN KEY ("id_admin") REFERENCES "usuarios" ("id_usuarios");
ALTER TABLE "viaje"
    ADD FOREIGN KEY ("id_cliente") REFERENCES "clientes" ("id_cliente");

ALTER TABLE "viaje_detalle"
    ADD FOREIGN KEY ("id_viaje") REFERENCES "viaje" ("id_viaje");
ALTER TABLE "viaje_detalle"
    ADD FOREIGN KEY ("id_camion") REFERENCES "camion" ("id_camion");
ALTER TABLE "viaje_detalle"
    ADD FOREIGN KEY ("id_chofer") REFERENCES "usuarios" ("id_usuarios");

ALTER TABLE "gastos_viaje"
    ADD FOREIGN KEY ("id_viaje_detalle") REFERENCES "viaje_detalle" ("id_viaje_detalle");
ALTER TABLE "gastos_viaje"
    ADD FOREIGN KEY ("id_tipo_gasto") REFERENCES "tipo_gasto" ("id_tipo_gasto");

-- =============================================
-- INDICES
-- =============================================

-- usuarios
CREATE INDEX idx_usuarios_id_rol ON "usuarios" ("id_rol");
CREATE INDEX idx_usuarios_id_camion ON "usuarios" ("id_camion");

-- login
CREATE INDEX idx_login_id_usuario ON "login" ("id_usuario");

-- viaje
CREATE INDEX idx_viaje_id_admin ON "viaje" ("id_admin");
CREATE INDEX idx_viaje_id_cliente ON "viaje" ("id_cliente");

-- viaje_detalle
CREATE INDEX idx_viaje_detalle_id_viaje ON "viaje_detalle" ("id_viaje");
CREATE INDEX idx_viaje_detalle_id_camion ON "viaje_detalle" ("id_camion");
CREATE INDEX idx_viaje_detalle_id_chofer ON "viaje_detalle" ("id_chofer");
CREATE INDEX idx_viaje_detalle_estado ON "viaje_detalle" ("estado");
CREATE INDEX idx_viaje_detalle_fecha_salida ON "viaje_detalle" ("fecha_salida");

-- gastos_viaje
CREATE INDEX idx_gastos_viaje_id_viaje_detalle ON "gastos_viaje" ("id_viaje_detalle");
CREATE INDEX idx_gastos_viaje_id_tipo_gasto ON "gastos_viaje" ("id_tipo_gasto");
CREATE INDEX idx_gastos_viaje_fecha ON "gastos_viaje" ("fecha_gasto");

-- Soft delete indexes
CREATE INDEX idx_camion_activo ON "camion" ("id_camion") WHERE deleted_at IS NULL;
CREATE INDEX idx_usuarios_activo ON "usuarios" ("id_usuarios") WHERE deleted_at IS NULL;
CREATE INDEX idx_login_activo ON "login" ("id_login") WHERE deleted_at IS NULL;
CREATE INDEX idx_clientes_activo ON "clientes" ("id_cliente") WHERE deleted_at IS NULL;
CREATE INDEX idx_tipo_gasto_activo ON "tipo_gasto" ("id_tipo_gasto") WHERE deleted_at IS NULL;
CREATE INDEX idx_gastos_generales_activo ON "gastos_generales" ("id_gastos_generales") WHERE deleted_at IS NULL;
CREATE INDEX idx_viaje_activo ON "viaje" ("id_viaje") WHERE deleted_at IS NULL;
CREATE INDEX idx_viaje_detalle_activo ON "viaje_detalle" ("id_viaje_detalle") WHERE deleted_at IS NULL;
CREATE INDEX idx_gastos_viaje_activo ON "gastos_viaje" ("id_gasto_viaje") WHERE deleted_at IS NULL;

CREATE INDEX idx_auditoria_tabla ON auditoria_detallada(tabla);
CREATE INDEX idx_auditoria_usuario ON auditoria_detallada(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_detallada(fecha);
CREATE INDEX idx_auditoria_registro ON auditoria_detallada(tabla, id_registro);

-- =============================================
-- FUNCION updated_at
-- =============================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- =============================================
-- FUNCIONES SOFT DELETE EN CASCADA
-- =============================================

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

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS updated_at
-- =============================================

CREATE TRIGGER trigger_login
    BEFORE UPDATE
    ON "login"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_usuarios
    BEFORE UPDATE
    ON "usuarios"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_rol
    BEFORE UPDATE
    ON "rol"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_camion
    BEFORE UPDATE
    ON "camion"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_clientes
    BEFORE UPDATE
    ON "clientes"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_tipo_gasto
    BEFORE UPDATE
    ON "tipo_gasto"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_gastos_generales
    BEFORE UPDATE
    ON "gastos_generales"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_viaje
    BEFORE UPDATE
    ON "viaje"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_viaje_detalle
    BEFORE UPDATE
    ON "viaje_detalle"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_gastos_viaje
    BEFORE UPDATE
    ON "gastos_viaje"
    FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- =============================================
-- TRIGGERS SOFT DELETE EN CASCADA
-- =============================================

CREATE TRIGGER trigger_soft_delete_viaje
    AFTER UPDATE OF deleted_at
    ON "viaje"
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_viaje();

CREATE TRIGGER trigger_soft_delete_viaje_detalle
    AFTER UPDATE OF deleted_at
    ON "viaje_detalle"
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_viaje_detalle();

