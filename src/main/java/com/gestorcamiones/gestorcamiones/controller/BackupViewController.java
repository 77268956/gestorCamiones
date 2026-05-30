package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.repository.BackupRegistroRepository;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.backup.BackupService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
@RequestMapping("/backups")
public class BackupViewController {

    private final BackupService backupService;
    private final BackupRegistroRepository repository;

    public BackupViewController(BackupService backupService, BackupRegistroRepository repository) {
        this.backupService = backupService;
        this.repository = repository;
    }

    @GetMapping
    public String vista(Model model) {
        model.addAttribute("backups", repository.findAll().stream().sorted((a, b) -> b.getCreadoEn().compareTo(a.getCreadoEn())).toList());
        return "view/backups";
    }

    @PostMapping("/manual")
    public String generarManual(@AuthenticationPrincipal CustomUserDetails admin) {
        backupService.crearBackupManual(admin);
        return "redirect:/backups";
    }

    @PostMapping("/{id}/restaurar")
    public String restaurar(@PathVariable Long id) {
        backupService.restaurarBackup(id);
        return "redirect:/backups";
    }

    @PostMapping("/subir")
    public String subirBackup(MultipartFile archivo, @AuthenticationPrincipal CustomUserDetails admin) throws Exception {
        if (archivo.isEmpty() || archivo.getOriginalFilename() == null || archivo.getOriginalFilename().isBlank()) {
            return "redirect:/backups";
        }
        Path dir = Paths.get("backups", "ingresados");
        Files.createDirectories(dir);
        String nombreSeguro = Paths.get(archivo.getOriginalFilename()).getFileName().toString();
        Path destino = dir.resolve(nombreSeguro);
        archivo.transferTo(destino);
        backupService.registrarBackupExistente(destino, admin);
        return "redirect:/backups";
    }
}
