package com.gestorcamiones.gestorcamiones.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuarios")
    private Long idUsuarios;

    private String nombre;
    private String apellido;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_empleado", nullable = false)
    private EstadoEmpleado estadoEmpleado;

    private String telefono;
    private String dui;

    @Column(name = "foto_url")
    private String fotoUrl;

    @Column(name = "id_camion")
    private Long idCamion;

    // ===== RELACIONES =====

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_rol", nullable = false)
    private Rol rol;

    @OneToOne(mappedBy = "usuarioEntidad", fetch = FetchType.LAZY)
    private Login login;

    // ===== Auditoría =====

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ===== Getters y Setters =====

    public Long getIdUsuarios() { return idUsuarios; }
    public void setIdUsuarios(Long idUsuarios) { this.idUsuarios = idUsuarios; }
    public Long getId() { return idUsuarios; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public EstadoEmpleado getEstadoEmpleado() { return estadoEmpleado; }
    public void setEstadoEmpleado(EstadoEmpleado estadoEmpleado) { this.estadoEmpleado = estadoEmpleado; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDui() { return dui; }
    public void setDui(String dui) { this.dui = dui; }

    public String getFotoUrl() { return fotoUrl; }
    public void setFotoUrl(String fotoUrl) { this.fotoUrl = fotoUrl; }

    public Long getIdCamion() { return idCamion; }
    public void setIdCamion(Long idCamion) { this.idCamion = idCamion; }

    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }

    public Login getLogin() { return login; }
    public void setLogin(Login login) { this.login = login; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
