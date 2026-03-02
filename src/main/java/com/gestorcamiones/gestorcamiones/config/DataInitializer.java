package com.gestorcamiones.gestorcamiones.config;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCuenta;
import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoEmpleado;
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

/**
 * Inicializa datos base (roles y usuario administrador) al levantar la aplicacion.
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDefaultUser(
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

            Usuario defaultUsuario = loginRepository.findByEmail("soporte@demo.local")
                    .map(Login::getUsuarioEntidad)
                    .orElseGet(() -> usuarioRepository.findByNombre("soporte").orElseGet(Usuario::new));

            defaultUsuario.setNombre("soporte");
            defaultUsuario.setEstadoEmpleado(EstadoEmpleado.activo);
            defaultUsuario.setRol(roleAdmin);
            defaultUsuario = usuarioRepository.save(defaultUsuario);

            Login defaultLogin = loginRepository.findByEmail("soporte@demo.local")
                    .or(() -> loginRepository.findByUsuario("soporte"))
                    .orElseGet(Login::new);

            defaultLogin.setUsuario("soporte");
            defaultLogin.setEmail("soporte@demo.local");
            defaultLogin.setPassword(passwordEncoder.encode("123"));
            defaultLogin.setEstadoCuenta(EstadoCuenta.habilitado);
            defaultLogin.setUsuarioEntidad(defaultUsuario);
            loginRepository.save(defaultLogin);
        });
    }
}
