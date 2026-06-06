# Checklists y Matrices de Cumplimiento — GestorCamiones V2

> **Propósito:** Listas de verificación de seguridad y matrices de cumplimiento ISO para el sistema GestorCamiones V2.
> **Formato de matriz:** Requisito → Evidencia → Responsable

---

## CHECKLIST-01: Seguridad de la Aplicación

| # | Control de Seguridad | ¿Cumple? | Observaciones |
|---|---|---|---|
| 1 | Las contraseñas se almacenan con BCrypt (sin texto plano) | ⬜ Sí / ❌ No | Ver RF-01, RNF-03 |
| 2 | El sistema bloquea cuentas con estado `bloqueado` | ⬜ Sí / ❌ No | Ver RF-01 |
| 3 | Las rutas protegidas retornan 403 para roles no autorizados | ⬜ Sí / ❌ No | Ver RF-01, Sección 2.2 |
| 4 | Swagger UI es accesible sin autenticación (rutas `/swagger-ui/**`) | ⬜ Sí / ❌ No | Ver README — Seguridad |
| 5 | Spring Data JPA usa consultas parametrizadas (sin SQL manual vulnerable) | ⬜ Sí / ❌ No | Ver RNF-03 |
| 6 | Las sesiones inactivas se bloquean tras tiempo establecido | ⬜ Sí / ❌ No | Ver RNF-03 |
| 7 | Los intentos de login fallidos quedan registrados con IP y User Agent | ⬜ Sí / ❌ No | Ver RF-11 |
| 8 | El sistema registra inicios y cierres de sesión en bitácora | ⬜ Sí / ❌ No | Ver RF-11 |
| 9 | Las variables de entorno ocultan credenciales (`DB_PASSWORD`) | ⬜ Sí / ❌ No | Ver README — Configuración |
| 10 | No existen credenciales hardcodeadas en el código fuente | ⬜ Sí / ❌ No | Verificar `application.properties` |

**Resultado Checklist-01:** ___/10 controles cumplidos

---

## CHECKLIST-02: Integridad de Datos y Reglas de Negocio

| # | Control | ¿Cumple? | Observaciones |
|---|---|---|---|
| 1 | Los campos únicos (placa, código camión, nombre viaje) generan error ante duplicados | ⬜ Sí / ❌ No | Ver RF-03, RF-07 |
| 2 | No se permiten dos tramos del mismo tipo (`ida`/`vuelta`) en un mismo viaje | ⬜ Sí / ❌ No | Ver Regla de Negocio RN-04 |
| 3 | La fecha de salida es siempre anterior a la fecha de llegada en un tramo | ⬜ Sí / ❌ No | Ver Regla de Negocio RN-05 |
| 4 | El sistema detecta solapamiento de camiones en tramos simultáneos | ⬜ Sí / ❌ No | Ver Regla de Negocio RN-02 |
| 5 | El sistema detecta solapamiento de choferes en tramos simultáneos | ⬜ Sí / ❌ No | Ver Regla de Negocio RN-03 |
| 6 | El borrado lógico (soft delete) usa campo `deleted_at` y no elimina filas | ⬜ Sí / ❌ No | Ver Regla de Negocio RN-08 |
| 7 | El borrado de un viaje se propaga en cascada a tramos y gastos | ⬜ Sí / ❌ No | Ver Regla de Negocio RN-08 |
| 8 | Todo tramo tiene obligatoriamente un chofer asignado | ⬜ Sí / ❌ No | Ver Regla de Negocio RN-07 |
| 9 | Los estados de camión (`activo`, `inactivo`, `taller`, `vendido`) son los únicos válidos | ⬜ Sí / ❌ No | Ver RF-04 |
| 10 | Los estados de lote son los 7 definidos en el requisito | ⬜ Sí / ❌ No | Ver RF-06 |

**Resultado Checklist-02:** ___/10 controles cumplidos

---

## CHECKLIST-03: Auditoría y Trazabilidad

| # | Control | ¿Cumple? | Observaciones |
|---|---|---|---|
| 1 | Cualquier CREATE en tabla `viajes` genera registro en bitácora detallada | ⬜ Sí / ❌ No | Ver RF-11 |
| 2 | Cualquier UPDATE en tabla `viajes` registra `datos_antes` y `datos_despues` en JSONB | ⬜ Sí / ❌ No | Ver RF-11 |
| 3 | Cualquier DELETE en tabla `viajes` genera registro en bitácora | ⬜ Sí / ❌ No | Ver RF-11 |
| 4 | Cada registro de auditoría incluye ID de usuario ejecutor | ⬜ Sí / ❌ No | Ver RF-11 |
| 5 | Cada registro de auditoría incluye dirección IP y User Agent | ⬜ Sí / ❌ No | Ver RF-11 |
| 6 | Los logins fallidos almacenan el email intentado, IP y motivo del fallo | ⬜ Sí / ❌ No | Ver RF-11 |

**Resultado Checklist-03:** ___/6 controles cumplidos

---

## CHECKLIST-04: Disponibilidad y Respaldos

| # | Control | ¿Cumple? | Observaciones |
|---|---|---|---|
| 1 | El administrador puede generar backups desde la interfaz gráfica | ⬜ Sí / ❌ No | Ver RF-13 |
| 2 | Los backups son descargables en formato `.sql` o comprimido | ⬜ Sí / ❌ No | Ver RF-13 |
| 3 | El sistema permite configurar almacenamiento en Google Drive | ⬜ Sí / ❌ No | Ver RF-13 |
| 4 | El sistema tiene tiempo de respuesta < 3 segundos en consultas principales | ⬜ Sí / ❌ No | Ver RNF-02 |

**Resultado Checklist-04:** ___/4 controles cumplidos

---

## CHECKLIST-05: Usabilidad y Experiencia de Usuario

| # | Control | ¿Cumple? | Observaciones |
|---|---|---|---|
| 1 | La interfaz es responsiva (se adapta a distintas resoluciones) | ⬜ Sí / ❌ No | Ver RNF-01 |
| 2 | La paleta de colores usa tonos azules y naranja (corporativa) | ⬜ Sí / ❌ No | Ver RNF-01 |
| 3 | La fuente utilizada es Inter (o similar moderna) | ⬜ Sí / ❌ No | Ver RNF-01 |
| 4 | Las operaciones usan modales y AJAX (sin recarga completa de página) | ⬜ Sí / ❌ No | Ver RNF-01 |
| 5 | Los iconos utilizados son Bootstrap Icons | ⬜ Sí / ❌ No | Ver RNF-01 |

**Resultado Checklist-05:** ___/5 controles cumplidos

---

## MATRIZ DE CUMPLIMIENTO ISO — Trazabilidad Completa

> **Formato:** Requisito → Evidencia de cumplimiento → Responsable de verificación

| ID Requisito | Descripción | Evidencia | Responsable | Estado |
|---|---|---|---|---|
| RF-01 | Autenticación con email/contraseña BCrypt | CP-01, CP-02, CP-03 + CHECKLIST-01 ítem 1,2,3 | QA Tester 1 | ⬜ Pendiente |
| RF-02 | Gestión de usuarios con datos completos y relación 1:1 | CP-04 + verificación en BD | QA Tester 1 | ⬜ Pendiente |
| RF-03 | Registro de camiones con unicidad de placa y código | CP-05 + verificación visual | QA Tester 1 | ⬜ Pendiente |
| RF-04 | Estados de camión (activo/inactivo/taller/vendido) | CHECKLIST-02 ítem 9 + prueba visual | QA Tester 1 | ⬜ Pendiente |
| RF-05 | Gestión de clientes con datos requeridos | Prueba exploratoria + verificación BD | QA Tester 1 | ⬜ Pendiente |
| RF-06 | Lotes de carga con 7 estados definidos | CHECKLIST-02 ítem 10 + CP-09 | QA Tester 2 | ⬜ Pendiente |
| RF-07 | Viajes con tramos, solapamientos y nombre único | CP-06, CP-07 + CHECKLIST-02 | QA Tester 2 | ⬜ Pendiente |
| RF-08 | Estados de tramo (6 tipos) | Verificación en UI durante CP-07 | QA Tester 2 | ⬜ Pendiente |
| RF-09 | Gastos clasificados en 3 tipos con campos obligatorios | CP-08 + verificación en BD | QA Tester 2 | ⬜ Pendiente |
| RF-10 | Incidencias de lotes con tipos y evidencia | CP-09 + verificación en BD | QA Tester 2 | ⬜ Pendiente |
| RF-11 | Bitácora de sesión, logins fallidos y CDC | CP-13 + CHECKLIST-03 completo | QA Lead | ⬜ Pendiente |
| RF-12 | Dashboard con KPIs y gráficas interactivas | CP-11 + revisión visual | QA Tester 1 | ⬜ Pendiente |
| RF-13 | Backups generables y descargables | CP-10 + CHECKLIST-04 | QA Lead | ⬜ Pendiente |
| RNF-01 | Interfaz responsiva y moderna | CHECKLIST-05 completo | QA Lead | ⬜ Pendiente |
| RNF-02 | Tiempo respuesta < 3 seg. | CHECKLIST-04 ítem 4 + medición real | QA Lead | ⬜ Pendiente |
| RNF-03 | Seguridad: BCrypt, sin SQL injection | CHECKLIST-01 ítem 1,5 + CP-12 | QA Lead | ⬜ Pendiente |
| RNF-04 | Disponibilidad 99% | Observación de uptime durante pruebas | QA Lead | ⬜ Pendiente |
| RN-01 | ROLE_USER sin acceso a módulos de admin | CP-12 | QA Tester 2 | ⬜ Pendiente |
| RN-02 | No solapamiento de camiones | CP-07 | QA Tester 2 | ⬜ Pendiente |
| RN-03 | No solapamiento de choferes | CHECKLIST-02 ítem 5 | QA Tester 2 | ⬜ Pendiente |
| RN-04 | No dos tramos del mismo tipo por viaje | CHECKLIST-02 ítem 2 | QA Tester 2 | ⬜ Pendiente |
| RN-05 | Fecha salida < fecha llegada en tramo | CHECKLIST-02 ítem 3 | QA Tester 2 | ⬜ Pendiente |
| RN-06 | Nombre viaje único, 3-100 chars | CP-06 | QA Tester 2 | ⬜ Pendiente |
| RN-07 | Tramo requiere chofer obligatoriamente | CHECKLIST-02 ítem 8 | QA Tester 2 | ⬜ Pendiente |
| RN-08 | Soft delete con `deleted_at`, cascada en viaje | CHECKLIST-02 ítem 6,7 | QA Lead | ⬜ Pendiente |
| RN-09 | Auditoría detallada ante CREATE/UPDATE/DELETE en viajes | CP-13 + CHECKLIST-03 | QA Lead | ⬜ Pendiente |

---

## Resumen de Cumplimiento por Sección

| Sección | Total Controles | Cumplidos | % |
|---|---|---|---|
| CHECKLIST-01 Seguridad | 10 | [COMPLETAR] | — |
| CHECKLIST-02 Integridad | 10 | [COMPLETAR] | — |
| CHECKLIST-03 Auditoría | 6 | [COMPLETAR] | — |
| CHECKLIST-04 Disponibilidad | 4 | [COMPLETAR] | — |
| CHECKLIST-05 Usabilidad | 5 | [COMPLETAR] | — |
| **TOTAL** | **35** | **[COMPLETAR]** | **—** |
