package com.gestorcamiones.gestorcamiones.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracion central de metadatos para la documentacion OpenAPI/Swagger.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI gestorCamionesOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Gestor de Camiones API")
                        .description("API para la gestion de usuarios, roles y camiones.")
                        .version("v1")
                        .contact(new Contact()
                                .name("Equipo GestorCamiones")
                                .email("soporte@demo.local"))
                        .license(new License()
                                .name("Uso interno")
                                .url("https://example.com/license")));
    }
}
