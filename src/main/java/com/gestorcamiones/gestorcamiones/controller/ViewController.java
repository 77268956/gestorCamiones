package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.UsuarioService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class ViewController {
    private final UsuarioService usuarioService;

    public ViewController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login(
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "logout", required = false) String logout,
            Model model) {

        if (error != null) {
            model.addAttribute("error", "Correo o contrasena incorrectos");
        }

        if (logout != null) {
            model.addAttribute("message", "Sesion cerrada correctamente");
        }

        return "index";
    }

    @GetMapping("/dashboard")
    public String dashboard(Authentication authentication, Model model) {
        String nombreUsuario = authentication.getName();
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            nombreUsuario = customUserDetails.getUsername();
        }
        model.addAttribute("nombreUsuario", nombreUsuario);
        return "view/dashboard";
    }

    @GetMapping("/usuarios")
    public String usuarios(Authentication authentication, Model model) {
        String nombreUsuario = authentication.getName();
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            nombreUsuario = customUserDetails.getUsername();
        }
        model.addAttribute("nombreUsuario", nombreUsuario);
        return "/view/usuarios";
    }

    @GetMapping("/practica")
    public String practica(Authentication authentication, Model model) {
        String nombreUsuario = authentication.getName();
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails customUserDetails) {
            nombreUsuario = customUserDetails.getUsername();
        }
        model.addAttribute("nombreUsuario", nombreUsuario);
        return "/view/practica";
    }

    @GetMapping("/camiones")
    public String camiones() {
        return "/view/view_camiones";
    }
}
