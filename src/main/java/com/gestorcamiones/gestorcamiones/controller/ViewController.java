package com.gestorcamiones.gestorcamiones.controller;

import com.gestorcamiones.gestorcamiones.entity.Usuario;
import com.gestorcamiones.gestorcamiones.security.CustomUserDetails;
import com.gestorcamiones.gestorcamiones.service.UsuarioService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
        return "redirect:/login";  // Redirige al login
    }

    @GetMapping("/login")
    public String login(
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "logout", required = false) String logout,
            Model model) {

        if (error != null) {
            model.addAttribute("error", "Usuario o contraseña incorrectos");
        }

        if (logout != null) {
            model.addAttribute("message", "Sesión cerrada correctamente");
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
        return "/view/dashboard";
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

    @GetMapping("/admin")
    public String admin() {
        return "/view/admin";
    }

    @GetMapping("/practica")
    public String practica(Authentication authentication, Model model){
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

    @PostMapping("/usuarios/guardar")
    public String guardarUsuarioDesdePractica(
            @RequestParam String email,
            @RequestParam String password,
            RedirectAttributes redirectAttributes) {
        try {
            Usuario usuario = new Usuario();
            String nombre = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
            usuario.setNombre(nombre);
            usuario.setEmail(email);
            usuario.setPassword(password);
            usuario.setRole("ROLE_USER");
            usuarioService.guardar(usuario);
            redirectAttributes.addFlashAttribute("message", "Usuario creado correctamente.");
        } catch (IllegalArgumentException ex) {
            redirectAttributes.addFlashAttribute("error", ex.getMessage());
        }
        return "redirect:/usuarios";
    }
}

