package com.gestorcamiones.gestorcamiones.service;

import com.gestorcamiones.gestorcamiones.dto.AuditoriaLoginDTO;
import com.gestorcamiones.gestorcamiones.dto.AuditoriaLoginPageDTO;
import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaLoginFallido;
import com.gestorcamiones.gestorcamiones.entity.Auditoria.AuditoriaSesion;
import com.gestorcamiones.gestorcamiones.entity.Login;
import com.gestorcamiones.gestorcamiones.repository.AuditoriaR.AuditoriaLoginFallidoRepository;
import com.gestorcamiones.gestorcamiones.repository.AuditoriaR.AuditoriaSesionRepository;
import com.gestorcamiones.gestorcamiones.repository.LoginRepository;
import com.gestorcamiones.gestorcamiones.service.Interface.IAuditoriaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AuditoriaService implements IAuditoriaService {
    // mejorar en futuro:  con un union en la base de datos.

    private final AuditoriaSesionRepository auditoriaSesionRepository;
    private final AuditoriaLoginFallidoRepository auditoriaLoginFallidoRepository;
    private final LoginRepository loginRepository;

    public AuditoriaService(
            AuditoriaSesionRepository auditoriaSesionRepository,
            AuditoriaLoginFallidoRepository auditoriaLoginFallidoRepository,
            LoginRepository loginRepository
    ) {
        this.auditoriaSesionRepository = auditoriaSesionRepository;
        this.auditoriaLoginFallidoRepository = auditoriaLoginFallidoRepository;
        this.loginRepository = loginRepository;
    }

    @Override
    public AuditoriaLoginPageDTO obtenerAuditoriaLogin(
            LocalDateTime desde,
            LocalDateTime hasta,
            String tipoEvento,
            String resultado,
            String q,
            int page,
            int size
    ) {
        int pageSafe = Math.max(page, 0);
        int sizeSafe = Math.max(1, Math.min(size, 200));



        List<AuditoriaSesion> sesiones = auditoriaSesionRepository.findAll(Sort.by(Sort.Direction.DESC, "fecha"));
        List<AuditoriaLoginFallido> fallidos = auditoriaLoginFallidoRepository.findAll(Sort.by(Sort.Direction.DESC, "fecha"));


        Map<Long, String> emailPorLoginId = resolverEmailsSesion(sesiones);

        List<AuditoriaLoginDTO> eventos = new ArrayList<>(sesiones.size() + fallidos.size());

        for (AuditoriaSesion sesion : sesiones) {
            String tipo = normalizarTipoSesion(sesion.getTipoSesion());
            eventos.add(new AuditoriaLoginDTO(
                    sesion.getId(),
                    sesion.getFecha(),
                    tipo,
                    emailPorLoginId.getOrDefault(sesion.getIdUsuario(), ""),
                    sesion.getIdUsuario(),
                    null,
                    null,
                    "Autenticacion correcta",
                    "EXITOSO"
            ));
        }

        for (AuditoriaLoginFallido fallido : fallidos) {
            eventos.add(new AuditoriaLoginDTO(
                    fallido.getId(),
                    fallido.getFecha(),
                    "LOGIN_FALLIDO",
                    valorSeguro(fallido.getEmail()),
                    null,
                    valorSeguro(fallido.getIp()),
                    valorSeguro(fallido.getUserAgent()),
                    valorSeguro(fallido.getMotivo()),
                    "FALLIDO"
            ));
        }

        List<AuditoriaLoginDTO> filtrados = eventos.stream()
                .filter(e -> filtraFechaDesde(e, desde))
                .filter(e -> filtraFechaHasta(e, hasta))
                .filter(e -> filtraTipoEvento(e, tipoEvento))
                .filter(e -> filtraResultado(e, resultado))
                .filter(e -> filtraBusqueda(e, q))
                .sorted(Comparator.comparing(AuditoriaLoginDTO::getFecha, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        long totalElements = filtrados.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / sizeSafe);

        int fromIndex = Math.min(pageSafe * sizeSafe, filtrados.size());
        int toIndex = Math.min(fromIndex + sizeSafe, filtrados.size());

        List<AuditoriaLoginDTO> content = filtrados.subList(fromIndex, toIndex);

        return new AuditoriaLoginPageDTO(content, pageSafe, sizeSafe, totalPages, totalElements);
    }

    private Map<Long, String> resolverEmailsSesion(List<AuditoriaSesion> sesiones) {
        Map<Long, String> resultado = new HashMap<>();

        List<Long> idsLogin = sesiones.stream()
                .map(AuditoriaSesion::getIdUsuario)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();

        if (idsLogin.isEmpty()) {
            return resultado;
        }

        List<Login> logins = loginRepository.findAllById(idsLogin);
        for (Login login : logins) {
            if (login.getIdLogin() != null && login.getEmail() != null) {
                resultado.put(login.getIdLogin(), login.getEmail());
            }
        }

        return resultado;
    }

    private boolean filtraFechaDesde(AuditoriaLoginDTO e, LocalDateTime desde) {
        return desde == null || (e.getFecha() != null && !e.getFecha().isBefore(desde));
    }

    private boolean filtraFechaHasta(AuditoriaLoginDTO e, LocalDateTime hasta) {
        return hasta == null || (e.getFecha() != null && !e.getFecha().isAfter(hasta));
    }

    private boolean filtraTipoEvento(AuditoriaLoginDTO e, String tipoEvento) {
        if (tipoEvento == null || tipoEvento.isBlank()) {
            return true;
        }
        return valorSeguro(e.getTipoEvento()).equalsIgnoreCase(tipoEvento.trim());
    }

    private boolean filtraResultado(AuditoriaLoginDTO e, String resultado) {
        if (resultado == null || resultado.isBlank()) {
            return true;
        }
        return valorSeguro(e.getResultado()).equalsIgnoreCase(resultado.trim());
    }

    private boolean filtraBusqueda(AuditoriaLoginDTO e, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }

        String term = q.toLowerCase(Locale.ROOT).trim();

        return contiene(valorSeguro(e.getUsuarioEmail()), term)
                || contiene(valorSeguro(e.getTipoEvento()), term)
                || contiene(valorSeguro(e.getIp()), term)
                || contiene(valorSeguro(e.getUserAgent()), term)
                || contiene(valorSeguro(e.getMotivoDetalle()), term)
                || contiene(valorSeguro(e.getResultado()), term)
                || contiene(String.valueOf(e.getIdUsuario()), term);
    }

    private boolean contiene(String texto, String term) {
        return texto.toLowerCase(Locale.ROOT).contains(term);
    }

    private String normalizarTipoSesion(String tipoSesion) {
        if (tipoSesion == null || tipoSesion.isBlank()) {
            return "LOGIN";
        }
        return tipoSesion.trim().toUpperCase(Locale.ROOT);
    }

    private String valorSeguro(String value) {
        return value == null ? "" : value;
    }
}
