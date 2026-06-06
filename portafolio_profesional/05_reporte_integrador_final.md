# Reporte Integrador Final — GestorCamiones V2
## Dictamen Técnico de Controles de Calidad y Recomendaciones

> **Estado del documento:** 🔴 Borrador — Completar tras la ejecución de pruebas
> **Elaborado por:** [NOMBRE DEL EQUIPO AUDITOR]
> **Fecha de elaboración:** [FECHA]
> **Sistema auditado:** GestorCamiones V2 — `http://localhost:8080`
> **Documento base:** `requisitos_sistema.md`

---

## 1. Resumen Ejecutivo

El presente dictamen técnico constituye el cierre formal del ciclo de aseguramiento de la calidad del sistema **GestorCamiones V2**. El sistema fue evaluado contra los **13 requisitos funcionales**, los **4 requisitos no funcionales** y las **9 reglas de negocio** definidas en la documentación oficial del proyecto.

| Indicador | Resultado |
|---|---|
| Total de casos de prueba diseñados | 13 |
| Total de casos ejecutados | [COMPLETAR] |
| Casos aprobados | [COMPLETAR] |
| Casos fallidos | [COMPLETAR] |
| Defectos encontrados | [COMPLETAR] |
| Defectos resueltos | [COMPLETAR] |
| Defectos abiertos al cierre | [COMPLETAR] |
| Cobertura de requisitos | [COMPLETAR]% |
| Tasa de aprobación general | [COMPLETAR]% |

**Dictamen General:** [COMPLETAR — Ej: "El sistema cumple satisfactoriamente con los requisitos funcionales principales. Se identificaron N defectos, de los cuales M han sido resueltos. Se emiten X recomendaciones de mejora."]

---

## 2. Alcance de la Auditoría

La evaluación cubrió los siguientes módulos del sistema:

| Módulo | RF Evaluado | Casos de Prueba |
|---|---|---|
| Autenticación | RF-01 | CP-01, CP-02, CP-03 |
| Gestión de Usuarios | RF-02 | CP-04 |
| Gestión de Camiones | RF-03, RF-04 | CP-05 |
| Gestión de Clientes | RF-05 | Exploratoria |
| Gestión de Lotes | RF-06 | CP-09 (parcial) |
| Gestión de Viajes y Tramos | RF-07, RF-08 | CP-06, CP-07 |
| Gestión de Gastos | RF-09 | CP-08 |
| Control de Incidencias | RF-10 | CP-09 |
| Bitácora de Auditoría | RF-11 | CP-13 |
| Dashboard y Reportes | RF-12 | CP-11 |
| Copias de Seguridad | RF-13 | CP-10 |
| Control de Acceso (ROLE_USER) | RF-01, Sección 2.2 | CP-12 |

---

## 3. Resultados por Módulo

### 3.1 Módulo de Autenticación (RF-01)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-01 Login válido | [COMPLETAR] | [COMPLETAR] |
| CP-02 Login contraseña incorrecta | [COMPLETAR] | [COMPLETAR] |
| CP-03 Login cuenta bloqueada | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.2 Módulo de Gestión de Usuarios (RF-02)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-04 Creación de usuario | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.3 Módulo de Gestión de Camiones (RF-03, RF-04)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-05 Placa duplicada | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.4 Módulo de Viajes y Tramos (RF-07, RF-08)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-06 Nombre duplicado | [COMPLETAR] | [COMPLETAR] |
| CP-07 Solapamiento de camión | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.5 Módulo de Gastos (RF-09)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-08 Registro de gasto de viaje | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.6 Módulo de Incidencias (RF-10)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-09 Registro de incidencia | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.7 Módulo de Bitácora de Auditoría (RF-11)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-13 Cambio de datos en viaje | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.8 Dashboard y Reportes (RF-12)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-11 KPIs y gráficas | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.9 Copias de Seguridad (RF-13)

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-10 Generación de backup | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

### 3.10 Control de Acceso por Roles

| Caso | Resultado | Observaciones |
|---|---|---|
| CP-12 ROLE_USER sin acceso a admin | [COMPLETAR] | [COMPLETAR] |

**Estado del módulo:** [✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Fallido]

---

## 4. Registro de Defectos Encontrados

> Trasladar aquí el registro completo de defectos del archivo `02_casos_de_prueba.md`.

| ID Defecto | Módulo | Descripción | Severidad | Estado | Resuelto por | Fecha cierre |
|---|---|---|---|---|---|---|
| — | — | _Sin defectos registrados_ | — | — | — | — |

---

## 5. Resultados de Checklists de Seguridad

| Checklist | Controles totales | Cumplidos | % Cumplimiento |
|---|---|---|---|
| CHECKLIST-01 Seguridad de Aplicación | 10 | [COMPLETAR] | [COMPLETAR]% |
| CHECKLIST-02 Integridad y Reglas de Negocio | 10 | [COMPLETAR] | [COMPLETAR]% |
| CHECKLIST-03 Auditoría y Trazabilidad | 6 | [COMPLETAR] | [COMPLETAR]% |
| CHECKLIST-04 Disponibilidad y Backups | 4 | [COMPLETAR] | [COMPLETAR]% |
| CHECKLIST-05 Usabilidad y UX | 5 | [COMPLETAR] | [COMPLETAR]% |
| **TOTAL** | **35** | **[COMPLETAR]** | **[COMPLETAR]%** |

---

## 6. Análisis de Métricas Finales

| Métrica | Meta | Resultado | ¿Cumple? |
|---|---|---|---|
| Cobertura de requisitos | ≥ 90% | [COMPLETAR]% | ⬜ |
| Tasa de aprobación de casos | ≥ 80% | [COMPLETAR]% | ⬜ |
| Densidad de defectos | < 0.3 | [COMPLETAR] | ⬜ |
| Tasa de re-apertura de defectos | < 10% | [COMPLETAR]% | ⬜ |
| Defectos Críticos abiertos al cierre | 0 | [COMPLETAR] | ⬜ |

---

## 7. Conclusiones Técnicas

> **Instrucción:** Completa esta sección con las conclusiones reales tras ejecutar las pruebas.

### 7.1 Fortalezas del Sistema

- [COMPLETAR — Ej: El módulo de autenticación cumple correctamente con BCrypt y control de cuentas bloqueadas.]
- [COMPLETAR]
- [COMPLETAR]

### 7.2 Áreas de Mejora Identificadas

- [COMPLETAR — Ej: Se detectó que el sistema no valida correctamente el solapamiento de fechas en tramos con el mismo chofer.]
- [COMPLETAR]
- [COMPLETAR]

### 7.3 Riesgos Residuales

- [COMPLETAR — Ej: X defecto de severidad Media permanece abierto por limitaciones de tiempo. Se recomienda priorizar en el próximo ciclo.]
- [COMPLETAR]

---

## 8. Recomendaciones

| # | Recomendación | Prioridad | Módulo afectado | Plazo sugerido |
|---|---|---|---|---|
| R-01 | [COMPLETAR] | Alta / Media / Baja | [COMPLETAR] | [COMPLETAR] |
| R-02 | [COMPLETAR] | Alta / Media / Baja | [COMPLETAR] | [COMPLETAR] |
| R-03 | [COMPLETAR] | Alta / Media / Baja | [COMPLETAR] | [COMPLETAR] |

---

## 9. Firmas y Aprobación

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| QA Lead | [NOMBRE] | [FIRMA / INICIALES] | [FECHA] |
| QA Tester 1 | [NOMBRE] | [FIRMA / INICIALES] | [FECHA] |
| QA Tester 2 | [NOMBRE] | [FIRMA / INICIALES] | [FECHA] |
| Desarrollador / Responsable del sistema | [NOMBRE] | [FIRMA / INICIALES] | [FECHA] |

---

## 10. Evidencia Fotográfica

> Inserta capturas de pantalla de los módulos evaluados, de los defectos encontrados, y de los checklists completados.

| Evidencia | Descripción |
|---|---|
| ![Captura 1 — Login] | Pantalla de autenticación durante CP-01 |
| ![Captura 2 — Dashboard] | Dashboard con KPIs cargados durante CP-11 |
| ![Captura 3 — Auditoría] | Registro en bitácora tras CP-13 |
| [AGREGAR MÁS CAPTURAS] | [DESCRIPCIÓN] |

---

*Documento generado como parte del Portafolio Profesional del proyecto GestorCamiones V2.*
*Referencia: `requisitos_sistema.md` | Portafolio: `/portafolio_profesional/`*
