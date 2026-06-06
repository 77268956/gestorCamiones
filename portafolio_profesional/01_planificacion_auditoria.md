# Planificación de Auditoría — GestorCamiones V2

## Alcance de la Auditoría

La auditoría cubre el sistema **GestorCamiones V2**, una aplicación web desarrollada con Java 17 + Spring Boot, Spring Security, Spring Data JPA, Thymeleaf y PostgreSQL. Se auditarán los módulos funcionales definidos en `requisitos_sistema.md`, específicamente:

| Módulo auditado | Código RF |
|---|---|
| Autenticación y seguridad | RF-01 |
| Gestión de usuarios y empleados | RF-02 |
| Gestión de camiones y estados | RF-03, RF-04 |
| Gestión de clientes | RF-05 |
| Gestión de lotes de carga | RF-06 |
| Gestión de viajes y tramos | RF-07, RF-08 |
| Gestión de gastos | RF-09 |
| Control de incidencias | RF-10 |
| Bitácora de auditoría | RF-11 |
| Reportes y Dashboard | RF-12 |
| Copias de seguridad | RF-13 |

**Fuera del alcance:** infraestructura de red, servidores físicos, integraciones externas no documentadas.

---

## Rúbricas de Evaluación

Cada requisito funcional se evalúa con la siguiente rúbrica:

| Criterio | Peso | Descripción |
|---|---|---|
| Completitud funcional | 30% | El módulo implementa todos los sub-requisitos del RF. |
| Corrección del comportamiento | 25% | Las operaciones producen resultados esperados según reglas de negocio. |
| Seguridad y control de acceso | 20% | Sólo los roles autorizados pueden ejecutar la acción. |
| Manejo de errores y validaciones | 15% | El sistema responde de forma controlada ante entradas inválidas. |
| Usabilidad e interfaz | 10% | La pantalla es intuitiva, responsiva y cumple RNF-01. |

**Escala de calificación por criterio:**

| Puntuación | Significado |
|---|---|
| 4 — Excelente | Cumple completamente sin observaciones. |
| 3 — Satisfactorio | Cumple con observaciones menores. |
| 2 — Parcial | Cumple parcialmente; requiere corrección. |
| 1 — Deficiente | No cumple el criterio; corrección urgente. |
| 0 — No aplica / No implementado | El requisito no fue desarrollado. |

---

## Cronograma de Auditoría

| Semana | Fechas | Actividad | Responsable |
|---|---|---|---|
| 1 | [FECHA INICIO] – [FECHA FIN] | Revisión de documentación y alcance | Equipo auditor |
| 1 | [FECHA INICIO] – [FECHA FIN] | Preparación del entorno de pruebas | QA Lead |
| 2 | [FECHA INICIO] – [FECHA FIN] | Diseño y escritura de casos de prueba (RF-01 a RF-06) | QA Tester |
| 2 | [FECHA INICIO] – [FECHA FIN] | Diseño y escritura de casos de prueba (RF-07 a RF-13) | QA Tester |
| 3 | [FECHA INICIO] – [FECHA FIN] | Ejecución de casos de prueba — Módulo Auth y Usuarios | QA Tester |
| 3 | [FECHA INICIO] – [FECHA FIN] | Ejecución de casos de prueba — Módulo Camiones y Clientes | QA Tester |
| 3 | [FECHA INICIO] – [FECHA FIN] | Ejecución de casos de prueba — Módulo Viajes y Gastos | QA Tester |
| 4 | [FECHA INICIO] – [FECHA FIN] | Ejecución de casos de prueba — Dashboard, Reportes, Backups | QA Tester |
| 4 | [FECHA INICIO] – [FECHA FIN] | Registro de defectos encontrados y retesting | QA Lead |
| 4 | [FECHA INICIO] – [FECHA FIN] | Elaboración del Reporte Integrador Final | Equipo auditor |
| 5 | [FECHA INICIO] – [FECHA FIN] | Presentación de resultados y cierre de auditoría | Equipo auditor |

> **Nota**: Reemplaza `[FECHA INICIO]` y `[FECHA FIN]` con las fechas reales del proyecto.

---

## Equipo Auditor

| Rol | Nombre | Responsabilidad |
|---|---|---|
| QA Lead | [NOMBRE] | Coordinación, revisión final, presentación |
| QA Tester 1 | [NOMBRE] | Diseño y ejecución de casos RF-01 a RF-06 |
| QA Tester 2 | [NOMBRE] | Diseño y ejecución de casos RF-07 a RF-13 |
| Desarrollador (soporte) | [NOMBRE] | Apoyo técnico durante la ejecución |

---

## Herramientas Utilizadas

- **Gestión de pruebas**: Este portafolio (Markdown / Excel)
- **Entorno de prueba**: `http://localhost:8080`
- **Base de datos**: PostgreSQL (acceso directo para verificación de datos)
- **Documentación base**: `requisitos_sistema.md`
- **Control de versiones**: Git / GitHub
