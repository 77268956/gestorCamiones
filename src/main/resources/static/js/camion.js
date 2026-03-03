let camionesCache = [];
let camionEditandoId = null;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAgregarCamion");
    const btnAgregar = document.getElementById("btnAbrirModalAgregarCamion");
    const tabla = document.getElementById("tablaCamiones");

    cargarEstadosCamion();
    cargarCamiones();

    if (form) {
        form.addEventListener("submit", guardarCamion);
    }

    if (btnAgregar) {
        btnAgregar.addEventListener("click", prepararModalAgregar);
    }

    if (tabla) {
        tabla.addEventListener("click", manejarAccionesTabla);
    }
});

async function cargarEstadosCamion() {
    const select = document.getElementById("camionEstado");
    if (!select) return;

    try {
        const res = await fetch("/api/camiones/estados");
        if (!res.ok) throw new Error("No se pudieron cargar los estados");

        const estados = await res.json();
        estados.forEach(estado => {
            const option = document.createElement("option");
            option.value = estado;
            option.textContent = formatearTextoEnum(estado);
            select.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        alert("Error al cargar estados de camiones");
    }
}

async function cargarCamiones() {
    const tbody = document.getElementById("tablaCamiones");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando camiones...</td></tr>';

    try {
        const res = await fetch("/api/camiones");
        if (!res.ok) throw new Error("No se pudieron cargar los camiones");

        const camiones = await res.json();
        camionesCache = Array.isArray(camiones) ? camiones : [];
        renderCamiones(camionesCache);
    } catch (error) {
        console.error(error);
        camionesCache = [];
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar camiones</td></tr>';
    }
}

function renderCamiones(camiones) {
    const tbody = document.getElementById("tablaCamiones");
    const total = document.getElementById("totalCamiones");
    if (!tbody) return;

    if (!Array.isArray(camiones) || camiones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay camiones registrados</td></tr>';
        if (total) total.textContent = "Mostrando 0 camiones";
        return;
    }

    const html = camiones
        .map((camion, index) => `
            <tr>
                <td class="row-num">${String(index + 1).padStart(2, "0")}</td>
                <td><span class="plate">${escapeHtml(camion.placa || "-")}</span></td>
                <td><strong>${escapeHtml(camion.modelo || "-")}</strong></td>
                <td>${escapeHtml(camion.nombre || "-")}</td>
                <td><span class="badge bg-secondary">${escapeHtml(formatearTextoEnum(camion.estadoCamion) || "-")}</span></td>
                <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn-edit" type="button" data-camion-id="${camion.id}">Editar</button>
                        <button class="btn-del" type="button" disabled>Eliminar</button>
                    </div>
                </td>
            </tr>
        `)
        .join("");

    tbody.innerHTML = html;

    if (total) {
        const n = camiones.length;
        total.textContent = `Mostrando ${n} camion${n === 1 ? "" : "es"}`;
    }
}

function manejarAccionesTabla(event) {
    const botonEditar = event.target.closest(".btn-edit");
    if (!botonEditar) return;

    const id = Number(botonEditar.dataset.camionId);
    if (!Number.isInteger(id)) return;

    const camion = camionesCache.find(c => c.id === id);
    if (!camion) {
        alert("No se pudo cargar la informacion del camion");
        return;
    }

    prepararModalEdicion(camion);

    const modalEl = document.getElementById("modalAgregarCamion");
    if (!modalEl) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

async function guardarCamion(event) {
    event.preventDefault();

    const placa = obtenerValor("camionPlaca");
    const codigo = obtenerValor("camionCodigo");
    const nombre = obtenerValor("camionNombre");
    const modelo = obtenerValor("camionModelo");
    const comentario = obtenerValor("camionComentario");
    const estadoCamion = document.getElementById("camionEstado")?.value;

    if (!placa || !codigo || !nombre || !modelo || !estadoCamion) {
        alert("Completa los campos obligatorios");
        return;
    }

    const payload = {
        placa,
        codigo,
        nombre,
        modelo,
        comentario: comentario || null,
        fotoUrl: null,
        estadoCamion
    };

    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;

    const headers = { "Content-Type": "application/json" };
    if (csrfHeader && csrfToken) {
        headers[csrfHeader] = csrfToken;
    }

    const enEdicion = Number.isInteger(camionEditandoId);
    const url = enEdicion ? `/api/camiones/${camionEditandoId}` : "/api/camiones";
    const method = enEdicion ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error || "No se pudo guardar el camion");
        }

        limpiarFormularioCamion();
        prepararModalAgregar();

        const modalEl = document.getElementById("modalAgregarCamion");
        const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        modal?.hide();

        await cargarCamiones();
        alert(enEdicion ? "Camion actualizado correctamente" : "Camion registrado correctamente");
    } catch (error) {
        console.error(error);
        alert(`Error al ${enEdicion ? "actualizar" : "registrar"} camion: ` + error.message);
    }
}

function prepararModalAgregar() {
    camionEditandoId = null;
    actualizarTextosModal("Agregar Nuevo Camion", "Registrar Camion");
    limpiarFormularioCamion();
}

function prepararModalEdicion(camion) {
    camionEditandoId = Number(camion.id);
    actualizarTextosModal("Editar Camion", "Guardar Cambios");

    setValor("camionId", camion.id);
    setValor("camionPlaca", camion.placa);
    setValor("camionCodigo", camion.codigo);
    setValor("camionNombre", camion.nombre);
    setValor("camionModelo", camion.modelo);
    setValor("camionComentario", camion.comentario || "");
    setValor("camionEstado", camion.estadoCamion || "");
}

function actualizarTextosModal(titulo, textoBoton) {
    const tituloModal = document.getElementById("modalAgregarCamionLabel");
    const botonSubmit = document.getElementById("btnSubmitCamionModal");
    if (tituloModal) tituloModal.textContent = titulo;
    if (botonSubmit) botonSubmit.textContent = textoBoton;
}

function limpiarFormularioCamion() {
    const form = document.getElementById("formAgregarCamion");
    form?.reset();
    setValor("camionId", "");
}

function setValor(id, valor) {
    const element = document.getElementById(id);
    if (element) {
        element.value = valor ?? "";
    }
}

function obtenerValor(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function formatearTextoEnum(valor) {
    if (!valor) return "";
    return String(valor).replaceAll("_", " ");
}

function escapeHtml(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
