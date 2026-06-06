# GestorCamiones V2

Aplicacion web para la gestion operativa de camiones, usuarios, viajes, lotes, gastos y auditoria de seguridad.

## Tecnologia

- Java 17
- Spring Boot 4
- Spring MVC + Thymeleaf
- Spring Security
- Spring Data JPA
- PostgreSQL
- OpenAPI 3 con Swagger UI

## Requisitos

- JDK 17
- Maven 3.9+ o `mvnw`
- PostgreSQL en ejecucion

## Configuracion

Variables de entorno soportadas:

- `DB_URL`: por defecto `jdbc:postgresql://localhost:5432/gestor_camionesMP`
- `DB_USERNAME`: por defecto `postgres`
- `DB_PASSWORD`: obligatorio en local si tu PostgreSQL no usa la clave vacia
- `APP_PROFILE`: `pruebas` o `produccion`

La configuracion base se encuentra en `src/main/resources/application.properties`.
Los perfiles especificos estan en `src/main/resources/application-pruebas.properties` y `src/main/resources/application-produccion.properties`.

Por defecto la aplicacion inicia con `pruebas`. Para levantar produccion, cambia `APP_PROFILE=produccion`.
Si tu PostgreSQL local no usa la clave por defecto, define `DB_PASSWORD` antes de arrancar.

## Ejecucion local

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

La aplicacion queda disponible en:

- App: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Para forzar produccion en local:

```powershell
$env:APP_PROFILE="produccion"
.\mvnw.cmd spring-boot:run
```

## Credenciales iniciales

Si no existe un usuario administrador, la aplicacion crea uno por defecto:

- Email: `soporte@demo.local`
- Password: `123`
- Rol: `ROLE_ADMIN`

## Modulos principales

- Autenticacion y control de acceso por roles
- Gestion de usuarios y empleados
- Gestion de camiones
- Gestion de clientes y lotes de carga
- Gestion de viajes y tramos
- Gestion de gastos
- Registro de incidencias
- Bitacora de auditoria
- Dashboard y reportes mensuales
- Copias de seguridad de la base de datos

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
- Acceso a Swagger habilitado sin autenticacion en:
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
