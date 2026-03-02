package com.gestorcamiones.gestorcamiones.entity;

import com.gestorcamiones.gestorcamiones.entity.Enum.EstadoCuenta;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "login")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE login SET deleted_at = CURRENT_TIMESTAMP WHERE id_login = ?")
@SQLRestriction("deleted_at IS NULL")
public class Login {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_login")
    private Long idLogin;

    @Column(name = "usuario", unique = true, nullable = false)
    private String usuario;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_cuenta", nullable = false)
    private EstadoCuenta estadoCuenta;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false, unique = true)
    private Usuario usuarioEntidad;

    @Column(nullable = false)
    private int intentosFallidos = 0;

    private LocalDateTime bloqueoHasta;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // =========================
    // LÓGICA DE BLOQUEO
    // =========================

    public boolean estaBloqueado() {

        // Bloqueo administrativo
        if (estadoCuenta == EstadoCuenta.bloqueado) {
            return true;
        }

        // Bloqueo automático temporal
        if (bloqueoHasta != null && bloqueoHasta.isAfter(LocalDateTime.now())) {
            return true;
        }

        return false;
    }

    public void incrementarIntentos() {
        this.intentosFallidos++;

        if (this.intentosFallidos >= 5) {
            this.bloqueoHasta = LocalDateTime.now().plusMinutes(5);
            this.intentosFallidos = 0;
        }
    }

    public void resetIntentos() {
        this.intentosFallidos = 0;
        this.bloqueoHasta = null;
    }

}