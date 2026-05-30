package com.gestorcamiones.gestorcamiones;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Punto de entrada principal de la aplicacion Gestor de Camiones.
 */
@SpringBootApplication
@EnableScheduling
public class GestorCamionesApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestorCamionesApplication.class, args);
    }

}

