let usuariosCache = [];
let usuarioEditandoId = null;

const paginacionUsuarios = {
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
    sort: "idUsuarios,desc"
};

const filtrosUsuarios = {
    q: "",
    estado: ""
};

const paginacionCamionesModal = {
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
    sort: "idCamion,desc"
};

const filtrosCamionesModal = {
    q: "",
    estado: ""
};

let camionesModalCache = [];
let debounceBusquedaUsuarios = null;
let debounceBusquedaCamionesModal = null;

const formatearCamion = camion => {
    if (!camion) return "";
    const placa = camion.placa || "";
    const modelo = camion.modelo || "";
    return [placa, modelo].filter(Boolean).join(" - ");
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAgregarUsuario");
    const tabla = document.getElementById("tablaUsuarios");
    const btnPrev = document.getElementById("btnPrevUsuarios");
    const btnNext = document.getElementById("btnNextUsuarios");
    const tamanoPagina = document.getElementById("tamanoPaginaUsuarios");
    const inputBusqueda = document.getElementById("filtroBusquedaUsuarios");
    const selectEstado = document.getElementById("filtroEstadoUsuarios");
    const btnAgregar = document.querySelector('[data-bs-target="#modalAgregarUsuario"]');
    const btnQuitarCamion = document.getElementById("btnQuitarCamion");

    const inputBusquedaCamionesModal = document.getElementById("filtroBusquedaCamionesModal");
    const selectEstadoCamionesModal = document.getElementById("filtroEstadoCamionesModal");
    const btnPrevCamionesModal = document.getElementById("btnPrevCamionesModal");
    const btnNextCamionesModal = document.getElementById("btnNextCamionesModal");
    const btnLimpiarFiltrosCamionesModal = document.getElementById("btnLimpiarFiltrosCamionesModal");
    const tablaCamionesModal = document.getElementById("tablaCamiones");
    const modalBuscarCamion = document.getElementById("modalBuscarCamion");

    if (tamanoPagina) {
        const size = Number(tamanoPagina.value);
        if (Number.isInteger(size) && size > 0) {
            paginacionUsuarios.size = size;
        }
    }

    cargarEstadosUsuarios();
    cargarRoles();
    cargarUsuarios(0);
    cargarEstadosCamionesModal();

    if (form) {
        form.addEventListener("submit", guardarUsuario);
    }

    if (btnAgregar) {
        btnAgregar.addEventListener("click", prepararModalAgregar);
    }

    if (btnQuitarCamion) {
        btnQuitarCamion.addEventListener("click", limpiarCamionSeleccionado);
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
            paginacionUsuarios.size = size;
            cargarUsuarios(0);
        });
    }

    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", () => {
            clearTimeout(debounceBusquedaUsuarios);
            debounceBusquedaUsuarios = setTimeout(() => {
                filtrosUsuarios.q = inputBusqueda.value.trim();
                cargarUsuarios(0);
            }, 300);
        });
    }

    if (selectEstado) {
        selectEstado.addEventListener("change", () => {
            filtrosUsuarios.estado = selectEstado.value;
            cargarUsuarios(0);
        });
    }

    if (inputBusquedaCamionesModal) {
        inputBusquedaCamionesModal.addEventListener("input", () => {
            clearTimeout(debounceBusquedaCamionesModal);
            debounceBusquedaCamionesModal = setTimeout(() => {
                filtrosCamionesModal.q = inputBusquedaCamionesModal.value.trim();
                cargarCamionesModal(0);
            }, 300);
        });
    }

    if (selectEstadoCamionesModal) {
        selectEstadoCamionesModal.addEventListener("change", () => {
            filtrosCamionesModal.estado = selectEstadoCamionesModal.value;
            cargarCamionesModal(0);
        });
    }

    if (btnPrevCamionesModal) {
        btnPrevCamionesModal.addEventListener("click", () => cambiarPaginaCamionesModal(-1));
    }

    if (btnNextCamionesModal) {
        btnNextCamionesModal.addEventListener("click", () => cambiarPaginaCamionesModal(1));
    }

    if (btnLimpiarFiltrosCamionesModal) {
        btnLimpiarFiltrosCamionesModal.addEventListener("click", () => {
            filtrosCamionesModal.q = "";
            filtrosCamionesModal.estado = "";
            if (inputBusquedaCamionesModal) inputBusquedaCamionesModal.value = "";
            if (selectEstadoCamionesModal) selectEstadoCamionesModal.value = "";
            cargarCamionesModal(0);
        });
    }

    if (tablaCamionesModal) {
        tablaCamionesModal.addEventListener("click", manejarSeleccionCamion);
    }

    if (modalBuscarCamion) {
        modalBuscarCamion.addEventListener("shown.bs.modal", () => {
            cargarCamionesModal(paginacionCamionesModal.page);
        });
    }
});

async function cargarEstadosUsuarios() {
    const selectFiltro = document.getElementById("filtroEstadoUsuarios");
    const selectModal = document.getElementById("estadoEmpleado");
    if (!selectFiltro && !selectModal) return;

    try {
        const res = await fetch("/api/usuarios/estados");
        if (!res.ok) throw new Error("No se pudieron cargar los estados");

        const estados = await res.json();

        if (selectFiltro) {
            selectFiltro.innerHTML = '<option value="" selected>Todos los estados</option>';
        }
        if (selectModal) {
            selectModal.innerHTML = '<option value="" disabled selected>Selecciona</option>';
        }

        estados.forEach(estado => {
            if (selectFiltro) {
                const optionFiltro = document.createElement("option");
                optionFiltro.value = estado;
                optionFiltro.textContent = formatearTextoEnum(estado);
                selectFiltro.appendChild(optionFiltro);
            }
            if (selectModal) {
                const optionModal = document.createElement("option");
                optionModal.value = estado;
                optionModal.textContent = formatearTextoEnum(estado);
                selectModal.appendChild(optionModal);
            }
        });
    } catch (error) {
        console.error(error);
        alert("Error al cargar estados de usuarios");
    }
}

async function cargarRoles() {
    const select = document.getElementById("rol");
    if (!select) return;

    try {
        const res = await fetch("/api/rol/estados");
        if (!res.ok) throw new Error("No se pudieron cargar los roles");

        const roles = await res.json();
        select.innerHTML = '<option value="" disabled selected>Selecciona un rol</option>';

        roles.forEach(rol => {
            const option = document.createElement("option");
            option.value = rol.id || rol.idRol || rol.rolId || rol.id_rol;
            option.textContent = formatearRol(rol.rol || rol.nombre || rol.descripcion || "Rol");
            select.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        alert("Error al cargar roles");
    }
}

async function cargarEstadosCamionesModal() {
    const selectFiltro = document.getElementById("filtroEstadoCamionesModal");
    if (!selectFiltro) return;

    try {
        const res = await fetch("/api/camiones/estados");
        if (!res.ok) throw new Error("No se pudieron cargar los estados de camiones");

        const estados = await res.json();
        selectFiltro.innerHTML = '<option value="" selected>Todos los estados</option>';

        estados.forEach(estado => {
            const optionFiltro = document.createElement("option");
            optionFiltro.value = estado;
            optionFiltro.textContent = formatearTextoEnum(estado);
            selectFiltro.appendChild(optionFiltro);
        });
    } catch (error) {
        console.error(error);
        alert("Error al cargar estados de camiones");
    }
}

async function cargarUsuarios(page = paginacionUsuarios.page) {
    const tbody = document.getElementById("tablaUsuarios");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando usuarios...</td></tr>';

    const pageSeguro = Math.max(0, Number(page) || 0);
    const sizeSeguro = Math.max(1, Number(paginacionUsuarios.size) || 10);

    try {
        const query = new URLSearchParams({
            page: String(pageSeguro),
            size: String(sizeSeguro),
            sort: paginacionUsuarios.sort
        });

        if (filtrosUsuarios.q) {
            query.set("q", filtrosUsuarios.q);
        }

        if (filtrosUsuarios.estado) {
            query.set("estado", filtrosUsuarios.estado);
        }

        const res = await fetch(`/api/usuarios?${query.toString()}`);
        if (!res.ok) throw new Error("No se pudieron cargar los usuarios");

        const pageData = await res.json();

        const totalPages = Number(pageData?.totalPages ?? 1);
        const totalElements = Number(pageData?.totalElements ?? 0);

        paginacionUsuarios.page = Number(pageData?.number ?? pageSeguro);
        paginacionUsuarios.size = Number(pageData?.size ?? sizeSeguro);
        paginacionUsuarios.totalPages = Math.max(totalPages, 1);
        paginacionUsuarios.totalElements = totalElements;

        if (paginacionUsuarios.page >= paginacionUsuarios.totalPages && paginacionUsuarios.totalPages > 0) {
            await cargarUsuarios(paginacionUsuarios.totalPages - 1);
            return;
        }

        usuariosCache = Array.isArray(pageData?.content) ? pageData.content : [];
        renderUsuarios(usuariosCache);
        actualizarControlesPaginacion();
    } catch (error) {
        console.error(error);
        usuariosCache = [];
        paginacionUsuarios.totalElements = 0;
        paginacionUsuarios.totalPages = 1;
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar usuarios</td></tr>';
        actualizarControlesPaginacion();
    }
}

function renderUsuarios(usuarios) {
    const tbody = document.getElementById("tablaUsuarios");
    const total = document.getElementById("totalUsuarios");
    if (!tbody) return;

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios registrados</td></tr>';
        if (total) total.textContent = "Mostrando 0 usuarios";
        return;
    }

    const inicio = paginacionUsuarios.page * paginacionUsuarios.size;

    const html = usuarios
        .map((usuario, index) => `
            <tr>
                <td class="row-num">${String(inicio + index + 1).padStart(2, "0")}</td>
                <td><strong>${escapeHtml(usuario.nombre || "-")} ${escapeHtml(usuario.apellido || "")}</strong></td>
                <td>${escapeHtml(usuario.email || "-")}</td>
                <td>${escapeHtml(formatearRol(usuario.rol) || "-")}</td>
                <td>
                    <span class="${getEstadoClass(usuario.estado)}">
                        ${escapeHtml(formatearTextoEnum(usuario.estado) || "-")}
                    </span>
                </td>
                <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn-edit" type="button" data-usuario-id="${usuario.id}">Editar</button>
                        <button class="btn-del" type="button" data-usuario-id="${usuario.id}">Eliminar</button>
                    </div>
                </td>
            </tr>
        `)
        .join("");

    tbody.innerHTML = html;

    if (total) {
        const fin = inicio + usuarios.length;
        total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionUsuarios.totalElements} usuarios`;
    }
}

function actualizarControlesPaginacion() {
    const btnPrev = document.getElementById("btnPrevUsuarios");
    const btnNext = document.getElementById("btnNextUsuarios");
    const pagina = document.getElementById("paginaActualUsuarios");
    const tamanoPagina = document.getElementById("tamanoPaginaUsuarios");

    const paginaActual = paginacionUsuarios.page + 1;
    const totalPaginas = Math.max(paginacionUsuarios.totalPages, 1);
    const hayAnterior = paginacionUsuarios.page > 0;
    const haySiguiente = paginacionUsuarios.page < totalPaginas - 1;

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

    if (tamanoPagina && String(tamanoPagina.value) !== String(paginacionUsuarios.size)) {
        tamanoPagina.value = String(paginacionUsuarios.size);
    }
}

function cambiarPagina(delta) {
    const nuevaPagina = paginacionUsuarios.page + delta;
    if (nuevaPagina < 0 || nuevaPagina >= paginacionUsuarios.totalPages) return;
    cargarUsuarios(nuevaPagina);
}

function manejarAccionesTabla(event) {
    const botonEditar = event.target.closest(".btn-edit");
    if (botonEditar) {
        const id = Number(botonEditar.dataset.usuarioId);
        if (!Number.isInteger(id)) return;

        const usuario = usuariosCache.find(u => Number(u.id) === id);
        if (!usuario) {
            alert("No se pudo cargar la informacion del usuario");
            return;
        }

        prepararModalEdicion(usuario);

        const modalEl = document.getElementById("modalAgregarUsuario");
        if (!modalEl) return;
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        return;
    }

    const botonEliminar = event.target.closest(".btn-del");
    if (!botonEliminar) return;

    const id = Number(botonEliminar.dataset.usuarioId);
    if (!Number.isInteger(id)) return;
    eliminarUsuario(id);
}

function manejarSeleccionCamion(event) {
    const botonSeleccion = event.target.closest(".btn-select-camion");
    if (!botonSeleccion) return;

    const id = Number(botonSeleccion.dataset.camionId);
    if (!Number.isInteger(id)) return;

    const camion = camionesModalCache.find(c => Number(obtenerIdCamion(c)) === id);
    if (!camion) {
        alert("No se pudo cargar la informacion del camion");
        return;
    }

    seleccionarCamion(camion);
}

async function guardarUsuario(event) {
    event.preventDefault();

    const nombre = obtenerValor("nombre");
    const apellido = obtenerValor("apellido");
    const telefono = obtenerValor("telefono");
    const dui = obtenerValor("dui");
    const email = obtenerValor("email");
    const password = obtenerValor("password");
    const estadoEmpleado = document.getElementById("estadoEmpleado")?.value;
    const rolId = obtenerValor("rol");
    const camionId = obtenerValor("camionId");
    const usuarioLogin = obtenerValor("usuarioLogin");

    if (!nombre || !email || !estadoEmpleado || !rolId) {
        alert("Completa los campos requeridos correctamente");
        return;
    }

    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;

    const headers = { "Content-Type": "application/json" };
    if (csrfHeader && csrfToken) {
        headers[csrfHeader] = csrfToken;
    }

    const enEdicion = Number.isInteger(usuarioEditandoId);

    if (!enEdicion && !password) {
        alert("La contrasena es obligatoria para crear un usuario");
        return;
    }

    const payload = enEdicion
        ? {
            idUsuario: usuarioEditandoId,
            nombre,
            apellido,
            estadoEmpleado,
            telefono: telefono || null,
            dui: dui || null,
            fotoUrl: null,
            rol: String(rolId),
            usuario: usuarioLogin || null,
            email,
            password: password || null,
            camionId: camionId ? Number(camionId) : null
        }
        : {
            nombre,
            apellido: apellido || null,
            telefono: telefono || null,
            dui: dui || null,
            email,
            password,
            estadoEmpleado,
            id_rol: Number(rolId),
            camionId: camionId ? Number(camionId) : null
        };

    const url = enEdicion ? `/api/usuarios/${usuarioEditandoId}` : "/api/usuarios";
    const method = enEdicion ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const error = await obtenerMensajeError(res);
            throw new Error(error || "No se pudo guardar el usuario");
        }

        limpiarFormularioUsuario();
        prepararModalAgregar();

        const modalEl = document.getElementById("modalAgregarUsuario");
        const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        modal?.hide();

        await cargarUsuarios(paginacionUsuarios.page);
        alert(enEdicion ? "Usuario actualizado correctamente" : "Usuario registrado correctamente");
    } catch (error) {
        console.error(error);
        alert(`Error al ${enEdicion ? "actualizar" : "registrar"} usuario: ` + error.message);
    }
}

async function eliminarUsuario(id) {
    const usuario = usuariosCache.find(u => Number(u.id) === id);
    if (!usuario) {
        alert("No se pudo identificar el usuario a eliminar");
        return;
    }

    const confirmar = window.confirm(`¿Eliminar el usuario ${usuario.nombre || ""} ${usuario.apellido || ""}?`);
    if (!confirmar) return;

    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const headers = {};
    if (csrfHeader && csrfToken) {
        headers[csrfHeader] = csrfToken;
    }

    try {
        const res = await fetch(`/api/usuarios/${id}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) {
            const error = await obtenerMensajeError(res);
            throw new Error(error || "No se pudo eliminar el usuario");
        }

        await cargarUsuarios(paginacionUsuarios.page);
        alert("Usuario eliminado correctamente");
    } catch (error) {
        console.error(error);
        alert("Error al eliminar usuario: " + error.message);
    }
}

async function cargarCamionesModal(page = paginacionCamionesModal.page) {
    const tbody = document.getElementById("tablaCamiones");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando camiones...</td></tr>';

    const pageSeguro = Math.max(0, Number(page) || 0);
    const sizeSeguro = Math.max(1, Number(paginacionCamionesModal.size) || 10);

    try {
        const query = new URLSearchParams({
            page: String(pageSeguro),
            size: String(sizeSeguro),
            sort: paginacionCamionesModal.sort
        });

        if (filtrosCamionesModal.q) {
            query.set("q", filtrosCamionesModal.q);
        }

        if (filtrosCamionesModal.estado) {
            query.set("estado", filtrosCamionesModal.estado);
        }

        const res = await fetch(`/api/camiones?${query.toString()}`);
        if (!res.ok) throw new Error("No se pudieron cargar los camiones");

        const pageData = await res.json();

        const totalPages = Number(pageData?.totalPages ?? 1);
        const totalElements = Number(pageData?.totalElements ?? 0);

        paginacionCamionesModal.page = Number(pageData?.number ?? pageSeguro);
        paginacionCamionesModal.size = Number(pageData?.size ?? sizeSeguro);
        paginacionCamionesModal.totalPages = Math.max(totalPages, 1);
        paginacionCamionesModal.totalElements = totalElements;

        if (paginacionCamionesModal.page >= paginacionCamionesModal.totalPages && paginacionCamionesModal.totalPages > 0) {
            await cargarCamionesModal(paginacionCamionesModal.totalPages - 1);
            return;
        }

        camionesModalCache = Array.isArray(pageData?.content) ? pageData.content : [];
        renderCamionesModal(camionesModalCache);
        actualizarControlesPaginacionCamionesModal();
    } catch (error) {
        console.error(error);
        camionesModalCache = [];
        paginacionCamionesModal.totalElements = 0;
        paginacionCamionesModal.totalPages = 1;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar camiones</td></tr>';
        actualizarControlesPaginacionCamionesModal();
    }
}

function renderCamionesModal(camiones) {
    const tbody = document.getElementById("tablaCamiones");
    const total = document.getElementById("totalCamionesModal");
    if (!tbody) return;

    if (!Array.isArray(camiones) || camiones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay camiones disponibles</td></tr>';
        if (total) total.textContent = "Mostrando 0 camiones";
        return;
    }

    const inicio = paginacionCamionesModal.page * paginacionCamionesModal.size;

    const html = camiones
        .map((camion, index) => {
            const camionId = obtenerIdCamion(camion);
            const estado = obtenerEstadoCamion(camion);
            return `
            <tr>
                <td class="row-num">${String(inicio + index + 1).padStart(2, "0")}</td>
                <td>${escapeHtml(camion.placa || "-")}</td>
                <td><strong>${escapeHtml(camion.modelo || "-")}</strong></td>
                <td><span class="badge bg-secondary">${escapeHtml(formatearTextoEnum(estado) || "-")}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-select-camion" type="button" data-camion-id="${camionId ?? ""}">Seleccionar</button>
                </td>
            </tr>
        `;
        })
        .join("");

    tbody.innerHTML = html;

    if (total) {
        const fin = inicio + camiones.length;
        total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionCamionesModal.totalElements} camiones`;
    }
}

function actualizarControlesPaginacionCamionesModal() {
    const btnPrev = document.getElementById("btnPrevCamionesModal");
    const btnNext = document.getElementById("btnNextCamionesModal");
    const pagina = document.getElementById("paginaActualCamionesModal");

    const paginaActual = paginacionCamionesModal.page + 1;
    const totalPaginas = Math.max(paginacionCamionesModal.totalPages, 1);
    const hayAnterior = paginacionCamionesModal.page > 0;
    const haySiguiente = paginacionCamionesModal.page < totalPaginas - 1;

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
}

function cambiarPaginaCamionesModal(delta) {
    const nuevaPagina = paginacionCamionesModal.page + delta;
    if (nuevaPagina < 0 || nuevaPagina >= paginacionCamionesModal.totalPages) return;
    cargarCamionesModal(nuevaPagina);
}

function seleccionarCamion(camion) {
    const camionIdInput = document.getElementById("camionId");
    const camionSeleccionadoInput = document.getElementById("camionSeleccionado");

    const camionId = obtenerIdCamion(camion);
    if (camionIdInput) camionIdInput.value = camionId ?? "";
    if (camionSeleccionadoInput) camionSeleccionadoInput.value = formatearCamion(camion);

    const modalEl = document.getElementById("modalBuscarCamion");
    const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    modal?.hide();

    const modalUsuarioEl = document.getElementById("modalAgregarUsuario");
    if (modalUsuarioEl) {
        const modalUsuario = bootstrap.Modal.getOrCreateInstance(modalUsuarioEl);
        modalUsuario.show();
    }
}

function obtenerIdCamion(camion) {
    if (!camion) return null;
    return camion.id ?? camion.idCamion ?? null;
}

function obtenerEstadoCamion(camion) {
    if (!camion) return "";
    return camion.estadoCamion || camion.estado || "";
}

function limpiarCamionSeleccionado() {
    const camionIdInput = document.getElementById("camionId");
    const camionSeleccionadoInput = document.getElementById("camionSeleccionado");

    if (camionIdInput) camionIdInput.value = "";
    if (camionSeleccionadoInput) camionSeleccionadoInput.value = "";
}

function prepararModalAgregar() {
    usuarioEditandoId = null;
    actualizarTextosModal("Agregar Usuario", "Guardar Usuario");
    establecerPasswordRequerida(true);
    limpiarFormularioUsuario();
}

function prepararModalEdicion(usuario) {
    usuarioEditandoId = Number(usuario.id);
    actualizarTextosModal("Editar Usuario", "Guardar Cambios");
    establecerPasswordRequerida(false);

    setValor("nombre", usuario.nombre);
    setValor("apellido", usuario.apellido);
    setValor("telefono", usuario.telefono);
    setValor("dui", usuario.dui);
    setValor("email", usuario.email);
    setValor("estadoEmpleado", usuario.estado);
    setValor("rol", usuario.rolId || "");
    setValor("usuarioLogin", usuario.usuario || "");
    setValor("password", "");

    setValor("camionId", usuario.camionId || "");
    const camionSeleccionado = document.getElementById("camionSeleccionado");
    if (camionSeleccionado) {
        const descripcion = [usuario.camionPlaca, usuario.camionModelo].filter(Boolean).join(" - ");
        camionSeleccionado.value = descripcion || "";
    }
}

function actualizarTextosModal(titulo, textoBoton) {
    const tituloModal = document.getElementById("modalAgregarUsuarioLabel");
    const botonSubmit = document.getElementById("btnSubmitUsuarioModal");
    if (tituloModal) tituloModal.textContent = titulo;
    if (botonSubmit) botonSubmit.textContent = textoBoton;
}

function establecerPasswordRequerida(requerida) {
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        if (requerida) {
            passwordInput.setAttribute("required", "required");
        } else {
            passwordInput.removeAttribute("required");
        }
    }
}

function limpiarFormularioUsuario() {
    const form = document.getElementById("formAgregarUsuario");
    form?.reset();
    setValor("camionId", "");
    setValor("camionSeleccionado", "");
    setValor("usuarioLogin", "");
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

function formatearRol(rol) {
    if (!rol) return "";
    return String(rol).replace("ROLE_", "").replace(/_/g, " ");
}

function formatearTextoEnum(valor) {
    if (!valor) return "";
    return String(valor).replaceAll("_", " ");
}

const getEstadoClass = estado =>
    ({
        activo: 'badge bg-success',
        suspendido: 'badge bg-warning',
        baja: 'badge bg-danger',
        inactivo: 'badge bg-danger'
    }[String(estado || "").toLowerCase()] || 'badge bg-secondary');

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
