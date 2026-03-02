package com.gestorcamiones.gestorcamiones.security;

import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final LoginRepository loginRepository;

    public CustomAuthenticationSuccessHandler(LoginRepository loginRepository) {
        this.loginRepository = loginRepository;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException {

        String email = authentication.getName();

        Login login = loginRepository.findByEmail(email).orElse(null);

        if (login != null) {
            login.resetIntentos();
            loginRepository.save(login);
        }

      // response.sendRedirect("/dashboard");
        response.sendRedirect("/usuarios");
    }
}