document.addEventListener("DOMContentLoaded", () => {
    cargarSelect("/api/usuarios/estados", "filtroEstadoSelect");
    cargarSelect("/api/usuarios/estados", "estadoEmpleado");
});

async function cargarSelect(url, selectId) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al obtener datos");

        const data = await res.json();
        const select = document.getElementById(selectId);

        if (!select) return;

        data.forEach(valor => {
            const option = document.createElement("option");
            option.value = valor;
            option.textContent = valor.replace("_", " ");
            select.appendChild(option);
        });

    } catch (error) {
        console.error(`Error en ${selectId}:`, error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("🔍 Cargando roles...");

    fetch("/api/rol/estados")
        .then(response => {
            console.log("📡 Respuesta status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("✅ Datos CRUDOS recibidos:", JSON.stringify(data, null, 2));

            const select = document.getElementById("rol");
            if (!select) {
                console.error("❌ No se encontró el select");
                return;
            }

            select.innerHTML = '<option value="" disabled selected>Selecciona un rol</option>';

            if (!data || data.length === 0) {
                console.warn("⚠️ No hay roles");
                select.innerHTML += '<option value="" disabled>No hay roles</option>';
                return;
            }

            // Mostrar la estructura del primer elemento
            console.log("📋 PRIMER ROL - ESTRUCTURA COMPLETA:");
            const primerRol = data[0];

            // Mostrar todas las propiedades del objeto
            console.log("Propiedades disponibles:", Object.keys(primerRol));

            // Mostrar cada propiedad con su valor
            for (let propiedad in primerRol) {
                console.log(`  - ${propiedad}: ${primerRol[propiedad]} (${typeof primerRol[propiedad]})`);
            }

            // AHORA, basado en lo que vimos, seleccionar el campo correcto
            data.forEach((rol, index) => {
                console.log(`\n🔍 Rol ${index}:`, rol);

                // 🔴 IMPORTANTE: Basado en lo que muestre el log de arriba,
                // vamos a intentar con el nombre correcto

                // Intenta con diferentes nombres hasta encontrar el correcto
                let idRol = null;

                // Lista de posibles nombres - AJUSTA ESTO SEGÚN LO QUE Viste
                const posiblesNombres = ['id', 'idRol', 'rolId', 'id_rol', 'codigo', 'id_rol', 'pk_rol'];

                for (let nombre of posiblesNombres) {
                    if (rol[nombre] !== undefined) {
                        idRol = rol[nombre];
                        console.log(`✅ Encontrado ID en campo "${nombre}": ${idRol}`);
                        break;
                    }
                }

                if (idRol === null) {
                    console.warn("❌ No se encontró ID para:", rol);
                    return;
                }

                // Buscar el nombre del rol
                let nombreRol = rol.rol || rol.nombre || rol.descripcion || "Rol";

                const option = document.createElement("option");
                option.value = idRol;
                option.textContent = nombreRol.replace("ROLE_", "").replace(/_/g, " ");

                select.appendChild(option);
                console.log(`✅ Opción agregada: ${option.value} - ${option.textContent}`);
            });
        })
        .catch(error => {
            console.error("❌ Error:", error);
        });
});


// enviar datos al controller
document.getElementById("formAgregarUsuario")
    ?.addEventListener("submit", async e => {
        e.preventDefault();

        const get = id => document.getElementById(id)?.value?.trim();

        const nombre = get("nombre");
        const email = get("email");
        const password = get("password");
        const rolId = parseInt(get("rol"), 10);

        if (!nombre || !email || !password || isNaN(rolId)) {
            return alert("Completa los campos requeridos correctamente");
        }

        const data = {
            nombre,
            apellido: get("apellido") || null,
            telefono: get("telefono") || null,
            dui: get("dui") || null,
            email,
            password,
            estadoEmpleado: get("estadoEmpleado"),
            id_rol: rolId,
            camionId: get("camionId") ? parseInt(get("camionId"), 10) : null
        };

        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;

        const headers = { "Content-Type": "application/json" };
        if (csrfHeader && csrfToken) headers[csrfHeader] = csrfToken;

        try {
            const res = await fetch("/api/usuarios", {
                method: "POST",
                headers,
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error(await res.text());

            alert("✅ Usuario creado exitosamente");
            location.reload();
        } catch (error) {
            console.error(error);
            alert("❌ Error: " + error.message);
        }
    });


function seleccionarCamion(id, placa, modelo) {
    document.getElementById("camionId").value = id;
    document.getElementById("camionSeleccionado").value = placa + " - " + modelo;

    const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalBuscarCamion')
    );
    modal.hide();
}



// Función para cargar usuarios en la tabla
function cargarUsuarios() {
    const tbody = document.getElementById("tablaUsuarios");
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando usuarios...</td></tr>';

    fetch("/api/usuarios")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar usuarios");
            }
            return response.json();
        })
        .then(usuarios => {
            console.log("Usuarios recibidos:", usuarios);

            if (!usuarios || usuarios.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios registrados</td></tr>';
                return;
            }

            // Construir las filas de la tabla
            let html = '';
            usuarios.forEach((usuario, index) => {
                html += `
                    <tr>
                        <td class="row-num">${String(index + 1).padStart(2, '0')}</td>
                        <td><strong>${usuario.nombre || 'N/A'}</strong></td>
                        <td>${usuario.email || 'N/A'}</td>
                        <td>${formatearRol(usuario.rol) || 'N/A'}</td>
                        <td>
                            <span class="${getEstadoClass(usuario.estado)}">
                                ${formatearEstado(usuario.estado) || 'N/A'}
                            </span>
                        </td>
                        <td class="text-center">
                            <div class="d-flex gap-2 justify-content-center">
                                <button class="btn-edit" onclick="editarUsuario(${usuario.id})">✏ Editar</button>
                                <button class="btn-del" onclick="eliminarUsuario(${usuario.id})">🗑 Eliminar</button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

            // Actualizar contador en el footer
            const totalSpan = document.getElementById("totalUsuarios");
            if (totalSpan) {
                totalSpan.textContent = `Mostrando ${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''}`;
            }
        })
        .catch(error => {
            console.error("Error:", error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar usuarios</td></tr>';
        });
}

// Funciones auxiliares para formato
function formatearRol(rol) {
    if (!rol) return 'N/A';
    return rol.replace("ROLE_", "").replace(/_/g, " ");
}

function formatearEstado(estado) {
    if (!estado) return 'N/A';
    return estado.replace(/_/g, " ").toUpperCase();
}

const getEstadoClass = estado =>
    ({
        activo: 'badge bg-success',
        suspendido: 'badge bg-warning',
        baja: 'badge bg-danger',
        inactivo: 'badge bg-danger'
    }[estado?.toLowerCase()] || 'badge bg-secondary');


// Funciones para acciones (implementar después)
function editarUsuario(id) {
    console.log("Editar usuario:", id);
    alert("Función de editar en desarrollo");
}

function eliminarUsuario(id) {
    console.log("Eliminar usuario:", id);
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
        alert("Función de eliminar en desarrollo");
    }
}

// Cargar usuarios cuando la página esté lista
document.addEventListener("DOMContentLoaded", function() {
    cargarUsuarios();

    // También recargar cuando se cierre el modal de creación
    const modalAgregar = document.getElementById('modalAgregarUsuario');
    if (modalAgregar) {
        modalAgregar.addEventListener('hidden.bs.modal', function () {
            cargarUsuarios();  // Recargar lista al cerrar el modal
        });
    }
});
