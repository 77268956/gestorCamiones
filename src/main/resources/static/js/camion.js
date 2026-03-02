document.addEventListener("DOMContentLoaded", () => {
    cargarEstadosCamion();
    cargarCamiones();

    const form = document.getElementById("formAgregarCamion");
    if (form) {
        form.addEventListener("submit", guardarCamion);
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
        renderCamiones(camiones);
    } catch (error) {
        console.error(error);
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
                        <button class="btn-edit" type="button" disabled>Editar</button>
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

async function guardarCamion(event) {
    event.preventDefault();

    const placa = obtenerValor("camionPlaca");
    const codigo = obtenerValor("camionCodigo");
    const nombre = obtenerValor("camionNombre");
    const modelo = obtenerValor("camionModelo");
    const comentario = obtenerValor("camionComentario");
    const estadoCamion = document.getElementById("camionEstado")?.value;

    if (!placa || !codigo || !nombre || !estadoCamion) {
        alert("Completa los campos obligatorios");
        return;
    }

    if (!modelo){
        modelo.replaceAll("N/V");
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

    try {
        const res = await fetch("/api/camiones", {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error || "No se pudo guardar el camion");
        }

        const form = document.getElementById("formAgregarCamion");
        form?.reset();

        const modalEl = document.getElementById("modalAgregarCamion");
        const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        modal?.hide();

        await cargarCamiones();
        alert("Camion registrado correctamente");
    } catch (error) {
        console.error(error);
        alert("Error al registrar camion: " + error.message);
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
