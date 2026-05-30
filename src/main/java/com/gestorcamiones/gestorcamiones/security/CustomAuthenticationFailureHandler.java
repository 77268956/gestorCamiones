package com.gestorcamiones.gestorcamiones.security;

import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaLoginFallido;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.repository.AuditoriaR.AuditoriaLoginFallidoRepository;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthenticationFailureHandler
        implements AuthenticationFailureHandler {

    private final LoginRepository loginRepository;
    private final AuditoriaLoginFallidoRepository auditoriaRepository;

    public CustomAuthenticationFailureHandler(
            LoginRepository loginRepository,
            AuditoriaLoginFallidoRepository auditoriaRepository) {

        this.loginRepository = loginRepository;
        this.auditoriaRepository = auditoriaRepository;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception)
            throws IOException {

        String email = request.getParameter("email");
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        String errorMessage = "Usuario o contrasena incorrectos";
        String motivo = "BAD_CREDENTIALS";

        Login login = loginRepository.findByEmail(email).orElse(null);

        if (exception instanceof LockedException) {
            errorMessage = "Tu cuenta esta bloqueada temporalmente.";
            motivo = "ACCOUNT_LOCKED";
        } else if (exception instanceof DisabledException) {
            motivo = "ACCOUNT_DISABLED";
        } else if (exception instanceof UsernameNotFoundException) {
            motivo = "USER_NOT_FOUND";
        } else {
            // V2: intentos/bloqueo se eliminaron; solo se registra en auditoria.
        }

        // Guardar auditoría
        AuditoriaLoginFallido auditoria =
                new AuditoriaLoginFallido(email, ip, userAgent, motivo);

        auditoriaRepository.save(auditoria);

        request.getSession().setAttribute("error", errorMessage);
        response.sendRedirect("/login");
    }
}