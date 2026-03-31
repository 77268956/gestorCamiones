const auditoriaState = {
    page: 0,
    size: 25,
    totalPages: 0,
    totalElements: 0
};

const auditoriaSistemaState = {
    page: 0,
    size: 25,
    totalPages: 0,
    totalElements: 0,
    loaded: false,
    cache: new Map()
};

document.addEventListener("DOMContentLoaded", () => {
    iniciarFiltrosPorDefecto();
    iniciarFiltrosSistemaPorDefecto();
    enlazarEventosAuditoria();
    enlazarAuditoriaSistema();
    cargarAuditoriaLogin();
});

function enlazarEventosAuditoria() {
    document.getElementById("btnBuscarAuditoria")
        ?.addEventListener("click", () => {
            auditoriaState.page = 0;
            cargarAuditoriaLogin();
        });

    document.getElementById("btnLimpiarAuditoria")
        ?.addEventListener("click", limpiarFiltrosAuditoria);

    document.getElementById("btnPrevAuditoria")
        ?.addEventListener("click", () => {
            if (auditoriaState.page > 0) {
                auditoriaState.page -= 1;
                cargarAuditoriaLogin();
            }
        });

    document.getElementById("btnNextAuditoria")
        ?.addEventListener("click", () => {
            if (auditoriaState.page + 1 < auditoriaState.totalPages) {
                auditoriaState.page += 1;
                cargarAuditoriaLogin();
            }
        });

    document.getElementById("fBusqueda")
        ?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                auditoriaState.page = 0;
                cargarAuditoriaLogin();
            }
        });
}

function enlazarAuditoriaSistema() {
    const tabSistema = document.getElementById("tab-sistema");
    tabSistema?.addEventListener("shown.bs.tab", () => {
        if (!auditoriaSistemaState.loaded) {
            cargarAuditoriaSistema();
        }
    });

    document.getElementById("btnBuscarAuditoriaSistema")
        ?.addEventListener("click", () => {
            auditoriaSistemaState.page = 0;
            cargarAuditoriaSistema(true);
        });

    document.getElementById("btnLimpiarAuditoriaSistema")
        ?.addEventListener("click", limpiarFiltrosAuditoriaSistema);

    document.getElementById("btnPrevAuditoriaSistema")
        ?.addEventListener("click", () => {
            if (auditoriaSistemaState.page > 0) {
                auditoriaSistemaState.page -= 1;
                cargarAuditoriaSistema(true);
            }
        });

    document.getElementById("btnNextAuditoriaSistema")
        ?.addEventListener("click", () => {
            if (auditoriaSistemaState.page + 1 < auditoriaSistemaState.totalPages) {
                auditoriaSistemaState.page += 1;
                cargarAuditoriaSistema(true);
            }
        });

    document.getElementById("fBusquedaSistema")
        ?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                auditoriaSistemaState.page = 0;
                cargarAuditoriaSistema(true);
            }
        });

    document.getElementById("tablaAuditoriaSistema")
        ?.addEventListener("click", (event) => {
            const btn = event.target?.closest?.("button[data-action='ver-info']");
            if (!btn) return;
            const id = Number(btn.dataset.id);
            if (!Number.isFinite(id)) return;
            abrirModalAuditoriaSistema(id);
        });
}

function iniciarFiltrosPorDefecto() {
    const hasta = new Date();
    const desde = new Date(hasta);
    desde.setDate(desde.getDate() - 7);

    setInputDateTime("fDesde", toDateTimeLocal(desde));
    setInputDateTime("fHasta", toDateTimeLocal(hasta));
}

function iniciarFiltrosSistemaPorDefecto() {
    const hasta = new Date();
    const desde = new Date(hasta);
    desde.setDate(desde.getDate() - 7);

    setInputDateTime("fDesdeSistema", toDateTimeLocal(desde));
    setInputDateTime("fHastaSistema", toDateTimeLocal(hasta));
}

async function cargarAuditoriaLogin() {
    const tbody = document.getElementById("tablaAuditoriaLogin");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" class="text-center">Cargando auditoria...</td></tr>';

    const params = new URLSearchParams();
    params.set("page", String(auditoriaState.page));
    params.set("size", String(auditoriaState.size));

    const desde = getInputValue("fDesde");
    const hasta = getInputValue("fHasta");
    const tipoEvento = getInputValue("fTipoEvento");
    const resultado = getInputValue("fResultado");
    const q = getInputValue("fBusqueda");

    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (tipoEvento) params.set("tipoEvento", tipoEvento);
    if (resultado) params.set("resultado", resultado);
    if (q) params.set("q", q);

    try {
        const res = await fetch(`/api/auditoria/login?${params.toString()}`);
        if (!res.ok) throw new Error("No se pudo cargar la auditoria");

        const data = await res.json();
        renderAuditoriaLogin(data);
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error al cargar auditoria</td></tr>';
        actualizarFooterAuditoria(0, 0, 0);
    }
}

async function cargarAuditoriaSistema(force = false) {
    const tbody = document.getElementById("tablaAuditoriaSistema");
    if (!tbody) return;

    if (auditoriaSistemaState.loaded && !force) return;

    tbody.innerHTML = '<tr><td colspan="11" class="text-center">Cargando auditoria del sistema...</td></tr>';

    const params = new URLSearchParams();
    params.set("page", String(auditoriaSistemaState.page));
    params.set("size", String(auditoriaSistemaState.size));

    const desde = getInputValue("fDesdeSistema");
    const hasta = getInputValue("fHastaSistema");
    const accion = getInputValue("fAccionSistema");
    const tabla = getInputValue("fTablaSistema");
    const q = getInputValue("fBusquedaSistema");

    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (accion) params.set("accion", accion);
    if (tabla) params.set("tabla", tabla);
    if (q) params.set("q", q);

    try {
        const data = await fetchAuditoriaDetallada(params);
        renderAuditoriaSistema(data);
        auditoriaSistemaState.loaded = true;
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error al cargar auditoria del sistema</td></tr>';
        actualizarFooterAuditoriaSistema(0, 0, 0);
    }
}

async function fetchAuditoriaDetallada(params) {
    // Preferimos el endpoint con nombre explicito; si no existe, caemos al GET base.
    const qs = params ? `?${params.toString()}` : "";
    const preferido = await fetch(`/api/auditoria/detallada${qs}`);
    if (preferido.ok) return preferido.json();

    const fallback = await fetch(`/api/auditoria${qs}`);
    if (!fallback.ok) throw new Error("No se pudo cargar la auditoria detallada");
    return fallback.json();
}

function renderAuditoriaSistema(data) {
    const tbody = document.getElementById("tablaAuditoriaSistema");
    if (!tbody) return;

    auditoriaSistemaState.cache.clear();

    const content = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);

    // Respuesta puede ser un DTO propio o un Spring Data Page:
    // - DTO: { content, page, size, totalPages, totalElements }
    // - Page: { content, number, size, totalPages, totalElements, ... }
    auditoriaSistemaState.page = Number.isInteger(data?.page) ? data.page
        : (Number.isInteger(data?.number) ? data.number : auditoriaSistemaState.page);
    auditoriaSistemaState.size = Number.isInteger(data?.size) ? data.size : auditoriaSistemaState.size;
    auditoriaSistemaState.totalPages = Number.isInteger(data?.totalPages) ? data.totalPages : (content.length === 0 ? 0 : 1);
    auditoriaSistemaState.totalElements = Number.isFinite(data?.totalElements) ? data.totalElements : content.length;

    if (content.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">Sin registros</td></tr>';
        actualizarFooterAuditoriaSistema(auditoriaSistemaState.totalElements, auditoriaSistemaState.page, auditoriaSistemaState.totalPages);
        return;
    }

    content.forEach((row) => {
        if (row?.id !== null && row?.id !== undefined) {
            auditoriaSistemaState.cache.set(Number(row.id), row);
        }
    });

    const startIndex = auditoriaSistemaState.page * auditoriaSistemaState.size;
    const html = content.map((row, index) => {
        const id = formatoId(row?.id);
        const idRegistro = formatoId(row?.idRegistro);
        const usuarioId = formatoId(row?.usuarioId);
        const usuarioNombre = row?.usuarioNombre || "-";
        const ua = row?.userAgent || "-";
        const accion = row?.accion || "-";
        const tabla = row?.tabla || "-";
        const ip = row?.ip || "-";

        const idNum = Number(row?.id);
        const btnDisabled = Number.isFinite(idNum) ? "" : "disabled";

        return `
            <tr>
                <td class="row-num">${String(startIndex + index + 1).padStart(2, "0")}</td>
                <td>${escapeHtml(id)}</td>
                <td>${escapeHtml(formatearFecha(row?.fecha))}</td>
                <td>${escapeHtml(tabla)}</td>
                <td>${escapeHtml(idRegistro)}</td>
                <td><span class="badge bg-primary">${escapeHtml(accion)}</span></td>
                <td>${escapeHtml(usuarioNombre)}</td>
                <td>${escapeHtml(usuarioId)}</td>
                <td>${escapeHtml(ip)}</td>
                <td class="audit-col-ua" title="${escapeHtml(ua)}">${escapeHtml(ua)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-primary" data-action="ver-info" data-id="${escapeHtml(id)}" ${btnDisabled}>Ver info</button>
                </td>
            </tr>
        `;
    }).join("");

    tbody.innerHTML = html;
    actualizarFooterAuditoriaSistema(auditoriaSistemaState.totalElements, auditoriaSistemaState.page, auditoriaSistemaState.totalPages);
}

function actualizarFooterAuditoriaSistema(totalElements, page, totalPages) {
    const totalSpan = document.getElementById("totalAuditoriaSistema");
    const pageInfo = document.getElementById("pageInfoAuditoriaSistema");
    const btnPrev = document.getElementById("btnPrevAuditoriaSistema");
    const btnNext = document.getElementById("btnNextAuditoriaSistema");

    if (totalSpan) {
        totalSpan.textContent = `Mostrando ${totalElements} registro${totalElements === 1 ? "" : "s"}`;
    }
    if (pageInfo) {
        const pageText = totalPages === 0 ? "0" : String(page + 1);
        pageInfo.textContent = `Pagina ${pageText} de ${totalPages}`;
    }
    if (btnPrev) btnPrev.disabled = page <= 0;
    if (btnNext) btnNext.disabled = totalPages === 0 || page + 1 >= totalPages;
}

function abrirModalAuditoriaSistema(id) {
    const row = auditoriaSistemaState.cache.get(Number(id));
    if (!row) return;

    setText("audSisInfoId", formatoId(row.id));
    setText("audSisInfoFecha", formatearFecha(row.fecha));
    setText("audSisInfoTabla", row.tabla || "-");
    setText("audSisInfoIdRegistro", formatoId(row.idRegistro));
    setText("audSisInfoAccion", row.accion || "-");
    setText("audSisInfoUsuarioNombre", row.usuarioNombre || "-");
    setText("audSisInfoUsuarioId", formatoId(row.usuarioId));
    setText("audSisInfoIp", row.ip || "-");
    setText("audSisInfoUserAgent", row.userAgent || "-");

    setPre("audSisInfoDatosAntes", formatJson(row.datosAntes));
    setPre("audSisInfoDatosDespues", formatJson(row.datosDespues));

    const el = document.getElementById("modalAuditoriaSistemaInfo");
    if (!el || typeof bootstrap === "undefined") return;
    bootstrap.Modal.getOrCreateInstance(el).show();
}

function renderAuditoriaLogin(data) {
    const tbody = document.getElementById("tablaAuditoriaLogin");
    if (!tbody) return;

    const content = Array.isArray(data?.content) ? data.content : [];
    auditoriaState.page = Number.isInteger(data?.page) ? data.page : 0;
    auditoriaState.size = Number.isInteger(data?.size) ? data.size : auditoriaState.size;
    auditoriaState.totalPages = Number.isInteger(data?.totalPages) ? data.totalPages : 0;
    auditoriaState.totalElements = Number.isInteger(data?.totalElements) ? data.totalElements : 0;

    if (content.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Sin registros para los filtros seleccionados</td></tr>';
        actualizarFooterAuditoria(auditoriaState.totalElements, auditoriaState.page, auditoriaState.totalPages);
        return;
    }

    const startIndex = auditoriaState.page * auditoriaState.size;
    const html = content.map((row, index) => `
        <tr>
            <td class="row-num">${String(startIndex + index + 1).padStart(2, "0")}</td>
            <td>${escapeHtml(formatearFecha(row.fecha))}</td>
            <td><span class="badge bg-primary">${escapeHtml(row.tipoEvento || "-")}</span></td>
            <td>${escapeHtml(row.usuarioEmail || "-")}</td>
            <td>${escapeHtml(formatoId(row.idUsuario))}</td>
            <td>${escapeHtml(row.ip || "-")}</td>
            <td class="audit-col-ua" title="${escapeHtml(row.userAgent || "-")}">${escapeHtml(row.userAgent || "-")}</td>
            <td>${escapeHtml(row.motivoDetalle || "-")}</td>
            <td>${badgeResultado(row.resultado)}</td>
        </tr>
    `).join("");

    tbody.innerHTML = html;
    actualizarFooterAuditoria(auditoriaState.totalElements, auditoriaState.page, auditoriaState.totalPages);
}

function badgeResultado(resultado) {
    const valor = (resultado || "").toUpperCase();
    if (valor === "EXITOSO") {
        return '<span class="badge bg-success">EXITOSO</span>';
    }
    if (valor === "FALLIDO") {
        return '<span class="badge bg-danger">FALLIDO</span>';
    }
    return `<span class="badge bg-secondary">${escapeHtml(resultado || "-")}</span>`;
}

function actualizarFooterAuditoria(totalElements, page, totalPages) {
    const totalSpan = document.getElementById("totalAuditoriaLogin");
    const pageInfo = document.getElementById("pageInfoAuditoria");
    const btnPrev = document.getElementById("btnPrevAuditoria");
    const btnNext = document.getElementById("btnNextAuditoria");

    if (totalSpan) {
        totalSpan.textContent = `Mostrando ${totalElements} registro${totalElements === 1 ? "" : "s"}`;
    }
    if (pageInfo) {
        const pageText = totalPages === 0 ? "0" : String(page + 1);
        pageInfo.textContent = `Pagina ${pageText} de ${totalPages}`;
    }
    if (btnPrev) btnPrev.disabled = page <= 0;
    if (btnNext) btnNext.disabled = totalPages === 0 || page + 1 >= totalPages;
}

function limpiarFiltrosAuditoria() {
    setInputDateTime("fDesde", "");
    setInputDateTime("fHasta", "");
    setInputValue("fTipoEvento", "");
    setInputValue("fResultado", "");
    setInputValue("fBusqueda", "");
    auditoriaState.page = 0;
    cargarAuditoriaLogin();
}

function limpiarFiltrosAuditoriaSistema() {
    iniciarFiltrosSistemaPorDefecto();
    setInputValue("fAccionSistema", "");
    setInputValue("fTablaSistema", "");
    setInputValue("fBusquedaSistema", "");
    auditoriaSistemaState.page = 0;
    cargarAuditoriaSistema(true);
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return "-";
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return fechaIso;
    return fecha.toLocaleString();
}

function formatoId(value) {
    return value === null || value === undefined ? "-" : String(value);
}

function toDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getInputValue(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
}

function setInputDateTime(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value === null || value === undefined || value === "" ? "-" : String(value);
}

function setPre(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value === null || value === undefined || value === "" ? "-" : String(value);
}

function formatJson(value) {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") return "-";
        try {
            return JSON.stringify(JSON.parse(trimmed), null, 2);
        } catch {
            return value;
        }
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
