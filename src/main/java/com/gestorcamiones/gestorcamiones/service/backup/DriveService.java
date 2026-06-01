package com.gestorcamiones.gestorcamiones.service.backup;

import com.google.api.client.http.FileContent;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;

@Service
public class DriveService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DriveService.class);

    public record DriveUploadResult(String fileId, String fileName, String webViewLink) {}

    private final ObjectProvider<Drive> driveProvider;
    private final boolean enabled;
    private final String folderId;

    public DriveService(ObjectProvider<Drive> driveProvider,
                        @Value("${app.backup.drive.enabled:true}") boolean enabled,
                        @Value("${app.backup.drive.folder-id:}") String folderId) {
        this.driveProvider = driveProvider;
        this.enabled = enabled;
        this.folderId = extractFolderId(folderId);
        log.info("DriveService inicializado: enabled={}, folderId={}", enabled, this.folderId);
    }

    private static String extractFolderId(String input) {
        if (input == null || input.isBlank()) return input;
        input = input.trim();

        if (input.contains("/folders/")) {
            String[] parts = input.split("/folders/");
            if (parts.length > 1) {
                String idPart = parts[1];
                int endIdx = idPart.replaceAll("[?#/].*", "").length();
                return idPart.substring(0, endIdx);
            }
        }
        return input;
    }

    public DriveUploadResult subirSimulado(Path archivo, Path destinoDrive) throws IOException {
        if (!enabled) {
            log.info("Drive deshabilitado, copiando localmente a {}", destinoDrive);
            Files.createDirectories(destinoDrive.getParent());
            Files.copy(archivo, destinoDrive, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return new DriveUploadResult(destinoDrive.toString(), destinoDrive.getFileName().toString(), destinoDrive.toUri().toString());
        }

        Drive drive = driveProvider.getIfAvailable();
        if (drive == null) {
            throw new IllegalStateException("Google Drive no esta configurado");
        }

        log.info("Subiendo archivo a Google Drive: {} ({} bytes)", archivo.getFileName(), Files.size(archivo));

        File metadata = new File();
        metadata.setName(archivo.getFileName().toString());

        List<String> parents;
        if (folderId != null && !folderId.isBlank()) {
            parents = Collections.singletonList(folderId);
            log.info("Usando carpeta destino en Drive: {}", folderId);
        } else {
            parents = Collections.emptyList();
            log.warn("No se configuró folder-id, el archivo se subirá a la raíz del Drive del service account");
        }
        metadata.setParents(parents);

        try {
            File uploaded = drive.files()
                    .create(metadata, new FileContent("application/octet-stream", archivo.toFile()))
                    .setFields("id,name,webViewLink,parents")
                    .execute();

            String webViewLink = uploaded.getWebViewLink();
            if (webViewLink == null || webViewLink.isBlank()) {
                webViewLink = "https://drive.google.com/file/d/" + uploaded.getId() + "/view";
            }

            log.info("Archivo subido exitosamente a Drive: id={}, link={}", uploaded.getId(), webViewLink);
            return new DriveUploadResult(uploaded.getId(), uploaded.getName(), webViewLink);
        } catch (com.google.api.client.googleapis.json.GoogleJsonResponseException e) {
            String googleMessage = e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage();
            log.error("Error de Google Drive API: status={}, message={}", e.getStatusCode(), googleMessage);
            if (e.getStatusCode() == 403 && googleMessage != null && googleMessage.contains("Service Accounts do not have storage quota")) {
                throw new IllegalStateException(
                        "Google Drive rechazó la subida porque la cuenta de servicio no tiene cuota de almacenamiento. " +
                        "La carpeta destino debe estar dentro de un Shared Drive con permisos para la cuenta de servicio, " +
                        "o debes usar OAuth delegation con un usuario real.",
                        e
                );
            }
            throw e;
        } catch (Exception e) {
            log.error("Error inesperado subiendo a Drive: {}", e.getMessage(), e);
            throw e;
        }
    }
}
