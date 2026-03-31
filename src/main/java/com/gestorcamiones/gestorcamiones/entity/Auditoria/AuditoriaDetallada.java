package com.gestorcamiones.gestorcamiones.entity.Auditoria;

import com.fasterxml.jackson.databind.JsonNode;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
@Entity
@Table(name = "auditoria_detallada")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaDetallada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tabla;

    @Column(name = "id_registro", nullable = false)
    private Long idRegistro;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "auditoria_accion")
    private AccionAuditoria accion;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "usuario_nombre")
    private String usuarioNombre;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(length = 45)
    private String ip;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos_antes", columnDefinition = "jsonb")
    private JsonNode datosAntes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "datos_despues", columnDefinition = "jsonb")
    private JsonNode  datosDespues;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();
    }
}