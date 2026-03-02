# GestorCamiones

Aplicacion web para la gestion operativa de camiones, usuarios y roles.

## Tecnologias

- Java 17
- Spring Boot 4
- Spring MVC + Thymeleaf
- Spring Security
- Spring Data JPA
- PostgreSQL
- OpenAPI 3 (Swagger UI)

## Requisitos

- JDK 17
- Maven 3.9+ (o `mvnw`)
- PostgreSQL en ejecucion

## Configuracion

La aplicacion usa estas variables (con valores por defecto):

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/gestor_camionesMP`)
- `DB_USERNAME` (default: `postgres`)
- `DB_PASSWORD` (default: `********`)

Archivo: `src/main/resources/application.properties`

## Ejecucion local

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

La aplicacion inicia en:

- App: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Credenciales iniciales

Al arrancar, se crea un usuario por defecto si no existe:

- Email: `soporte@demo.local`
- Password: `123`
- Rol: `ROLE_ADMIN`

## Endpoints principales

### Usuarios

- `GET /api/usuarios`
- `POST /api/usuarios`
- `GET /api/usuarios/estados`

### Camiones

- `GET /api/camiones`
- `POST /api/camiones`
- `GET /api/camiones/estados`

### Roles

- `GET /api/rol/estados`

## Seguridad

- Login por formulario en `/login`
- Acceso a Swagger habilitado sin autenticacion:
  - `/swagger-ui/**`
  - `/v3/api-docs/**`

## Estructura base

```text
src/main/java/com/gestorcamiones/gestorcamiones
  |- config
  |- controller
  |- dto
  |- entity
  |- mapper
  |- repository
  |- security
  |- service
```
