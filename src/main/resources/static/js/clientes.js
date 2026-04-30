let clientesCache = [];
let clienteEditandoId = null;

const paginacionClientes = {
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
    sort: "id,desc"
};

const filtrosClientes = {
    q: ""
};

let debounceBusquedaClientes = null;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAgregarCliente");
    const btnAgregar = document.getElementById("btnAbrirModalAgregarCliente");
    const tabla = document.getElementById("tablaClientes");
    const btnPrev = document.getElementById("btnPrevClientes");
    const btnNext = document.getElementById("btnNextClientes");
    const tamanoPagina = document.getElementById("tamanoPaginaClientes");
    const inputBusqueda = document.getElementById("filtroBusquedaClientes");

    if (tamanoPagina) {
        const size = Number(tamanoPagina.value);
        if (Number.isInteger(size) && size > 0) {
            paginacionClientes.size = size;
        }
    }

    cargarClientes(0);

    if (form) {
        form.addEventListener("submit", guardarCliente);
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
            paginacionClientes.size = size;
            cargarClientes(0);
        });
    }

    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", () => {
            clearTimeout(debounceBusquedaClientes);
            debounceBusquedaClientes = setTimeout(() => {
                filtrosClientes.q = inputBusqueda.value.trim();
                cargarClientes(0);
            }, 300);
        });
    }
});

async function cargarClientes(page = paginacionClientes.page) {
    const tbody = document.getElementById("tablaClientes");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando clientes...</td></tr>';

    const pageSeguro = Math.max(0, Number(page) || 0);
    const sizeSeguro = Math.max(1, Number(paginacionClientes.size) || 10);

    try {
        const query = new URLSearchParams({
            page: String(pageSeguro),
            size: String(sizeSeguro),
            sort: paginacionClientes.sort
        });

        if (filtrosClientes.q) {
            query.set("q", filtrosClientes.q);
        }

        const res = await fetch(`/api/clientes?${query.toString()}`);
        if (!res.ok) throw new Error("No se pudieron cargar los clientes");

        const pageData = await res.json();

        const totalPages = Number(pageData?.totalPages ?? 1);
        const totalElements = Number(pageData?.totalElements ?? 0);

        paginacionClientes.page = Number(pageData?.number ?? pageSeguro);
        paginacionClientes.size = Number(pageData?.size ?? sizeSeguro);
        paginacionClientes.totalPages = Math.max(totalPages, 1);
        paginacionClientes.totalElements = totalElements;

        if (paginacionClientes.page >= paginacionClientes.totalPages && paginacionClientes.totalPages > 0) {
            await cargarClientes(paginacionClientes.totalPages - 1);
            return;
        }

        clientesCache = Array.isArray(pageData?.content) ? pageData.content : [];
        renderClientes(clientesCache);
        actualizarControlesPaginacion();
    } catch (error) {
        console.error(error);
        clientesCache = [];
        paginacionClientes.totalElements = 0;
        paginacionClientes.totalPages = 1;
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar clientes</td></tr>';
        actualizarControlesPaginacion();
    }
}

function renderClientes(clientes) {
    const tbody = document.getElementById("tablaClientes");
    const total = document.getElementById("totalClientes");
    if (!tbody) return;

    if (!Array.isArray(clientes) || clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay clientes registrados</td></tr>';
        if (total) total.textContent = "Mostrando 0 clientes";
        return;
    }

    const inicio = paginacionClientes.page * paginacionClientes.size;

    const html = clientes
        .map((cliente, index) => `
            <tr>
                <td class="row-num">${String(inicio + index + 1).padStart(2, "0")}</td>
                <td><strong>${escapeHtml(cliente.nombre || "-")}</strong></td>
                <td>${escapeHtml(cliente.telefono || "-")}</td>
                <td>${escapeHtml(cliente.correo || "-")}</td>
                <td>${escapeHtml(cliente.duiNit || "-")}</td>
                <td>${escapeHtml(cliente.direccion || "-")}</td>
                <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn-edit" type="button" data-cliente-id="${cliente.id}">Editar</button>
                        <button class="btn-del" type="button" data-cliente-id="${cliente.id}">Eliminar</button>
                    </div>
                </td>
            </tr>
        `)
        .join("");

    tbody.innerHTML = html;

    if (total) {
        const fin = inicio + clientes.length;
        total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionClientes.totalElements} clientes`;
    }
}

function actualizarControlesPaginacion() {
    const btnPrev = document.getElementById("btnPrevClientes");
    const btnNext = document.getElementById("btnNextClientes");
    const pagina = document.getElementById("paginaActualClientes");
    const tamanoPagina = document.getElementById("tamanoPaginaClientes");

    const paginaActual = paginacionClientes.page + 1;
    const totalPaginas = Math.max(paginacionClientes.totalPages, 1);
    const hayAnterior = paginacionClientes.page > 0;
    const haySiguiente = paginacionClientes.page < totalPaginas - 1;

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

    if (tamanoPagina && String(tamanoPagina.value) !== String(paginacionClientes.size)) {
        tamanoPagina.value = String(paginacionClientes.size);
    }
}

function cambiarPagina(delta) {
    const nuevaPagina = paginacionClientes.page + delta;
    if (nuevaPagina < 0 || nuevaPagina >= paginacionClientes.totalPages) return;
    cargarClientes(nuevaPagina);
}

function manejarAccionesTabla(event) {
    const botonEditar = event.target.closest(".btn-edit");
    if (botonEditar) {
        const id = Number(botonEditar.dataset.clienteId);
        if (!Number.isInteger(id)) return;

        const cliente = clientesCache.find(c => Number(c.id) === id);
        if (!cliente) {
            alert("No se pudo cargar la informacion del cliente");
            return;
        }

        prepararModalEdicion(cliente);

        const modalEl = document.getElementById("modalAgregarCliente");
        if (!modalEl) return;

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        return;
    }

    const botonEliminar = event.target.closest(".btn-del");
    if (!botonEliminar) return;

    const id = Number(botonEliminar.dataset.clienteId);
    if (!Number.isInteger(id)) return;
    eliminarCliente(id);
}

async function guardarCliente(event) {
    event.preventDefault();

    const nombre = obtenerValor("clienteNombre");
    const telefono = obtenerValor("clienteTelefono");
    const direccion = obtenerValor("clienteDireccion");
    const duiNit = obtenerValor("clienteDuiNit");
    const correo = obtenerValor("clienteCorreo");

    if (!nombre) {
        alert("El nombre es obligatorio");
        return;
    }

    const payload = {
        nombre,
        telefono: telefono || null,
        correo: correo || null,
        direccion: direccion || null,
        duiNit: duiNit || null
    };

    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;

    const headers = { "Content-Type": "application/json" };
    if (csrfHeader && csrfToken) {
        headers[csrfHeader] = csrfToken;
    }

    const enEdicion = Number.isInteger(clienteEditandoId);
    const url = enEdicion ? `/api/clientes/${clienteEditandoId}` : "/api/clientes";
    const method = enEdicion ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const error = await obtenerMensajeError(res);
            throw new Error(error || "No se pudo guardar el cliente");
        }

        limpiarFormularioCliente();
        prepararModalAgregar();

        const modalEl = document.getElementById("modalAgregarCliente");
        const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        modal?.hide();

        await cargarClientes(paginacionClientes.page);
        alert(enEdicion ? "Cliente actualizado correctamente" : "Cliente registrado correctamente");
    } catch (error) {
        console.error(error);
        alert(`Error al ${enEdicion ? "actualizar" : "registrar"} cliente: ` + error.message);
    }
}

async function eliminarCliente(id) {
    const cliente = clientesCache.find(c => Number(c.id) === id);
    if (!cliente) {
        alert("No se pudo identificar el cliente a eliminar");
        return;
    }

    const confirmar = window.confirm(`¿Eliminar el cliente ${cliente.nombre || ""}?`);
    if (!confirmar) return;

    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const headers = {};
    if (csrfHeader && csrfToken) {
        headers[csrfHeader] = csrfToken;
    }

    try {
        const res = await fetch(`/api/clientes/${id}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) {
            const error = await obtenerMensajeError(res);
            throw new Error(error || "No se pudo eliminar el cliente");
        }

        await cargarClientes(paginacionClientes.page);
        alert("Cliente eliminado correctamente");
    } catch (error) {
        console.error(error);
        alert("Error al eliminar cliente: " + error.message);
    }
}

function prepararModalAgregar() {
    clienteEditandoId = null;
    actualizarTextosModal("Agregar Cliente", "Guardar Cliente");
    limpiarFormularioCliente();
}

function prepararModalEdicion(cliente) {
    clienteEditandoId = Number(cliente.id);
    actualizarTextosModal("Editar Cliente", "Guardar Cambios");

    setValor("clienteNombre", cliente.nombre);
    setValor("clienteTelefono", cliente.telefono);
    setValor("clienteCorreo", cliente.correo);
    setValor("clienteDireccion", cliente.direccion);
    setValor("clienteDuiNit", cliente.duiNit);
}

function actualizarTextosModal(titulo, textoBoton) {
    const tituloModal = document.getElementById("modalAgregarClienteLabel");
    const botonSubmit = document.getElementById("btnSubmitClienteModal");
    if (tituloModal) tituloModal.textContent = titulo;
    if (botonSubmit) botonSubmit.textContent = textoBoton;
}

function limpiarFormularioCliente() {
    const form = document.getElementById("formAgregarCliente");
    form?.reset();
    setValor("clienteId", "");
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
