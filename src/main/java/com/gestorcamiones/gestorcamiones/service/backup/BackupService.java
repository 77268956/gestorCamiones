package com.gestorcamiones.gestorcamiones.service.backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestorcamiones.gestorcamiones.entity.BackupRegistro;
import com.gestorcamiones.gestorcamiones.repository.BackupRegistroRepository;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.service.auditoria.IAuditoriaDetalladaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class BackupService {

    private final BackupStorageProperties properties;
    private final EncryptionService encryptionService;
    private final DriveService driveService;
    private final BackupRegistroRepository repository;
    private final IAuditoriaDetalladaService auditoriaDetalladaService;
    private final ObjectMapper objectMapper;

    public BackupService(BackupStorageProperties properties,
                         EncryptionService encryptionService,
                         DriveService driveService,
                         BackupRegistroRepository repository,
                         IAuditoriaDetalladaService auditoriaDetalladaService,
                         ObjectMapper objectMapper) {
        this.properties = properties;
        this.encryptionService = encryptionService;
        this.driveService = driveService;
        this.repository = repository;
        this.auditoriaDetalladaService = auditoriaDetalladaService;
        this.objectMapper = objectMapper;
    }

    public BackupRegistro crearBackupManual() {
        return crearBackup("MANUAL");
    }

    public BackupRegistro crearBackupAutomatico() {
        return crearBackup("AUTOMATICO");
    }

    public void restaurarBackup(Long backupId) {
        BackupRegistro backup = repository.findById(backupId).orElseThrow(() -> new IllegalArgumentException("Backup no encontrado"));
        Path archivo = Paths.get(backup.getRutaInterna());
        try {
            Path temporal = Files.createTempFile("restore-", ".backup");
            encryptionService.decryptFile(archivo, temporal, properties.getEncryptionKey());
            ejecutarPgRestore(temporal);
            backup.setEstado("RESTAURADO");
            backup.setRestauradoEn(LocalDateTime.now());
            BackupRegistro guardado = repository.save(backup);
            registrarAuditoria(guardado, AccionAuditoria.UPDATE, "Backup restaurado correctamente");
            Files.deleteIfExists(temporal);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo restaurar el backup", e);
        }
    }

    public List<BackupRegistro> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(BackupRegistro::getCreadoEn).reversed())
                .toList();
    }

    public BackupRegistro registrarBackupExistente(Path archivoSubido) {
        try {
            Path base = Paths.get(properties.getBaseDir()).toAbsolutePath();
            Path external = Paths.get(properties.getExternalDir()).toAbsolutePath();
            Path drive = Paths.get(properties.getDriveDir()).toAbsolutePath();
            Files.createDirectories(base);
            Files.createDirectories(external);
            Files.createDirectories(drive);

            String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS"));
            String uuid = UUID.randomUUID().toString().substring(0, 8);
            String baseName = "importado_" + stamp + "_" + uuid;
            Path internalCopy = base.resolve(baseName + ".enc");
            Path externalCopy = external.resolve(baseName + ".enc");
            Path driveCopy = drive.resolve(baseName + ".enc");
            Files.copy(archivoSubido, internalCopy, StandardCopyOption.REPLACE_EXISTING);
            Files.copy(archivoSubido, externalCopy, StandardCopyOption.REPLACE_EXISTING);
            Files.copy(archivoSubido, driveCopy, StandardCopyOption.REPLACE_EXISTING);

            BackupRegistro registro = new BackupRegistro();
            registro.setArchivoOriginal(archivoSubido.toString());
            registro.setArchivoCifrado(internalCopy.toString());
            registro.setRutaInterna(internalCopy.toString());
            registro.setRutaExterna(externalCopy.toString());
            registro.setRutaNube(driveCopy.toString());
            registro.setOrigen("IMPORTADO");
            registro.setEstado("OK");
            registro.setCreadoEn(LocalDateTime.now());
            registro.setDetalle("Backup existente registrado en el sistema");
            BackupRegistro guardado = repository.save(registro);
            registrarAuditoria(guardado, AccionAuditoria.CREATE, "Backup importado manualmente");
            return guardado;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo registrar el backup existente", e);
        }
    }

    private BackupRegistro crearBackup(String origen) {
        try {
            Path base = Paths.get(properties.getBaseDir()).toAbsolutePath();
            Path external = Paths.get(properties.getExternalDir()).toAbsolutePath();
            Path drive = Paths.get(properties.getDriveDir()).toAbsolutePath();
            Files.createDirectories(base);
            Files.createDirectories(external);
            Files.createDirectories(drive);

            String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS"));
            String uuid = UUID.randomUUID().toString().substring(0, 8);
            String baseName = "backup_" + stamp + "_" + uuid;
            Path dumpFile = base.resolve(baseName + ".backup");
            ejecutarPgDump(dumpFile);

            Path encryptedFile = base.resolve(baseName + ".enc");
            encryptionService.encryptFile(dumpFile, encryptedFile, properties.getEncryptionKey());

            Path internalCopy = base.resolve(baseName + "_interno.enc");
            Path externalCopy = external.resolve(baseName + "_externo.enc");
            Path driveCopy = drive.resolve(baseName + "_drive.enc");
            Files.copy(encryptedFile, internalCopy, StandardCopyOption.REPLACE_EXISTING);
            Files.copy(encryptedFile, externalCopy, StandardCopyOption.REPLACE_EXISTING);
            driveService.subirSimulado(encryptedFile, driveCopy);
            Files.deleteIfExists(dumpFile);

            BackupRegistro registro = new BackupRegistro();
            registro.setArchivoOriginal(dumpFile.toString());
            registro.setArchivoCifrado(encryptedFile.toString());
            registro.setRutaInterna(internalCopy.toString());
            registro.setRutaExterna(externalCopy.toString());
            registro.setRutaNube(driveCopy.toString());
            registro.setOrigen(origen);
            registro.setEstado("OK");
            registro.setCreadoEn(LocalDateTime.now());
            registro.setDetalle("Backup generado correctamente");
            BackupRegistro guardado = repository.save(registro);
            registrarAuditoria(guardado, AccionAuditoria.CREATE, "Backup generado correctamente");
            return guardado;
        } catch (Exception e) {
            BackupRegistro error = new BackupRegistro();
            error.setArchivoOriginal("");
            error.setArchivoCifrado("");
            error.setRutaInterna("");
            error.setRutaExterna("");
            error.setRutaNube("");
            error.setOrigen(origen);
            error.setEstado("ERROR");
            error.setCreadoEn(LocalDateTime.now());
            error.setDetalle(e.getMessage());
            repository.save(error);
            throw new IllegalStateException("No se pudo crear el backup", e);
        }
    }

    public int limpiarBackupsAntiguos() {
        LocalDateTime limite = LocalDateTime.now().minusDays(properties.getRetentionDays());
        List<BackupRegistro> antiguos = repository.findAll().stream()
                .filter(b -> b.getCreadoEn() != null && b.getCreadoEn().isBefore(limite))
                .toList();

        int eliminados = 0;
        for (BackupRegistro backup : antiguos) {
            registrarAuditoria(backup, AccionAuditoria.DELETE, "Backup eliminado por antiguedad");
            eliminarArchivosBackup(backup);
            repository.delete(backup);
            eliminados++;
        }
        return eliminados;
    }

    private void ejecutarPgDump(Path archivoDestino) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
                properties.getPgDumpPath(),
                "-U", properties.getDatabaseUser(),
                "-F", "c",
                "-f", archivoDestino.toString(),
                properties.getDatabaseName()
        );
        if (!properties.getDatabasePassword().isBlank()) {
            pb.environment().put("PGPASSWORD", properties.getDatabasePassword());
        }
        Process process = pb.start();
        String salida = leerProceso(process);
        int exit = process.waitFor();
        if (exit != 0) {
            throw new IllegalStateException("pg_dump fallo: " + salida);
        }
    }

    private void ejecutarPgRestore(Path archivo) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
                properties.getPgRestorePath(),
                "-U", properties.getDatabaseUser(),
                "-d", properties.getDatabaseName(),
                "-c",
                archivo.toString()
        );
        if (!properties.getDatabasePassword().isBlank()) {
            pb.environment().put("PGPASSWORD", properties.getDatabasePassword());
        }
        Process process = pb.start();
        String salida = leerProceso(process);
        int exit = process.waitFor();
        if (exit != 0) {
            throw new IllegalStateException("pg_restore fallo: " + salida);
        }
    }

    private String leerProceso(Process process) throws Exception {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
             BufferedReader err = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line).append('\n');
            while ((line = err.readLine()) != null) sb.append(line).append('\n');
            return sb.toString();
        }
    }

    private void eliminarArchivosBackup(BackupRegistro backup) {
        borrarSiExiste(backup.getRutaInterna());
        borrarSiExiste(backup.getRutaExterna());
        borrarSiExiste(backup.getRutaNube());
        borrarSiExiste(backup.getArchivoCifrado());
        borrarSiExiste(backup.getArchivoOriginal());
    }

    private void borrarSiExiste(String ruta) {
        if (ruta == null || ruta.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(Path.of(ruta));
        } catch (Exception ignored) {
        }
    }

    private void registrarAuditoria(BackupRegistro backup, AccionAuditoria accion, String detalle) {
        try {
            auditoriaDetalladaService.registrarSistema(
                    "backup",
                    accion,
                    "SISTEMA",
                    objectMapper.valueToTree(backup),
                    objectMapper.valueToTree(backup),
                    backup.getId(),
                    detalle
            );
        } catch (Exception ignored) {
        }
    }
}
