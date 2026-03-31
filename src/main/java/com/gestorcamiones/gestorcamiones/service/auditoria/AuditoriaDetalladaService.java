package com.gestorcamiones.gestorcamiones.service.auditoria;

import com.fasterxml.jackson.databind.JsonNode;
import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaDetallada;
import com.gestorcamiones.gestorcamiones.entity.Enum.AccionAuditoria;
import com.gestorcamiones.gestorcamiones.repository.AuditoriaR.AuditoriaDetalladaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AuditoriaDetalladaService implements IAuditoriaDetalladaService {

    private  final AuditoriaDetalladaRepository repository;
    private final HttpServletRequest request;

    public AuditoriaDetalladaService(AuditoriaDetalladaRepository repository, HttpServletRequest request) {
        this.repository = repository;
        this.request = request;
    }

    @Override
    public List<AuditoriaDetallada> lsitaAuditoria() {
        return repository.findAll();
    }

    @Override
    public Page<AuditoriaDetallada> obtenerAuditoriaDetallada(
            LocalDateTime desde,
            LocalDateTime hasta,
            String tabla,
            String accion,
            String q,
            int page,
            int size
    ) {
        int pageSafe = Math.max(page, 0);
        int sizeSafe = Math.max(1, Math.min(size, 200));

        DateRange range = resolverRangoFechas(desde, hasta);
        Pageable pageable = PageRequest.of(pageSafe, sizeSafe, Sort.by(Sort.Direction.DESC, "fecha"));

        Specification<AuditoriaDetallada> spec = Specification.where(
                specFechaDesde(range.desde()))
                .and(specFechaHasta(range.hasta()))
                .and(specTabla(tabla))
                .and(specAccion(accion))
                .and(specBusqueda(q));

        return repository.findAll(spec, pageable);
    }

    @Override
    public void registrar(
            String tabla,
            Long usuarioId,
            AccionAuditoria accion,
            String nombre,
            JsonNode datosAntes,
            JsonNode datosDespues,
            Long idRegistro
    ) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip != null && !ip.isEmpty()) {
            ip = ip.split(",")[0];
        } else {
            ip = request.getRemoteAddr();
        }

        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            userAgent = "DESCONOCIDO";
        }

        AuditoriaDetallada auditoria = new AuditoriaDetallada();

        auditoria.setTabla(tabla);
        auditoria.setUsuarioId(usuarioId);
        auditoria.setAccion(accion);
        auditoria.setIdRegistro(idRegistro);
        auditoria.setUsuarioNombre(nombre);

        auditoria.setDatosAntes(datosAntes);
        auditoria.setDatosDespues(datosDespues);

        auditoria.setIp(ip);
        auditoria.setUserAgent(userAgent);

        repository.save(auditoria);
    }

    private record DateRange(LocalDateTime desde, LocalDateTime hasta) {}

    private DateRange resolverRangoFechas(LocalDateTime desde, LocalDateTime hasta) {
        LocalDateTime hastaEff = hasta;
        LocalDateTime desdeEff = desde;

        if (hastaEff == null && desdeEff == null) {
            hastaEff = LocalDateTime.now();
            desdeEff = hastaEff.minusDays(7);
        } else if (hastaEff == null) {
            hastaEff = LocalDateTime.now();
        } else if (desdeEff == null) {
            desdeEff = hastaEff.minusDays(7);
        }

        return new DateRange(desdeEff, hastaEff);
    }

    private Specification<AuditoriaDetallada> specFechaDesde(LocalDateTime desde) {
        return (root, query, cb) -> desde == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("fecha"), desde);
    }

    private Specification<AuditoriaDetallada> specFechaHasta(LocalDateTime hasta) {
        return (root, query, cb) -> hasta == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("fecha"), hasta);
    }

    private Specification<AuditoriaDetallada> specTabla(String tabla) {
        if (tabla == null || tabla.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        String term = "%" + tabla.toLowerCase(Locale.ROOT).trim() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("tabla")), term);
    }

    private Specification<AuditoriaDetallada> specAccion(String accion) {
        if (accion == null || accion.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }

        AccionAuditoria parsed;
        try {
            parsed = AccionAuditoria.valueOf(accion.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ignored) {
            return (root, query, cb) -> cb.disjunction();
        }

        AccionAuditoria finalParsed = parsed;
        return (root, query, cb) -> cb.equal(root.get("accion"), finalParsed);
    }

    private Specification<AuditoriaDetallada> specBusqueda(String q) {
        if (q == null || q.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }

        String term = q.toLowerCase(Locale.ROOT).trim();
        String like = "%" + term + "%";

        boolean numeric = term.chars().allMatch(Character::isDigit);
        Long number = null;
        if (numeric) {
            try {
                number = Long.parseLong(term);
            } catch (Exception ignored) {
                number = null;
            }
        }

        Long finalNumber = number;

        return (root, query, cb) -> {
            var pTabla = cb.like(cb.lower(root.get("tabla")), like);
            var pIp = cb.like(cb.lower(root.get("ip")), like);
            var pUa = cb.like(cb.lower(root.get("userAgent")), like);
            var pUsuarioNombre = cb.like(cb.lower(root.get("usuarioNombre")), like);

            if (finalNumber == null) {
                return cb.or(pTabla, pIp, pUa, pUsuarioNombre);
            }

            var pId = cb.equal(root.get("id"), finalNumber);
            var pIdRegistro = cb.equal(root.get("idRegistro"), finalNumber);
            var pUsuarioId = cb.equal(root.get("usuarioId"), finalNumber);

            return cb.or(pTabla, pIp, pUa, pUsuarioNombre, pId, pIdRegistro, pUsuarioId);
        };
    }

}
