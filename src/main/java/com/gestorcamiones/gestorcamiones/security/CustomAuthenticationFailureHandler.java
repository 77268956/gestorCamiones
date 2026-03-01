package com.gestorcamiones.gestorcamiones.security;

import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

    private final LoginRepository loginRepository;

    public CustomAuthenticationFailureHandler(LoginRepository loginRepository) {
        this.loginRepository = loginRepository;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception)
            throws IOException {

        String email = request.getParameter("email");
        String errorMessage = "Usuario o contrasena incorrectos";

        Login login = loginRepository.findByEmail(email).orElse(null);

        if (login != null) {
            if (exception instanceof LockedException) {
                errorMessage = "Tu cuenta esta bloqueada temporalmente.";
            } else {
                login.incrementarIntentos();
                loginRepository.save(login);
            }
        }

        request.getSession().setAttribute("error", errorMessage);
        response.sendRedirect("/login");
    }
}
