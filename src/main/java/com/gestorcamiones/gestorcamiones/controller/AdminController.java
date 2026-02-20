package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.entity.Admin;
import com.gestorcamiones.gestorcamiones.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;


    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping
    public ResponseEntity<Admin> guardar(@Valid @RequestBody Admin admin){
        Admin nuevo = adminService.guardarAdmin(admin);
        return ResponseEntity.ok(nuevo);
    }


    @GetMapping
    public List<Admin> listaAdmin(){
        return adminService.listaAdmin();
    }
}

