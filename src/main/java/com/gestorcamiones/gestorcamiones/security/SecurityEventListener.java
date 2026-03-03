package com.gestorcamiones.gestorcamiones.security;

import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaSesion;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.repository.AuditoriaR.AuditoriaSesionRepository;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.authentication.event.LogoutSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class SecurityEventListener {

    private final AuditoriaSesionRepository auditoriaRepository;
    private final LoginRepository loginRepository;

    public SecurityEventListener(AuditoriaSesionRepository auditoriaRepository,
                                 LoginRepository loginRepository) {
        this.auditoriaRepository = auditoriaRepository;
        this.loginRepository = loginRepository;
    }

    // LOGIN EXITOSO
    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {

        String email = event.getAuthentication().getName();

        Login login = loginRepository.findByEmail(email).orElse(null);

        if (login != null) {
            AuditoriaSesion auditoria =
                    new AuditoriaSesion(login.getIdLogin(), "LOGIN");

            auditoriaRepository.save(auditoria);
        }

    }

    // LOGOUT EXITOSO
    @EventListener
    public void onLogoutSuccess(LogoutSuccessEvent event) {

        Authentication auth = event.getAuthentication();

        if (auth != null) {

            String email = auth.getName();

            Login login = loginRepository.findByEmail(email).orElse(null);

            if (login != null) {
                AuditoriaSesion auditoria =
                        new AuditoriaSesion(login.getIdLogin(), "LOGOUT");

                auditoriaRepository.save(auditoria);
            }
        }
    }
}