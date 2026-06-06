# Casos de Prueba — GestorCamiones V2

> **Mínimo requerido:** 10 casos de prueba con criterios de aceptación rigurosos y registro de defectos.
> **Total documentado:** 13 casos de prueba (RF-01 a RF-13).

---

## Registro de Defectos

| ID Defecto | ID Caso | Descripción | Severidad | Estado | Fecha |
|---|---|---|---|---|---|
| — | — | _Sin defectos registrados aún_ | — | — | — |

---

## CP-01 — Inicio de sesión con credenciales válidas (RF-01)

| Campo | Detalle |
|---|---|
| **ID** | CP-01 |
| **Requisito** | RF-01 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional positivo |
| **Precondición** | Existe usuario `soporte@demo.local` con contraseña `123` y cuenta habilitada. |
| **Pasos** | 1. Navegar a `http://localhost:8080/login`. 2. Ingresar email `soporte@demo.local` y contraseña `123`. 3. Hacer clic en "Iniciar sesión". |
| **Criterio de aceptación** | El sistema redirige al Dashboard principal (`/`) y muestra el nombre del usuario en el navbar. |
| **Resultado esperado** | Acceso concedido. Redirección exitosa al Dashboard. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-02 — Inicio de sesión con contraseña incorrecta (RF-01)

| Campo | Detalle |
|---|---|
| **ID** | CP-02 |
| **Requisito** | RF-01 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional negativo |
| **Precondición** | Existe usuario `soporte@demo.local` con cuenta habilitada. |
| **Pasos** | 1. Navegar a `http://localhost:8080/login`. 2. Ingresar email `soporte@demo.local` y contraseña `incorrecta`. 3. Hacer clic en "Iniciar sesión". |
| **Criterio de aceptación** | El sistema muestra un mensaje de error de credenciales inválidas. No redirige al Dashboard. El intento queda registrado en la bitácora de logins fallidos. |
| **Resultado esperado** | Acceso denegado. Mensaje de error visible. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-03 — Inicio de sesión con cuenta bloqueada (RF-01)

| Campo | Detalle |
|---|---|
| **ID** | CP-03 |
| **Requisito** | RF-01 |
| **Módulo** | Autenticación |
| **Tipo** | Funcional negativo |
| **Precondición** | Existe un usuario con cuenta en estado `bloqueado`. |
| **Pasos** | 1. Navegar a `http://localhost:8080/login`. 2. Ingresar las credenciales del usuario bloqueado. 3. Hacer clic en "Iniciar sesión". |
| **Criterio de aceptación** | El sistema deniega el acceso con un mensaje indicando que la cuenta está bloqueada. |
| **Resultado esperado** | Acceso denegado. Mensaje de cuenta bloqueada. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-04 — Creación de usuario por administrador (RF-02)

| Campo | Detalle |
|---|---|
| **ID** | CP-04 |
| **Requisito** | RF-02 |
| **Módulo** | Gestión de Usuarios |
| **Tipo** | Funcional positivo |
| **Precondición** | Sesión iniciada como ROLE_ADMIN. |
| **Pasos** | 1. Navegar al módulo de Usuarios. 2. Hacer clic en "Nuevo usuario". 3. Completar todos los campos obligatorios (nombre, apellido, teléfono, DUI, email, rol). 4. Guardar. |
| **Criterio de aceptación** | El nuevo usuario aparece en el listado. Se crea automáticamente un registro de credenciales asociado (relación 1:1). La contraseña queda almacenada con BCrypt. |
| **Resultado esperado** | Usuario creado y visible en el sistema. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-05 — Registro de camión con placa duplicada (RF-03)

| Campo | Detalle |
|---|---|
| **ID** | CP-05 |
| **Requisito** | RF-03 |
| **Módulo** | Gestión de Camiones |
| **Tipo** | Funcional negativo |
| **Precondición** | Existe un camión registrado con placa `ABC-123`. Sesión como ROLE_ADMIN. |
| **Pasos** | 1. Ir al módulo de Camiones. 2. Crear un nuevo camión con placa `ABC-123`. 3. Intentar guardar. |
| **Criterio de aceptación** | El sistema rechaza el registro y muestra un mensaje de error indicando que la placa ya existe. |
| **Resultado esperado** | Registro rechazado. Error de unicidad mostrado. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-06 — Creación de viaje con nombre duplicado (RF-07, Regla de Negocio)

| Campo | Detalle |
|---|---|
| **ID** | CP-06 |
| **Requisito** | RF-07 |
| **Módulo** | Gestión de Viajes |
| **Tipo** | Funcional negativo |
| **Precondición** | Existe un viaje con nombre `Ruta Centroamérica 01`. Sesión como ROLE_ADMIN. |
| **Pasos** | 1. Ir al módulo de Viajes. 2. Crear un nuevo viaje con nombre `Ruta Centroamérica 01`. 3. Intentar guardar. |
| **Criterio de aceptación** | El sistema rechaza el viaje y muestra un mensaje de nombre duplicado. |
| **Resultado esperado** | Registro rechazado. Error visible. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-07 — Solapamiento de camión en tramos simultáneos (RF-07, Regla de Negocio)

| Campo | Detalle |
|---|---|
| **ID** | CP-07 |
| **Requisito** | RF-07 |
| **Módulo** | Gestión de Viajes / Tramos |
| **Tipo** | Funcional negativo |
| **Precondición** | Camión `TRK-001` ya asignado en tramo activo del 01/07/2026 al 10/07/2026. |
| **Pasos** | 1. Crear un nuevo viaje con un tramo que asigne `TRK-001` del 05/07/2026 al 12/07/2026. 2. Intentar guardar. |
| **Criterio de aceptación** | El sistema detecta el solapamiento y rechaza el tramo con mensaje explicativo. |
| **Resultado esperado** | Tramo rechazado. Error de solapamiento mostrado. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-08 — Registro de gasto de viaje (RF-09)

| Campo | Detalle |
|---|---|
| **ID** | CP-08 |
| **Requisito** | RF-09 |
| **Módulo** | Gestión de Gastos |
| **Tipo** | Funcional positivo |
| **Precondición** | Existe un viaje activo. Sesión como ROLE_ADMIN. |
| **Pasos** | 1. Ir al módulo de Gastos. 2. Seleccionar tipo "Gasto de Viaje". 3. Completar monto, descripción, fecha y URL de evidencia. 4. Guardar. |
| **Criterio de aceptación** | El gasto queda registrado y aparece en el reporte del viaje seleccionado. El administrador ejecutor queda registrado en el gasto. |
| **Resultado esperado** | Gasto creado y asociado al viaje. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-09 — Registro de incidencia sobre un lote (RF-10)

| Campo | Detalle |
|---|---|
| **ID** | CP-09 |
| **Requisito** | RF-10 |
| **Módulo** | Control de Incidencias |
| **Tipo** | Funcional positivo |
| **Precondición** | Existe un lote `en_transito` dentro de un tramo activo. Sesión como ROLE_ADMIN. |
| **Pasos** | 1. Ir al módulo de Incidencias. 2. Seleccionar el lote afectado. 3. Indicar tipo `daño_parcial`, descripción, fecha y URL de evidencia fotográfica. 4. Guardar. |
| **Criterio de aceptación** | La incidencia queda registrada con `resuelto = false`. El estado del lote puede actualizarse a `dañado`. |
| **Resultado esperado** | Incidencia registrada y visible. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-10 — Generación de backup desde la interfaz (RF-13)

| Campo | Detalle |
|---|---|
| **ID** | CP-10 |
| **Requisito** | RF-13 |
| **Módulo** | Copias de Seguridad |
| **Tipo** | Funcional positivo |
| **Precondición** | Sesión activa como ROLE_ADMIN. PostgreSQL en ejecución. |
| **Pasos** | 1. Ir al módulo de Backups. 2. Hacer clic en "Generar Backup". 3. Esperar la generación. 4. Descargar el archivo `.sql`. |
| **Criterio de aceptación** | Se genera un archivo `.sql` descargable. El archivo tiene contenido válido de PostgreSQL. |
| **Resultado esperado** | Backup generado y descargado correctamente. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-11 — Dashboard muestra KPIs correctamente (RF-12)

| Campo | Detalle |
|---|---|
| **ID** | CP-11 |
| **Requisito** | RF-12 |
| **Módulo** | Dashboard / Reportes |
| **Tipo** | Funcional positivo |
| **Precondición** | Existen viajes y gastos registrados en el mes actual. Sesión iniciada. |
| **Pasos** | 1. Ingresar al Dashboard (`/`). 2. Seleccionar el año y mes actual. 3. Observar los KPIs y gráficas. |
| **Criterio de aceptación** | Los KPIs muestran: total de viajes del mes, ingresos, gastos desglosados y balance neto. Las gráficas de barras, líneas y dona se renderizan correctamente. |
| **Resultado esperado** | Dashboard interactivo con datos reales y gráficas visibles. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-12 — Control de acceso ROLE_USER (RF-01, RF-02, Regla de Acceso Operativo)

| Campo | Detalle |
|---|---|
| **ID** | CP-12 |
| **Requisito** | RF-01, Sección 2.2 |
| **Módulo** | Seguridad / Control de Acceso |
| **Tipo** | Seguridad |
| **Precondición** | Existe usuario con rol ROLE_USER activo con credenciales válidas. |
| **Pasos** | 1. Iniciar sesión con el usuario ROLE_USER. 2. Intentar acceder a `/api/camiones`, `/api/usuarios`, `/api/viajes` directamente desde el navegador. |
| **Criterio de aceptación** | El sistema retorna HTTP 403 (Forbidden) o redirige al login para todas las rutas restringidas. El usuario sólo puede ver el Dashboard. |
| **Resultado esperado** | Acceso denegado a rutas de administrador. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## CP-13 — Bitácora registra cambio de datos en viajes (RF-11)

| Campo | Detalle |
|---|---|
| **ID** | CP-13 |
| **Requisito** | RF-11 |
| **Módulo** | Bitácora de Auditoría |
| **Tipo** | Funcional positivo |
| **Precondición** | Existe un viaje. Sesión como ROLE_ADMIN. |
| **Pasos** | 1. Editar el nombre de un viaje existente. 2. Guardar el cambio. 3. Navegar al módulo de Auditoría Detallada. |
| **Criterio de aceptación** | Se registra una entrada de tipo `UPDATE` en la bitácora que incluye: tabla `viajes`, ID del registro, usuario ejecutor, IP, User Agent, `datos_antes` y `datos_despues` en formato JSON. |
| **Resultado esperado** | Registro de auditoría detallado y completo. |
| **Resultado obtenido** | [COMPLETAR] |
| **Estado** | ⬜ Pendiente / ✅ Aprobado / ❌ Fallido |
| **Defecto asociado** | — |

---

## Resumen de Ejecución

| Estado | Cantidad |
|---|---|
| ⬜ Pendiente | 13 |
| ✅ Aprobado | 0 |
| ❌ Fallido | 0 |
| **Total** | **13** |
