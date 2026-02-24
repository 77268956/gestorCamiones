package com.gestorcamiones.gestorcamiones.config;

import com.gestorcamiones.gestorcamiones.entity.EstadoCuenta;
import com.gestorcamiones.gestorcamiones.entity.EstadoEmpleado;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Rol;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import com.gestorcamiones.gestorcamiones.repository.RolRepository;
import com.gestorcamiones.gestorcamiones.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDefaultAdmin(
            UsuarioRepository usuarioRepository,
            LoginRepository loginRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder,
            PlatformTransactionManager transactionManager) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        return args -> transactionTemplate.executeWithoutResult(status -> {
            rolRepository.findByRol("ROLE_USER").orElseGet(() -> {
                Rol rol = new Rol();
                rol.setRol("ROLE_USER");
                rol.setDescripcion("Rol de usuario");
                return rolRepository.save(rol);
            });

            Rol roleAdmin = rolRepository.findByRol("ROLE_ADMIN").orElseGet(() -> {
                Rol rol = new Rol();
                rol.setRol("ROLE_ADMIN");
                rol.setDescripcion("Rol de administrador");
                return rolRepository.save(rol);
            });

            Usuario adminUsuario = loginRepository.findByEmail("admin@demo.local")
                    .map(Login::getUsuarioEntidad)
                    .orElseGet(() -> usuarioRepository.findByNombre("admin").orElseGet(Usuario::new));

            adminUsuario.setNombre("admin");
            adminUsuario.setEstadoEmpleado(EstadoEmpleado.activo);
            adminUsuario.setRol(roleAdmin);
            adminUsuario = usuarioRepository.save(adminUsuario);

            Login adminLogin = loginRepository.findByEmail("admin@demo.local")
                    .or(() -> loginRepository.findByUsuario("admin"))
                    .orElseGet(Login::new);

            adminLogin.setUsuario("admin");
            adminLogin.setEmail("admin@demo.local");
            adminLogin.setPassword(passwordEncoder.encode("123"));
            adminLogin.setEstadoCuenta(EstadoCuenta.habilitado);
            adminLogin.setUsuarioEntidad(adminUsuario);
            loginRepository.save(adminLogin);
        });
    }
}
