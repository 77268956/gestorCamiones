package com.gestorcamiones.gestorcamiones.service.backup;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SchedulerService {

    private final BackupService backupService;

    public SchedulerService(BackupService backupService) {
        this.backupService = backupService;
    }

    @Scheduled(cron = "0 0 3 * * MON")
    public void ejecutarBackupSemanal() {
        backupService.crearBackupAutomaticoSistema();
    }

    @Scheduled(cron = "0 30 3 * * MON")
    public void limpiarBackupsViejos() {
        backupService.limpiarBackupsAntiguos();
    }
}
