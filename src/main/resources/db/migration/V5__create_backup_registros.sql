create table if not exists backup_registros (
    id bigserial primary key,
    archivo_original varchar(255) not null,
    archivo_cifrado varchar(255) not null,
    ruta_interna varchar(255) not null,
    ruta_externa varchar(255) not null,
    ruta_nube varchar(255),
    origen varchar(30) not null,
    estado varchar(30) not null,
    detalle varchar(500),
    creado_en timestamp not null,
    restaurado_en timestamp null
);
