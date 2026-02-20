package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.entity.Admin;
import com.gestorcamiones.gestorcamiones.repository.AdminRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {
    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public Admin guardarAdmin(Admin admin){
        return adminRepository.save(admin);
    }

    public List<Admin> listaAdmin(){
        return adminRepository.findAll();
    }
}

