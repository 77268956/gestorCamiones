package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.dto.DashboardResumenDTO;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.dashboard.DashboardService;
import com.gestorcamiones.gestorcamiones.service.usuario.UsuarioService;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

/**
 * Controlador MVC para vistas web (login, dashboard, reportes y módulos).
 */
@Controller
public class ViewController {

    private final UsuarioService    usuarioService;
    private final DashboardService  dashboardService;

    public ViewController(UsuarioService usuarioService,
                          DashboardService dashboardService) {
        this.usuarioService   = usuarioService;
        this.dashboardService = dashboardService;
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login(
            @RequestParam(value = "error",  required = false) String error,
            @RequestParam(value = "logout", required = false) String logout,
            HttpSession session,
            Model model) {

        String sessionError = (String) session.getAttribute("error");
        if (sessionError != null && !sessionError.isBlank()) {
            model.addAttribute("error", sessionError);
            session.removeAttribute("error");
        } else if (error != null) {
            model.addAttribute("error", "Usuario o contraseña incorrectos");
        }

        if (logout != null) {
            model.addAttribute("message", "Sesión cerrada correctamente");
        }

        return "index";
    }

    @GetMapping("/dashboard")
    public String dashboard(Authentication authentication, Model model) {
        // Nombre de usuario
        String nombreUsuario = authentication.getName();
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            nombreUsuario = customUserDetails.getUsername();
        }
        model.addAttribute("nombreUsuario", nombreUsuario);

        // Datos del dashboard (mes y año actuales)
        int mes = LocalDate.now().getMonthValue();
        int ano = LocalDate.now().getYear();
        DashboardResumenDTO resumen = dashboardService.getDashboardResumen(mes, ano);
        model.addAttribute("resumen", resumen);
        model.addAttribute("anoActual", ano);
        model.addAttribute("mesActual", mes);

        return "view/dashboard";
    }

    @GetMapping("/reportes")
    public String reportes(Authentication authentication, Model model) {
        String nombreUsuario = authentication.getName();
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            nombreUsuario = customUserDetails.getUsername();
        }
        model.addAttribute("nombreUsuario", nombreUsuario);

        int mes = LocalDate.now().getMonthValue();
        int ano = LocalDate.now().getYear();
        model.addAttribute("mesActual", mes);
        model.addAttribute("anoActual", ano);

        return "view/reportes";
    }

    @GetMapping("/usuarios")
    public String usuarios(Authentication authentication, Model model) {
        String nombreUsuario = authentication.getName();
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            nombreUsuario = customUserDetails.getUsername();
        }
        model.addAttribute("nombreUsuario", nombreUsuario);
        return "view/usuarios";
    }

    @GetMapping("/camiones")
    public String camiones() {
        return "view/view_camiones";
    }

    @GetMapping("/clientes")
    public String clientes() {
        return "view/clientes";
    }

    @GetMapping("/auditoria")
    public String auditoria() {
        return "view/auditoria";
    }

    @GetMapping("/viajes")
    public String viajes() { return "view/Viajes"; }

    @GetMapping("/lotes")
    public String lotes() { return "view/lotes"; }

    @GetMapping("/gastos")
    public String total_gastos() { return "view/total_gastos"; }

    @GetMapping("/perfil")
    public String perfil(Authentication authentication, Model model) {
        String nombreUsuario = authentication.getName();
        Object principal = authentication.getPrincipal();
        Long idUsuario = null;
        if (principal instanceof CustomUserDetails customUserDetails) {
            nombreUsuario = customUserDetails.getUsername();
            idUsuario = customUserDetails.getIdUsuario();
        }
        model.addAttribute("nombreUsuario", nombreUsuario);

        if (idUsuario != null) {
            model.addAttribute("perfil", usuarioService.obtenerPerfil(idUsuario));
        }
        return "view/perfil";
    }
}
