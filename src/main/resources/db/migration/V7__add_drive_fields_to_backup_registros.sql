alter table if exists backup_registros
    add column if not exists drive_file_id varchar(255);

alter table if exists backup_registros
    add column if not exists drive_web_view_link varchar(500);

alter table if exists backup_registros
    add column if not exists drive_estado varchar(30);
