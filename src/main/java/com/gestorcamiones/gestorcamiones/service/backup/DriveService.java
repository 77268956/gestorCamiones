package com.gestorcamiones.gestorcamiones.service.backup;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
public class DriveService {

    public Path subirSimulado(Path archivo, Path destinoDrive) throws IOException {
        Files.createDirectories(destinoDrive.getParent());
        Files.copy(archivo, destinoDrive, StandardCopyOption.REPLACE_EXISTING);
        return destinoDrive;
    }
}
