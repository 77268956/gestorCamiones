package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.entity.Rol;
import com.gestorcamiones.gestorcamiones.repository.RolRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RolService {
    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }


    public List<Rol> listarTodos() {
        return rolRepository.findAll();
    }
}
