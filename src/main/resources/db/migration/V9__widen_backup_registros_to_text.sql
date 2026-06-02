-- Ampliar campos que pueden contener rutas absolutas largas o mensajes de error extensos
alter table if exists backup_registros
    alter column archivo_original type text;

alter table if exists backup_registros
    alter column archivo_cifrado type text;

alter table if exists backup_registros
    alter column ruta_interna type text;

alter table if exists backup_registros
    alter column ruta_externa type text;

alter table if exists backup_registros
    alter column ruta_nube type text;

alter table if exists backup_registros
    alter column detalle type text;

alter table if exists backup_registros
    alter column drive_web_view_link type text;
