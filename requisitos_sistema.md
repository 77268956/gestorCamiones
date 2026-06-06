# Documento de Requisitos del Sistema de Transporte de Carga Pesada (V2)

## 1. Introducción

### 1.1 Propósito
El presente documento describe detalladamente los requisitos funcionales y no funcionales del Sistema de Gestión de Transporte de Carga Pesada. Este sistema permite administrar camiones, viajes (y sus tramos), lotes de carga, clientes, gastos y auditorías de seguridad, garantizando una correcta operación, monitoreo de la flota y control de accesos mediante roles definidos.

### 1.2 Alcance
El sistema cubre las siguientes áreas operativas y técnicas:
*   **Autenticación y Seguridad**: Control de accesos basado en roles (`ROLE_ADMIN` y `ROLE_USER`) y control de estado de cuentas.
*   **Gestión de Usuarios y Empleados**: Registro de información de trabajadores y control de su estado laboral.
*   **Administración de Camiones**: Registro de flota y control de disponibilidad técnica.
*   **Gestión de Clientes y Lotes de Carga**: Registro de clientes y asignación de lotes de mercancía categorizados.
*   **Gestión de Viajes y Tramos**: Planificación de viajes desglosados en tramos (ida y vuelta) con asignación de chofer y camión.
*   **Gestión de Gastos**: Registro clasificado de gastos generales, gastos de camiones y gastos de viajes.
*   **Control de Incidencias**: Registro y seguimiento de incidencias ocurridas a los lotes durante el trayecto.
*   **Monitoreo y Reportes**: Dashboard interactivo con indicadores financieros y operativos clave (KPIs), gráficas de rendimiento anual y reportes mensuales detallados.
*   **Bitácora de Auditoría**: Monitoreo de inicios de sesión, intentos fallidos y cambios a nivel de datos (CREATE, UPDATE, DELETE).
*   **Copias de Seguridad (Backups)**: Respaldos automáticos y manuales de la base de datos PostgreSQL.

### 1.3 Definiciones y Abreviaturas
*   **Camión**: Vehículo de carga pesada registrado para realizar operaciones.
*   **Chofer / Conductor**: Trabajador encargado de la conducción física del camión en un tramo del viaje.
*   **Viaje**: Operación de transporte global identificada por un nombre único, que agrupa tramos de ruta y lotes de carga.
*   **Tramo (Detalle de Viaje)**: Segmento específico de un viaje (ej: "ida" o "vuelta") en el que se asignan un camión y un chofer concretos, y se definen las fechas y ubicaciones de salida y destino.
*   **Lote**: Unidad de carga física que se transporta dentro del viaje. Está asociado a clientes (remitente y destinatario) y posee su propio estado.
*   **Cliente**: Entidad (persona o empresa) que solicita el envío de mercancía (Remitente) o la recibe (Destinatario).
*   **Incidencia**: Evento imprevisto o daño registrado sobre un lote de mercancía durante un tramo.
*   **Gasto**: Egreso financiero registrado en el sistema. Puede ser General (oficina, administración), de Camión (mantenimiento, repuestos) o de Viaje (combustible, peajes, viáticos).
*   **Auditoría**: Bitácora de seguridad que registra eventos del sistema y cambios detallados en la base de datos (con valores antes/después).
*   **IVA**: Impuesto al Valor Agregado (indicador booleano aplicado a la facturación de un tramo de viaje).
*   **Administrador**: Usuario del sistema con rol `ROLE_ADMIN`, que posee control total del aplicativo.
*   **Trabajador (Chofer)**: Usuario del sistema con rol `ROLE_USER` y estado "activo", asignado a la conducción.

---

## 2. Descripción General del Sistema

### 2.1 Visión General
El sistema centraliza la gestión operativa e ingresos/gastos de una empresa de transporte. A diferencia de versiones anteriores, el viaje no se asocia directamente a un cliente único, sino que los clientes se vinculan a través de los **Lotes** transportados, permitiendo consolidar carga de diferentes clientes en un mismo viaje. Asimismo, el viaje se divide en **Tramos** (ida y vuelta), permitiendo cambiar de camión o chofer en el recorrido para optimizar la logística.

### 2.2 Roles y Matriz de Accesos del Sistema
El sistema implementa dos roles principales mediante Spring Security:

1.  **Administrador (`ROLE_ADMIN`)**:
    *   Gestiona usuarios, cuentas de inicio de sesión y roles.
    *   Registra y modifica la flota de camiones.
    *   Crea, modifica y elimina viajes, tramos y asignaciones.
    *   Gestiona clientes, categorías y lotes de carga.
    *   Registra y categoriza gastos generales, de camiones y de viajes.
    *   Visualiza e interpreta reportes financieros, operativos y de auditoría detallada.
    *   Realiza y descarga copias de seguridad (Backups) del sistema.
2.  **Trabajador / Chofer (`ROLE_USER`)**:
    *   Puede iniciar sesión en la plataforma.
    *   Tiene acceso al **Dashboard** principal para visualizar el resumen financiero y operativo global (KPIs y gráficas de la organización).
    *   *Nota técnica*: En la versión actual del sistema (V2), los trabajadores no disponen de módulos específicos para modificar o ver detalles de viajes individuales, estando el acceso a las APIs `/api/viajes/**`, `/api/camiones/**`, `/api/usuarios/**`, `/api/clientes/**` y `/api/lotes/**` restringido únicamente al Administrador.

---

## 3. Requisitos Funcionales

### RF-01. Autenticación de Usuarios
*   El sistema debe permitir el inicio de sesión mediante el correo electrónico (email) y contraseña.
*   Las contraseñas deben almacenarse encriptadas en la base de datos utilizando el algoritmo BCrypt.
*   El acceso a las rutas del sistema y APIs REST debe estar protegido mediante Spring Security según el rol asignado (`ROLE_ADMIN` o `ROLE_USER`).
*   El sistema debe manejar estados de la cuenta de acceso (`habilitado`, `bloqueado`). Si la cuenta está bloqueada, se debe impedir el login.

### RF-02. Gestión de Usuarios y Empleados
*   El administrador debe poder crear, editar, desactivar y realizar borrado lógico (soft delete) de usuarios.
*   Cada usuario debe contar con los siguientes datos: nombre, apellido, teléfono, DUI (Documento Único de Identidad), correo electrónico, URL de fotografía, estado del empleado (`activo`, `suspendido`, `baja`) y rol asociado.
*   El sistema debe asociar un registro de credenciales (usuario, email, password, estado de cuenta) a cada usuario del sistema mediante una relación 1:1.

### RF-03. Gestión de Camiones
*   El administrador debe poder registrar, modificar y realizar borrado lógico de camiones.
*   Cada camión debe registrar: placa (única), nombre descriptivo, código interno (único), modelo, precio de compra, URL de fotografía y estado.

### RF-04. Estados del Camión
El sistema debe manejar los siguientes estados técnicos para los camiones:
*   `activo`: Disponible para ser programado en viajes.
*   `inactivo`: No disponible para operar de forma temporal.
*   `taller`: En mantenimiento correctivo o preventivo.
*   `vendido`: Retirado definitivamente de la flota.

### RF-05. Gestión de Clientes
*   El administrador debe poder registrar, modificar y realizar borrado lógico de clientes.
*   Cada cliente debe contener: nombre, teléfono, dirección física, DUI/NIT y correo electrónico.

### RF-06. Gestión de Lotes de Carga
*   El administrador debe poder registrar, modificar y eliminar lotes de carga.
*   Cada lote de carga debe contener: número de lote (único), peso (en kg/ton), descripción de la carga, valor declarado (monetario), nombre del encargado de bodega, categoría de carga, cliente remitente y cliente destinatario.
*   El sistema debe manejar los siguientes estados de lote:
    *   `en_bodega`: Recibido en almacén.
    *   `en_transito`: Cargado en un viaje en curso.
    *   `entregado`: Recibido con éxito en destino.
    *   `dañado`: Mercancía con desperfectos.
    *   `perdido`: Lote no localizado.
    *   `devuelto`: Retornado al remitente.
    *   `cancelado`: Envío cancelado.

### RF-07. Gestión de Viajes y Tramos (V2)
*   El administrador debe poder registrar, modificar, consultar y eliminar viajes.
*   Cada viaje se registra con un nombre único y se asocia al administrador que lo creó.
*   El viaje debe dividirse obligatoriamente en tramos operativos de tipo `ida` (salida) o `vuelta` (retorno).
*   Cada tramo (viaje_detalle) debe registrar de manera obligatoria:
    *   Camión asignado.
    *   Chofer/conductor asignado.
    *   País de salida y País de destino (valores permitidos: El Salvador, Guatemala, Honduras, Nicaragua, Costa Rica, Panamá, México).
    *   Dirección exacta de salida y de destino.
    *   Fecha y hora de salida y de llegada estimada/real.
    *   Indicadores de facturación: `pagado` (booleano) e `iva` (booleano).
    *   Observaciones opcionales del tramo.
*   Un viaje se asocia de forma N:M (muchos a muchos) con los lotes de carga mediante la tabla intermedia `viaje_lote`.

### RF-08. Estados del Viaje (Tramos)
El sistema maneja los estados de viaje de forma individual por tramo. Los estados disponibles son:
*   `cargando`: El camión está siendo cargado en el punto de salida.
*   `en camino`: El vehículo se encuentra en tránsito en carretera.
*   `descargando`: El camión ha llegado al destino y se está vaciando la carga.
*   `con fallas`: El tramo presenta un problema de fuerza mayor (mecánico, accidente, aduana).
*   `cancelado`: Se suspendió la ruta del tramo.
*   `completado`: El tramo finalizó su trayecto satisfactoriamente.

### RF-09. Gestión de Gastos
El administrador debe poder registrar y consultar gastos, clasificándolos en tres tipos:
1.  **Gastos Generales**: Gastos administrativos no asociados a la flota de transporte (servicios públicos, alquiler de oficinas, papelería).
2.  **Gastos de Camión**: Gastos imputados directamente a la hoja de costo de un camión (repuestos, llantas, reparaciones en taller).
3.  **Gastos de Viaje**: Gastos incurridos durante la ejecución de un tramo de viaje específico (combustible, peajes, viáticos del conductor).
*   Cada gasto debe registrar obligatoriamente: monto, descripción detallada, fecha del gasto, evidencia digital (URL de fotografía del recibo/factura) y el administrador que lo autorizó.

### RF-10. Control de Incidencias de Lotes
*   El sistema debe permitir registrar incidencias asociadas a un lote específico durante un tramo de viaje.
*   Cada incidencia debe contener: tipo de incidencia (`daño_parcial`, `daño_total`, `robo`, `perdida`, `demora`, `otro`), descripción detallada del suceso, fecha y hora de la incidencia, URL de la evidencia fotográfica, usuario que la reportó, y un indicador de resolución (`resuelto` booleano).

### RF-11. Bitácora de Auditoría de Seguridad
El sistema debe realizar un seguimiento de las actividades de seguridad y base de datos:
1.  **Auditoría de Sesión**: Registro de los accesos (inicios y cierres de sesión) indicando la fecha, el usuario y la acción realizada.
2.  **Auditoría de Logins Fallidos**: Registro de intentos de acceso inválidos para detectar ataques de fuerza bruta. Almacena: correo electrónico ingresado, fecha/hora, dirección IP, User Agent (navegador/dispositivo) y motivo del fallo.
3.  **Auditoría Detallada de Cambios (CDC)**: Captura automática ante cualquier operación de inserción, actualización o eliminación (CREATE, UPDATE, DELETE) en tablas críticas (ej. viajes). Almacena: tabla modificada, ID del registro, acción, usuario ejecutor (ID y nombre), fecha/hora, IP, User Agent, y la estructura de datos anterior (`datos_antes`) y posterior (`datos_despues`) en formato JSONB.

### RF-12. Reportes y Dashboard
*   El sistema debe presentar un **Dashboard principal** interactivo que cargue datos dinámicamente según el año y mes seleccionados, mostrando:
    *   KPI de total de viajes del mes.
    *   KPI de total de ingresos mensuales (suma de lotes pagados).
    *   KPIs de gastos mensuales (desglosados en viajes, generales y camiones).
    *   KPI de balance neto mensual (ingresos menos gastos).
    *   Gráfica de barras de Viajes por Mes (historial anual).
    *   Gráfica de líneas de Ingresos vs Gastos por Mes (historial financiero anual).
    *   Gráfica de dona con la distribución de viajes según su estado actual.
    *   Tabla comparativa detallada y barra de progreso financiera.
*   El sistema debe permitir generar **Reportes Mensuales** que listen detalladamente todos los viajes completados/activos del mes (con nombre, conductor, estado, fechas de salida y llegada, y estado de pago) así como el desglose exacto de los gastos por categoría.

### RF-13. Copias de Seguridad (Backups)
*   El administrador debe poder generar respaldos de la base de datos PostgreSQL desde la interfaz gráfica.
*   El sistema debe permitir configurar la carga y almacenamiento de los archivos de respaldo en una cuenta de Google Drive asociada.
*   El administrador debe poder descargar directamente los archivos de respaldo `.sql` o comprimidos.

---

## 4. Requisitos No Funcionales

### RNF-01. Usabilidad y Diseño
*   El sistema debe contar con una interfaz web moderna, intuitiva, limpia y responsiva.
*   Se implementa una paleta de colores corporativa basada en tonos azules y contrastes naranjas, fuentes modernas (Inter) e iconos intuitivos (Bootstrap Icons).
*   Las pantallas deben contar con ventanas modales y actualización de datos mediante AJAX/Fetch API para evitar la recarga innecesaria de la página y mejorar la experiencia de usuario.

### RNF-02. Rendimiento
*   El tiempo de respuesta del servidor para las consultas principales de búsqueda y listado debe ser menor a 3 segundos bajo condiciones de red normales.
*   Las consultas pesadas del dashboard y reportes deben estar optimizadas mediante índices en la base de datos (por ejemplo, en campos de fecha, estado, y deleted_at).

### RNF-03. Seguridad
*   Todas las contraseñas deben almacenarse encriptadas.
*   El sistema debe bloquear las sesiones inactivas tras un tiempo establecido y requerir reautenticación.
*   La base de datos debe ser protegida de inyecciones SQL utilizando frameworks de persistencia seguros (Spring Data JPA / Hibernate) y consultas nativas parametrizadas.

### RNF-04. Disponibilidad
*   El sistema debe estar disponible al menos el 99% del tiempo operativo del negocio de transporte (24/7).

---

## 5. Reglas de Negocio

*   **Regla de Acceso Operativo**: Un trabajador con rol `ROLE_USER` (chofer) no tiene acceso a las vistas de creación, edición o eliminación de camiones, usuarios, lotes, clientes o viajes.
*   **Regla de Solapamiento Temporal de Camiones**: Un camión no puede estar asignado a más de un tramo de viaje activo (`estado` diferente a `cancelado` y `completado`) cuyas fechas y horas de salida y llegada se traslapen con otro tramo registrado en el sistema.
*   **Regla de Solapamiento Temporal de Choferes**: Un conductor (chofer) no puede estar asignado a más de un tramo de viaje activo cuyas fechas de salida y llegada se traslapen con otro tramo.
*   **Regla de Restricción Técnica de Tramos**: No se permite agregar dos tramos del mismo tipo (por ejemplo, dos tramos de `ida` o dos de `vuelta`) dentro de un mismo viaje.
*   **Regla de Coherencia de Fechas**: En cualquier tramo de viaje, la fecha y hora de salida debe ser estrictamente anterior a la fecha y hora de llegada (entrada).
*   **Regla de Nombre de Viaje**: El nombre de cada viaje es obligatorio, único en el sistema, no puede contener espacios vacíos únicamente, y debe tener una longitud mínima de 3 caracteres y máxima de 100 caracteres.
*   **Regla de Obligatoriedad de Chofer**: Bajo la arquitectura V2, no es posible registrar un tramo de viaje sin asignar un conductor (`id_chofer` es un campo obligatorio no nulo en la base de datos).
*   **Regla de Borrado Lógico (Soft Delete)**: El borrado de registros de usuarios, camiones, clientes, tipos de gasto y viajes no elimina las filas de la base de datos. Se utiliza un campo `deleted_at` para indicar la fecha del borrado. Al eliminar un viaje, se realiza un borrado lógico en cascada sobre sus tramos y gastos asociados.
*   **Regla de Registro de Auditoría Detallada**: Cualquier acción de inserción, actualización o eliminación sobre la tabla de viajes debe registrar inmediatamente un reporte en la bitácora de auditoría detallada, conteniendo el estado exacto antes y después en formato JSON.
