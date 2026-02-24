package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login")
public class Login {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_login")
    private Long idLogin;

    @Column(name = "usuario", unique = true)
    private String usuario;

    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_cuenta", nullable = false)
    private EstadoCuenta estadoCuenta;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false, unique = true)
    private Usuario usuarioEntidad;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public Long getIdLogin() { return idLogin; }
    public void setIdLogin(Long idLogin) { this.idLogin = idLogin; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public EstadoCuenta getEstadoCuenta() { return estadoCuenta; }
    public void setEstadoCuenta(EstadoCuenta estadoCuenta) { this.estadoCuenta = estadoCuenta; }

    public Usuario getUsuarioEntidad() { return usuarioEntidad; }
    public void setUsuarioEntidad(Usuario usuarioEntidad) { this.usuarioEntidad = usuarioEntidad; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
