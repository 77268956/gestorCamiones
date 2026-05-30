package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.service.backup.BackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/backup")
public class BackupController {

    @Autowired
    private BackupService backupService;

    @GetMapping("/crear")
    public String crearBackup() {

        backupService.crearBackupManual();

        return "Backup ejecutado";
    }
}
