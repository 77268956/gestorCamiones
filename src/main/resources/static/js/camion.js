let camionesCache = [];
let camionEditandoId = null;

const paginacionCamiones = {
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
    sort: "idCamion,desc"
};

const filtrosCamiones = {
    q: "",
    estado: ""
};

let debounceBusquedaCamiones = null;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAgregarCamion");
    const btnAgregar = document.getElementById("btnAbrirModalAgregarCamion");
    const tabla = document.getElementById("tablaCamiones");
    const btnPrev = document.getElementById("btnPrevCamiones");
    const btnNext = document.getElementById("btnNextCamiones");
    const tamanoPagina = document.getElementById("tamanoPaginaCamiones");
    const inputBusqueda = document.getElementById("filtroBusquedaCamiones");
    const selectEstado = document.getElementById("filtroEstadoCamiones");

    if (tamanoPagina) {
        const size = Number(tamanoPagina.value);
        if (Number.isInteger(size) && size > 0) {
            paginacionCamiones.size = size;
        }
    }

    cargarEstadosCamion();
    cargarCamiones(0);

    if (form) {
        form.addEventListener("submit", guardarCamion);
    }

    if (btnAgregar) {
        btnAgregar.addEventListener("click", prepararModalAgregar);
    }

    if (tabla) {
        tabla.addEventListener("click", manejarAccionesTabla);
    }

    if (btnPrev) {
        btnPrev.addEventListener("click", () => cambiarPagina(-1));
    }

    if (btnNext) {
        btnNext.addEventListener("click", () => cambiarPagina(1));
    }

    if (tamanoPagina) {
        tamanoPagina.addEventListener("change", () => {
            const size = Number(tamanoPagina.value);
            if (!Number.isInteger(size) || size <= 0) return;
            paginacionCamiones.size = size;
            cargarCamiones(0);
        });
    }

    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", () => {
            clearTimeout(debounceBusquedaCamiones);
            debounceBusquedaCamiones = setTimeout(() => {
                filtrosCamiones.q = inputBusqueda.value.trim();
                cargarCamiones(0);
            }, 300);
        });
    }

    if (selectEstado) {
        selectEstado.addEventListener("change", () => {
            filtrosCamiones.estado = selectEstado.value;
            cargarCamiones(0);
        });
    }
});

async function cargarEstadosCamion() {
    const selectModal = document.getElementById("camionEstado");
    const selectFiltro = document.getElementById("filtroEstadoCamiones");
    if (!selectModal && !selectFiltro) return;

    try {
        const res = await fetch("/api/camiones/estados");
        if (!res.ok) throw new Error("No se pudieron cargar los estados");

        const estados = await res.json();

        if (selectModal) {
            selectModal.innerHTML = '<option selected disabled value="">Seleccionar...</option>';
        }

        if (selectFiltro) {
            selectFiltro.innerHTML = '<option value="" selected>Todos los estados</option>';
        }

        estados.forEach(estado => {
            if (selectModal) {
                const optionModal = document.createElement("option");
                optionModal.value = estado;
                optionModal.textContent = formatearTextoEnum(estado);
                selectModal.appendChild(optionModal);
            }

            if (selectFiltro) {
                const optionFiltro = document.createElement("option");
                optionFiltro.value = estado;
                optionFiltro.textContent = formatearTextoEnum(estado);
                selectFiltro.appendChild(optionFiltro);
            }
        });
    } catch (error) {
        console.error(error);
        alert("Error al cargar estados de camiones");
    }
}

async function cargarCamiones(page = paginacionCamiones.page) {
    const tbody = document.getElementById("tablaCamiones");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando camiones...</td></tr>';

    const pageSeguro = Math.max(0, Number(page) || 0);
    const sizeSeguro = Math.max(1, Number(paginacionCamiones.size) || 10);

    try {
        const query = new URLSearchParams({
            page: String(pageSeguro),
            size: String(sizeSeguro),
            sort: paginacionCamiones.sort
        });

        if (filtrosCamiones.q) {
            query.set("q", filtrosCamiones.q);
        }

        if (filtrosCamiones.estado) {
            query.set("estado", filtrosCamiones.estado);
        }

        const res = await fetch(`/api/camiones?${query.toString()}`);
        if (!res.ok) throw new Error("No se pudieron cargar los camiones");

        const pageData = await res.json();

        const totalPages = Number(pageData?.totalPages ?? 1);
        const totalElements = Number(pageData?.totalElements ?? 0);

        paginacionCamiones.page = Number(pageData?.number ?? pageSeguro);
        paginacionCamiones.size = Number(pageData?.size ?? sizeSeguro);
        paginacionCamiones.totalPages = Math.max(totalPages, 1);
        paginacionCamiones.totalElements = totalElements;

        if (paginacionCamiones.page >= paginacionCamiones.totalPages && paginacionCamiones.totalPages > 0) {
            await cargarCamiones(paginacionCamiones.totalPages - 1);
            return;
        }

        camionesCache = Array.isArray(pageData?.content) ? pageData.content : [];
        renderCamiones(camionesCache);
        actualizarControlesPaginacion();
    } catch (error) {
        console.error(error);
        camionesCache = [];
        paginacionCamiones.totalElements = 0;
        paginacionCamiones.totalPages = 1;
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar camiones</td></tr>';
        actualizarControlesPaginacion();
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

    const inicio = paginacionCamiones.page * paginacionCamiones.size;

    const html = camiones
        .map((camion, index) => `
            <tr>
                <td class="row-num">${String(inicio + index + 1).padStart(2, "0")}</td>
                <td><span class="plate">${escapeHtml(camion.placa || "-")}</span></td>
                <td><strong>${escapeHtml(camion.modelo || "-")}</strong></td>
                <td>${escapeHtml(camion.nombre || "-")}</td>
                <td><span class="badge bg-secondary">${escapeHtml(formatearTextoEnum(camion.estadoCamion) || "-")}</span></td>
                <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn-edit" type="button" data-camion-id="${camion.id}">Editar</button>
                        <button class="btn-del" type="button" data-camion-id="${camion.id}">Eliminar</button>
                    </div>
                </td>
            </tr>
        `)
        .join("");

    tbody.innerHTML = html;

    if (total) {
        const fin = inicio + camiones.length;
        total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionCamiones.totalElements} camiones`;
    }
}

function actualizarControlesPaginacion() {
    const btnPrev = document.getElementById("btnPrevCamiones");
    const btnNext = document.getElementById("btnNextCamiones");
    const pagina = document.getElementById("paginaActualCamiones");
    const tamanoPagina = document.getElementById("tamanoPaginaCamiones");

    const paginaActual = paginacionCamiones.page + 1;
    const totalPaginas = Math.max(paginacionCamiones.totalPages, 1);
    const hayAnterior = paginacionCamiones.page > 0;
    const haySiguiente = paginacionCamiones.page < totalPaginas - 1;

    if (btnPrev) {
        btnPrev.disabled = !hayAnterior;
        btnPrev.parentElement?.classList.toggle("disabled", !hayAnterior);
    }

    if (btnNext) {
        btnNext.disabled = !haySiguiente;
        btnNext.parentElement?.classList.toggle("disabled", !haySiguiente);
    }

    if (pagina) {
        pagina.textContent = `${paginaActual} / ${totalPaginas}`;
    }

    if (tamanoPagina && String(tamanoPagina.value) !== String(paginacionCamiones.size)) {
        tamanoPagina.value = String(paginacionCamiones.size);
    }
}

function cambiarPagina(delta) {
    const nuevaPagina = paginacionCamiones.page + delta;
    if (nuevaPagina < 0 || nuevaPagina >= paginacionCamiones.totalPages) return;
    cargarCamiones(nuevaPagina);
}

function manejarAccionesTabla(event) {
    const botonEditar = event.target.closest(".btn-edit");
    if (botonEditar) {
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
        return;
    }

    const botonEliminar = event.target.closest(".btn-del");
    if (!botonEliminar) return;

    const id = Number(botonEliminar.dataset.camionId);
    if (!Number.isInteger(id)) return;
    eliminarCamion(id);
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
            const error = await obtenerMensajeError(res);
            throw new Error(error || "No se pudo guardar el camion");
        }

        limpiarFormularioCamion();
        prepararModalAgregar();

        const modalEl = document.getElementById("modalAgregarCamion");
        const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        modal?.hide();

        await cargarCamiones(paginacionCamiones.page);
        alert(enEdicion ? "Camion actualizado correctamente" : "Camion registrado correctamente");
    } catch (error) {
        console.error(error);
        alert(`Error al ${enEdicion ? "actualizar" : "registrar"} camion: ` + error.message);
    }
}

async function eliminarCamion(id) {
    const camion = camionesCache.find(c => c.id === id);
    if (!camion) {
        alert("No se pudo identificar el camion a eliminar");
        return;
    }

    const confirmar = window.confirm(`¿Eliminar el camion ${camion.placa}?`);
    if (!confirmar) return;

    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const headers = {};
    if (csrfHeader && csrfToken) {
        headers[csrfHeader] = csrfToken;
    }

    try {
        const res = await fetch(`/api/camiones/${id}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) {
            const error = await obtenerMensajeError(res);
            throw new Error(error || "No se pudo eliminar el camion");
        }

        await cargarCamiones(paginacionCamiones.page);
        alert("Camion eliminado correctamente");
    } catch (error) {
        console.error(error);
        alert("Error al eliminar camion: " + error.message);
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

async function obtenerMensajeError(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const data = await response.json();
        if (typeof data?.message === "string" && data.message.trim()) return data.message;
        if (typeof data?.error === "string" && data.error.trim()) return data.error;
        if (data && typeof data === "object") {
            const primerValor = Object.values(data).find(valor => typeof valor === "string" && valor.trim());
            if (primerValor) return primerValor;
        }
        return "";
    }

    const text = await response.text();
    return text?.trim() || "";
}
