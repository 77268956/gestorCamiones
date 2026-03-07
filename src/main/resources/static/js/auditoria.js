const auditoriaState = {
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0
};

document.addEventListener("DOMContentLoaded", () => {
    iniciarFiltrosPorDefecto();
    enlazarEventosAuditoria();
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

function iniciarFiltrosPorDefecto() {
    const hasta = new Date();
    const desde = new Date(hasta);
    desde.setDate(desde.getDate() - 7);

    setInputDateTime("fDesde", toDateTimeLocal(desde));
    setInputDateTime("fHasta", toDateTimeLocal(hasta));
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

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
