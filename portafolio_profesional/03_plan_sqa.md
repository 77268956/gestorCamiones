# Plan SQA — GestorCamiones V2
## Software Quality Assurance Plan

---

## 1. Objetivo del Plan SQA

Garantizar que el sistema **GestorCamiones V2** cumpla con los requisitos funcionales, no funcionales y las reglas de negocio definidas en `requisitos_sistema.md`, mediante la aplicación sistemática de actividades de aseguramiento de la calidad del software.

---

## 2. Calendario de Actividades SQA

| ID Actividad | Actividad | Tipo | Semana | Responsable | Entregable |
|---|---|---|---|---|---|
| SQA-01 | Revisión del documento de requisitos (`requisitos_sistema.md`) | Revisión | 1 | QA Lead | Observaciones de requisitos |
| SQA-02 | Configuración y validación del entorno de pruebas | Infraestructura | 1 | QA Lead | Entorno listo en `localhost:8080` |
| SQA-03 | Diseño de casos de prueba RF-01 a RF-06 | Diseño | 2 | QA Tester 1 | `02_casos_de_prueba.md` (CP-01 a CP-06) |
| SQA-04 | Diseño de casos de prueba RF-07 a RF-13 | Diseño | 2 | QA Tester 2 | `02_casos_de_prueba.md` (CP-07 a CP-13) |
| SQA-05 | Revisión entre pares de casos de prueba | Revisión | 2 | QA Lead | Casos revisados y aprobados |
| SQA-06 | Ejecución: módulos Auth, Usuarios, Camiones | Ejecución | 3 | QA Tester 1 | Resultados CP-01 a CP-05 |
| SQA-07 | Ejecución: módulos Viajes, Tramos, Gastos | Ejecución | 3 | QA Tester 2 | Resultados CP-06 a CP-09 |
| SQA-08 | Ejecución: módulos Incidencias, Auditoría, Dashboard, Backups | Ejecución | 4 | QA Tester 1 | Resultados CP-10 a CP-13 |
| SQA-09 | Registro de defectos encontrados | Gestión de defectos | 3–4 | QA Tester | Registro en `02_casos_de_prueba.md` |
| SQA-10 | Re-testing de defectos corregidos | Re-testing | 4 | QA Tester | Estado actualizado en casos |
| SQA-11 | Auditoría de checklists de seguridad ISO | Auditoría | 4 | QA Lead | `04_checklists_matrices.md` |
| SQA-12 | Elaboración del Reporte Integrador Final | Reporte | 4–5 | Equipo completo | `05_reporte_integrador_final.md` |
| SQA-13 | Revisión y aprobación del reporte final | Revisión | 5 | QA Lead | Reporte aprobado |
| SQA-14 | Presentación de resultados al equipo de desarrollo | Cierre | 5 | QA Lead | Presentación |

---

## 3. Métricas de Calidad

### 3.1 Métricas de Pruebas

| Métrica | Fórmula | Meta |
|---|---|---|
| **Cobertura de requisitos** | (RF cubiertos por casos / Total RF) × 100 | ≥ 90% |
| **Tasa de aprobación de casos** | (Casos aprobados / Total casos) × 100 | ≥ 80% |
| **Densidad de defectos** | Defectos encontrados / Caso de prueba | < 0.3 |
| **Eficiencia de detección** | Defectos encontrados en prueba / Total defectos conocidos | ≥ 85% |
| **Tasa de re-apertura** | Defectos reabiertos / Defectos cerrados × 100 | < 10% |

### 3.2 Métricas de Proceso

| Métrica | Descripción | Frecuencia |
|---|---|---|
| Avance del cronograma | % de actividades completadas vs planificadas | Semanal |
| Casos ejecutados | Acumulado de CP ejecutados | Diario durante ejecución |
| Defectos abiertos | Número de defectos pendientes de corrección | Diario durante ejecución |
| Tiempo de resolución | Días entre reporte y cierre de un defecto | Por defecto |

---

## 4. Reportes SQA

| Reporte | Contenido | Periodicidad | Destinatarios |
|---|---|---|---|
| **Informe de avance semanal** | Actividades completadas, métricas actualizadas, riesgos | Semanal | Equipo completo |
| **Resumen de ejecución de pruebas** | Casos ejecutados, aprobados, fallidos, defectos abiertos/cerrados | Al finalizar ejecución | QA Lead, Desarrollador |
| **Reporte de defectos** | Lista detallada de defectos con severidad, estado y responsable | Continuo | Desarrollador |
| **Reporte Integrador Final** | Dictamen técnico completo con conclusiones y recomendaciones | Al final del ciclo | Todos los interesados |

---

## 5. Clasificación de Defectos

| Severidad | Descripción | Tiempo máximo de resolución |
|---|---|---|
| **Crítico** | El sistema falla o un requisito de seguridad no cumple | 24 horas |
| **Alto** | Funcionalidad principal no opera correctamente | 48 horas |
| **Medio** | Funcionalidad opera pero con comportamiento incorrecto | 72 horas |
| **Bajo** | Problemas de UI, textos, estética sin impacto funcional | Próxima iteración |

---

## 6. Matriz de Responsables

| Actividad | QA Lead | QA Tester 1 | QA Tester 2 | Desarrollador |
|---|---|---|---|---|
| Planificación y alcance | **R** | C | C | I |
| Diseño de casos de prueba | A | **R** | **R** | C |
| Revisión de casos | **R** | C | C | — |
| Ejecución de pruebas | A | **R** | **R** | I |
| Registro de defectos | A | **R** | **R** | I |
| Corrección de defectos | I | — | — | **R** |
| Re-testing | **R** | C | C | I |
| Checklists ISO | **R** | C | C | — |
| Reporte Final | **R** | C | C | I |
| Presentación | **R** | C | C | I |

> **R** = Responsable | **A** = Aprobador | **C** = Consultado | **I** = Informado

---

## 7. Criterios de Entrada y Salida de Pruebas

### Criterios de Entrada (para iniciar ejecución)
- Entorno de pruebas configurado y accesible en `localhost:8080`.
- Base de datos PostgreSQL en ejecución con datos de prueba cargados.
- Todos los casos de prueba diseñados y revisados.
- Al menos el 80% de los módulos implementados y estables.

### Criterios de Salida (para cerrar ciclo de pruebas)
- Al menos el 90% de los casos de prueba ejecutados.
- Todos los defectos de severidad Crítica y Alta resueltos y re-testeados.
- Tasa de aprobación de casos ≥ 80%.
- Reporte Integrador Final elaborado y aprobado.

---

## 8. Riesgos del Plan SQA

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Entorno inestable durante ejecución | Media | Alto | Mantener backup del entorno; pruebas en horarios estables |
| Requisitos incompletos o ambiguos | Media | Medio | Revisión anticipada con el desarrollador en Semana 1 |
| Tiempo insuficiente para re-testing | Baja | Medio | Priorizar defectos críticos; documentar abiertos |
| Cambios de código durante pruebas | Baja | Alto | Congelar el código durante la ejecución principal |
