package com.gestorcamiones.gestorcamiones.security;

import com.gestorcamiones.gestorcamiones.entity.EstadoCuenta;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.entity.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private final Login login;

    public CustomUserDetails(Login login) {
        this.login = login;
    }

    public Long getIdUsuario() {
        Usuario usuario = login.getUsuarioEntidad();
        return usuario != null ? usuario.getId() : null;
    }

    public String getEmail() {
        return login.getEmail();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        String rol = "ROLE_USER";

        if (login.getUsuarioEntidad() != null
                && login.getUsuarioEntidad().getRol() != null
                && login.getUsuarioEntidad().getRol().getRol() != null) {

            rol = login.getUsuarioEntidad()
                    .getRol()
                    .getRol()
                    .trim()
                    .toUpperCase();
        }

        if (!rol.startsWith("ROLE_")) {
            rol = "ROLE_" + rol;
        }

        return List.of(new SimpleGrantedAuthority(rol));
    }

    @Override
    public String getPassword() {
        return login.getPassword();
    }

    @Override
    public String getUsername() {
        return login.getEmail();
    }

    @Override
    public boolean isEnabled() {
        return login.getEstadoCuenta() == EstadoCuenta.habilitado;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() {
        return login.getEstadoCuenta() != EstadoCuenta.bloqueado;
    }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

}