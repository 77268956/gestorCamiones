package com.gestorcamiones.gestorcamiones.config;

import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDefaultAdmin(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!usuarioRepository.existsByNombre("admin")) {
                Usuario admin = new Usuario();
                admin.setNombre("admin");
                admin.setEmail("admin@demo.local");
                admin.setPassword(passwordEncoder.encode("Admin1234!"));
                admin.setRole("ROLE_ADMIN");
                admin.setEnabled(true);
                usuarioRepository.save(admin);
            }
        };
    }
}

