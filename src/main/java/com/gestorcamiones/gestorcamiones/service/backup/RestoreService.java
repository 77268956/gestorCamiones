package com.gestorcamiones.gestorcamiones.service.backup;

import org.springframework.stereotype.Service;

import java.nio.file.Path;

@Service
public class RestoreService {

    public void restaurarDesdeBackup(Path backupCifrado) {
        throw new UnsupportedOperationException("Restore pending orchestration in BackupService");
    }
}
