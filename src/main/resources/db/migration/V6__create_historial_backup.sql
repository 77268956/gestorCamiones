create table if not exists historial_backup (
    id bigserial primary key,
    backup_id bigint null,
    accion varchar(40) not null,
    origen varchar(30) not null,
    detalle varchar(500),
    creado_en timestamp not null
);
