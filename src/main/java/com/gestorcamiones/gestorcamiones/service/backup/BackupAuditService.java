package com.gestorcamiones.gestorcamiones.service.backup;

import com.gestorcamiones.gestorcamiones.entity.BackupRegistro;
import com.gestorcamiones.gestorcamiones.entity.HistorialBackup;
import com.gestorcamiones.gestorcamiones.repository.HistorialBackupRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class BackupAuditService {

    private final HistorialBackupRepository repository;

    public BackupAuditService(HistorialBackupRepository repository) {
        this.repository = repository;
    }

    public void registrar(BackupRegistro backup, String accion, String detalle) {
        HistorialBackup historial = new HistorialBackup();
        historial.setBackupId(backup == null ? null : backup.getId());
        historial.setAccion(accion);
        historial.setOrigen(backup == null ? "SISTEMA" : backup.getOrigen());
        historial.setDetalle(detalle);
        historial.setCreadoEn(LocalDateTime.now());
        repository.save(historial);
    }
}
