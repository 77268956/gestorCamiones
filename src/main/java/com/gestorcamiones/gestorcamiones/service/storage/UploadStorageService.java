package com.gestorcamiones.gestorcamiones.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class UploadStorageService {

    private final Path uploadDir;

    public UploadStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        return store(null, null, file);
    }

    /**
     * Guarda un archivo en una subcarpeta por categoria, usando un nombre "logico".
     * category: ej "gasto_camion", "gasto_viaje"
     * logicalName: ej "camion_12", "viaje_55"
     */
    public String store(String category, String logicalName, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String original = file.getOriginalFilename();
        String filename = StringUtils.cleanPath(original == null ? "evidencia" : original);
        String ext = "";
        int dot = filename.lastIndexOf('.');
        if (dot >= 0 && dot < filename.length() - 1) {
            ext = filename.substring(dot);
        }

        String cat = slug(category);
        if (cat.isBlank()) cat = "misc";

        String base = slug(logicalName);
        if (base.isBlank()) base = "evidencia";

        String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String shortId = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        String safeName = base + "_" + stamp + "_" + shortId + ext.toLowerCase();

        try {
            Path categoryDir = uploadDir.resolve(cat).normalize();
            Files.createDirectories(categoryDir);
            Path target = categoryDir.resolve(safeName).normalize();
            if (!target.startsWith(categoryDir)) {
                throw new IllegalArgumentException("Ruta de archivo invalida");
            }
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo guardar el archivo de evidencia");
        }

        // Se expone via ResourceHandler como /uploads/{categoria}/{filename}
        return "/uploads/" + cat + "/" + safeName;
    }

    private static String slug(String input) {
        if (input == null) return "";
        String s = input.trim();
        if (s.isEmpty()) return "";
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        s = s.toLowerCase();
        s = s.replaceAll("[^a-z0-9]+", "_");
        s = s.replaceAll("^_+|_+$", "");
        if (s.length() > 60) s = s.substring(0, 60);
        return s;
    }
}
