package com.gestorcamiones.gestorcamiones.service.backup;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class BackupStorageProperties {

    private final String baseDir;
    private final String externalDir;
    private final String driveDir;
    private final String databaseName;
    private final String databaseUser;
    private final String databasePassword;
    private final String pgDumpPath;
    private final String pgRestorePath;
    private final String encryptionKey;
    private final int retentionDays;

    public BackupStorageProperties(
            @Value("${app.backup.base-dir:backups}") String baseDir,
            @Value("${app.backup.external-dir:C:/GestorCamiones/backups_externos}") String externalDir,
            @Value("${app.backup.drive-dir:C:/GestorCamiones/backups_drive}") String driveDir,
            @Value("${spring.datasource.url}") String databaseUrl,
            @Value("${spring.datasource.username:postgres}") String databaseUser,
            @Value("${spring.datasource.password:}") String databasePassword,
            @Value("${app.backup.pg-dump-path:C:/Program Files/PostgreSQL/18/bin/pg_dump.exe}") String pgDumpPath,
            @Value("${app.backup.pg-restore-path:C:/Program Files/PostgreSQL/18/bin/pg_restore.exe}") String pgRestorePath,
            @Value("${app.backup.encryption-key:GestorCamionesBackupKey-ChangeMe}") String encryptionKey,
            @Value("${app.backup.retention-days:30}") int retentionDays
    ) {
        this.baseDir = baseDir;
        this.externalDir = externalDir;
        this.driveDir = driveDir;
        this.databaseName = extraerNombreBase(databaseUrl);
        this.databaseUser = databaseUser;
        this.databasePassword = databasePassword;
        this.pgDumpPath = pgDumpPath;
        this.pgRestorePath = pgRestorePath;
        this.encryptionKey = encryptionKey;
        this.retentionDays = retentionDays;
    }

    private String extraerNombreBase(String databaseUrl) {
        String sinParametros = databaseUrl.split("\\?")[0];
        return sinParametros.substring(sinParametros.lastIndexOf('/') + 1);
    }

    public String getBaseDir() { return baseDir; }
    public String getExternalDir() { return externalDir; }
    public String getDriveDir() { return driveDir; }
    public String getDatabaseName() { return databaseName; }
    public String getDatabaseUser() { return databaseUser; }
    public String getDatabasePassword() { return databasePassword; }
    public String getPgDumpPath() { return pgDumpPath; }
    public String getPgRestorePath() { return pgRestorePath; }
    public String getEncryptionKey() { return encryptionKey; }
    public int getRetentionDays() { return retentionDays; }
}
