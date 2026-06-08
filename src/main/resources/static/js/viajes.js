document.addEventListener("DOMContentLoaded", () => {
    const btnNuevoViaje = document.getElementById("btnNuevoViaje");
    const viewModal = document.getElementById("viajeViewModal");
    const btnCerrarViajeView = document.getElementById("btnCerrarViajeView");
    const viajeViewBody = document.getElementById("viajeViewBody");
    const viewModalTitle = viewModal?.querySelector(".mp-modal-title");

    let tiposGastoCache = [];
    const notify = (type, message, title) => window.mpAlert?.[type]?.(message, title) || window.alert(message);

    const tipoGastoMap = {
        combustible: 1,
        viaticos: 2,
        peaje: 3,
        mantenimiento: 4
    };
    let tiposGastoCargados = false;
    let estadosViajeCargados = false;
    let lotesDisponibles = [];
    let lotesCargados = false;

    const getLoteId = lote => Number(lote?.idLote ?? lote?.id_lote ?? lote?.id);

    const escapeHtml = text => {
        if (!text) return "";
        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    };

    const parseNumber = value => {
        const number = Number.parseFloat(value);
        return Number.isNaN(number) ? 0 : number;
    };

    const parseDateSafe = value => {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const formatMoney = value => {
        return new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(value || 0);
    };

    const formatDateTimeHuman = value => {
        const d = parseDateSafe(value);
        if (!d) return "-";
        const pad = num => String(num).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const formatDurationHuman = (inicio, fin) => {
        const d1 = parseDateSafe(inicio);
        const d2 = parseDateSafe(fin);
        if (!d1 || !d2) return "-";
        const diff = d2.getTime() - d1.getTime();
        if (diff <= 0) return "-";
        let remaining = diff;
        const dias = Math.floor(remaining / 86400000);
        remaining -= dias * 86400000;
        const horas = Math.floor(remaining / 36e5);
        remaining -= horas * 36e5;
        const mins = Math.floor(remaining / 60000);
        const parts = [];
        if (dias > 0) parts.push(`${dias}d`);
        if (horas > 0) parts.push(`${horas}h`);
        if (mins > 0 || !parts.length) parts.push(`${mins}m`);
        return parts.join(" ");
    };

    const safeHref = value => {
        if (!value) return "";
        try {
            const u = new URL(value, window.location.origin);
            return u.href;
        } catch {
            return "";
        }
    };

    // --- LISTING & PAGINATION STATE ---
    const listaViajes = document.getElementById("listaViajes");
    const paginacionViajes = {
        page: 0,
        size: Number(document.getElementById("tamanoPaginaViajes")?.value) || 10,
        totalPages: 1,
        totalElements: 0
    };
    const filtrosViajes = {q: "", estado: "", fechaInicio: "", fechaFin: "", excluirCompletados: false};
    let viajesCache = [];
    let debounceViajes = null;

    async function cargarViajes(page = paginacionViajes.page) {
        if (!listaViajes) return;
        listaViajes.innerHTML = '<div class="text-center py-4 text-muted">Cargando viajes...</div>';
        const pageSeguro = Math.max(0, Number(page) || 0);
        const sizeSeguro = Math.max(1, Number(paginacionViajes.size) || 10);
        try {
            const query = new URLSearchParams({
                page: String(pageSeguro),
                size: String(sizeSeguro)
            });
            if (filtrosViajes.q) query.set("q", filtrosViajes.q);
            if (filtrosViajes.estado) query.set("estado", filtrosViajes.estado);
            query.set("excluirCompletados", String(filtrosViajes.excluirCompletados));
            if (filtrosViajes.fechaInicio) query.set("fechaInicio", filtrosViajes.fechaInicio);
            if (filtrosViajes.fechaFin) query.set("fechaFin", filtrosViajes.fechaFin);

            const res = await fetch(`/api/viajes?${query.toString()}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar viajes");
            const pageData = await res.json();

            paginacionViajes.page = Number(pageData?.number ?? pageSeguro);
            paginacionViajes.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            paginacionViajes.totalElements = Number(pageData?.totalElements ?? 0);
            viajesCache = Array.isArray(pageData?.content) ? pageData.content : [];

            renderViajes();
        } catch (error) {
            console.error(error);
            listaViajes.innerHTML = '<div class="text-center py-4 text-danger">Error al cargar viajes</div>';
        }
    }

    // ─── NUEVA buildTramoCard: layout horizontal en fila ───────────────────────
    function buildTramoCard(tramo, tipoKey, idViaje) {
        if (!tramo) {
            const label = tipoKey === 'ida' ? 'Ida' : 'Vuelta';
            return `<div class="tleg-empty">
                <span class="tleg-empty-icon">${tipoKey === 'ida' ? '' : ''}</span>
                <span>Sin tramo de ${escapeHtml(label)}</span>
            </div>`;
        }

        const estadoKey   = String(tramo.estadoViaje || tramo.estado || '').toLowerCase().replaceAll(' ', '_');
        const estadoLabel = String(tramo.estadoViaje || tramo.estado || '-').replaceAll('_', ' ');
        const tramoId     = tramo.id ?? '';

        const paisSal  = escapeHtml(String(tramo.paisSalida  || '-').replaceAll('_', ' '));
        const paisDest = escapeHtml(String(tramo.paisDestino || '-').replaceAll('_', ' '));
        const fechaSal = escapeHtml(formatDateTimeHuman(tramo.fechaSalida));
        const fechaLle = escapeHtml(formatDateTimeHuman(tramo.fechaEntrada));
        const camion   = escapeHtml(tramo.camionNombre
            ? `${tramo.camionNombre}${tramo.camionPlaca ? ' · ' + tramo.camionPlaca : ''}`
            : '-');
        const chofer   = escapeHtml(tramo.conductorNombre || '-');

        const isPagado      = Boolean(tramo.pagado);
        const isIva         = Boolean(tramo.iva);
        const gastoTramo    = parseNumber(tramo.gastoTotal);
        const ingresoTramo  = parseNumber(tramo.precioTramo ?? tramo.precio ?? 0);
        const gananciaTramo = ingresoTramo - gastoTramo;

        const isIdaClass    = tipoKey === 'ida' ? 'tleg-ida'     : 'tleg-vuelta';
        const indicatorCls  = tipoKey === 'ida' ? 'tleg-ind-ida' : 'tleg-ind-vuelta';
        const emoji         = tipoKey === 'ida' ? '' : '';
        const tipoLabel     = tipoKey === 'ida' ? 'Ida' : 'Vuelta';

        return `
        <div class="tleg-card ${isIdaClass}"
             data-tramo-id="${escapeHtml(String(tramoId))}"
             data-tramo-tipo="${tipoKey}"
             data-viaje-id-edit="${escapeHtml(String(idViaje))}">

            <!-- Col 1: Badge tipo -->
            <div>
                <span class="tleg-indicator ${indicatorCls}">${emoji} ${tipoLabel}</span>
            </div>

            <!-- Col 2: Camión / Chofer -->
            <div class="tleg-col-vehicle">
                <div class="tleg-sub">Camión · Chofer</div>
                <div class="tleg-val">${camion}</div>
                <div class="tleg-val" style="color:#6b7280;font-weight:400">${chofer}</div>
            </div>

            <!-- Col 3: Ruta + Fechas -->
            <div class="tleg-col-route">
                <div class="tleg-route-line">${paisSal} → ${paisDest}</div>
                <div class="tleg-dates">${fechaSal} → ${fechaLle}</div>
            </div>

            <!-- Col 4: Gasto / Ganancia + Status -->
            <div class="tleg-col-finance">
                <div class="tleg-fin-row">
                    <span class="tleg-fin-label">Gastos</span>
                    <span class="tleg-fin-val text-danger">${formatMoney(gastoTramo)}</span>
                </div>
                <div class="tleg-fin-row">
                    <span class="tleg-fin-label">Ganancia</span>
                    <span class="tleg-fin-val ${gananciaTramo >= 0 ? 'text-success' : 'text-danger'}">${formatMoney(gananciaTramo)}</span>
                </div>
                <div class="mt-1">
                    <span class="status-badge status-${escapeHtml(estadoKey)}">${escapeHtml(estadoLabel)}</span>
                </div>
            </div>

            <!-- Col 5: Toggles Pagado / IVA -->
            <div class="tleg-col-toggles" onclick="event.stopPropagation();">
                <button type="button"
                    class="tleg-toggle-btn ${isPagado ? 'tleg-toggle-on' : 'tleg-toggle-off'}"
                    data-toggle-field="pagado"
                    data-tramo-id="${escapeHtml(String(tramoId))}"
                    data-viaje-id="${escapeHtml(String(idViaje))}"
                    title="${isPagado ? 'Marcar como pendiente' : 'Marcar como pagado'}">
                    <span class="tleg-toggle-dot"></span>
                    <span class="tleg-toggle-label">Pagado</span>
                </button>
                <button type="button"
                    class="tleg-toggle-btn ${isIva ? 'tleg-toggle-iva-on' : 'tleg-toggle-off'}"
                    data-toggle-field="iva"
                    data-tramo-id="${escapeHtml(String(tramoId))}"
                    data-viaje-id="${escapeHtml(String(idViaje))}"
                    title="${isIva ? 'Quitar IVA' : 'Aplicar IVA 13%'}">
                    <span class="tleg-toggle-dot"></span>
                    <span class="tleg-toggle-label">IVA</span>
                </button>
            </div>

            <!-- Col 6: Hint -->
            <div class="tleg-edit-hint">Toca para editar →</div>
        </div>`;
    }

    function renderViajes() {
        if (!listaViajes) return;
        if (!viajesCache.length) {
            listaViajes.innerHTML = '<div class="text-center py-4 text-muted">No se encontraron viajes.</div>';
            const total = document.getElementById("totalViajes");
            if (total) total.textContent = "Mostrando 0 viajes";
            actualizarPaginacionViajes();
            return;
        }

        listaViajes.innerHTML = viajesCache.map(viaje => {
            const ida    = Array.isArray(viaje.listaIDa)    ? viaje.listaIDa[0]    : null;
            const vuelta = Array.isArray(viaje.listaVuelta) ? viaje.listaVuelta[0] : null;
            const idViaje = viaje.id_viaje ?? viaje.idViaje ?? '';

            const lotes = Array.isArray(viaje.lotes) ? viaje.lotes : [];
            const totalLotes = Number(viaje.totalLotes ?? lotes.length) || lotes.length;
            let valorTotalLotes = 0;
            lotes.forEach(l => { valorTotalLotes += parseFloat(l.valorDeclarado || l.valor_declarado) || 0; });

            const gastoIda    = parseNumber(ida?.gastoTotal);
            const gastoVuelta = parseNumber(vuelta?.gastoTotal);
            const gastoTotal  = gastoIda + gastoVuelta;

            const hasIvaIda    = Boolean(ida?.iva);
            const hasIvaVuelta = Boolean(vuelta?.iva);
            const ivaIda       = hasIvaIda    ? valorTotalLotes * 0.13 : 0;
            const ivaVuelta    = hasIvaVuelta ? valorTotalLotes * 0.13 : 0;
            const totalIva     = ivaIda + ivaVuelta;
            const gananciaTotal = valorTotalLotes - gastoTotal - totalIva;

            return `
            <div class="vcard" data-viaje-id="${escapeHtml(String(idViaje))}">

                <!-- HEADER -->
                <div class="vcard-header">
                    <div class="vcard-title-group">
                        <span class="vcard-id">Viaje #${escapeHtml(String(idViaje))}</span>
                        <h3 class="vcard-name">${escapeHtml(viaje.nombreVieje || 'Sin nombre')}</h3>
                    </div>

                </div>

                <!-- BODY: tramos | stats -->
                <div class="vcard-body">

                    <!-- TRAMOS (filas horizontales) -->
                    <div class="vcard-legs">
                        ${buildTramoCard(ida, 'ida', idViaje)}
                        ${vuelta ? buildTramoCard(vuelta, 'vuelta', idViaje) : ''}
                    </div>

                    <!-- PANEL DE ESTADÍSTICAS -->
                    <div class="vcard-stats"
                         data-viaje-action="view"
                         data-viaje-id="${escapeHtml(String(idViaje))}"
                         title="Ver detalle completo">
                        <div class="vcard-stats-header">Estadísticas</div>
                        <div class="vcard-stat-row">
                            <span class="vcard-stat-label">Lotes</span>
                            <span class="vcard-stat-val">${totalLotes}</span>
                        </div>
                        <div class="vcard-stat-row">
                            <span class="vcard-stat-label">Valor lotes</span>
                            <span class="vcard-stat-val">${formatMoney(valorTotalLotes)}</span>
                        </div>
                        <div class="vcard-stat-divider"></div>
                        <div class="vcard-stat-row">
                            <span class="vcard-stat-label">Gasto Ida</span>
                            <span class="vcard-stat-val text-danger">${formatMoney(gastoIda)}</span>
                        </div>
                        <div class="vcard-stat-row">
                            <span class="vcard-stat-label">Gasto Vuelta</span>
                            <span class="vcard-stat-val text-danger">${formatMoney(gastoVuelta)}</span>
                        </div>
                        <div class="vcard-stat-row">
                            <span class="vcard-stat-label">Total Gastado</span>
                            <span class="vcard-stat-val text-danger fw-bold">${formatMoney(gastoTotal)}</span>
                        </div>
                        <div class="vcard-stat-divider"></div>
                        <div class="vcard-stat-row vcard-stat-ganancia">
                            <span class="vcard-stat-label">Ganancia Total</span>
                            <span class="vcard-stat-val fw-bold ${gananciaTotal >= 0 ? 'text-success' : 'text-danger'}">${formatMoney(gananciaTotal)}</span>
                        </div>
                        <div class="vcard-stats-hint">Toca para ver todo →</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        const inicio = paginacionViajes.page * paginacionViajes.size;
        const fin = inicio + viajesCache.length;
        const total = document.getElementById('totalViajes');
        if (total) total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionViajes.totalElements} viajes`;
        actualizarPaginacionViajes();
    }

    function actualizarPaginacionViajes() {
        const btnPrev = document.getElementById("btnPrevViajes");
        const btnNext = document.getElementById("btnNextViajes");
        const label   = document.getElementById("paginaActualViajes");
        const actual  = paginacionViajes.page + 1;
        const total   = Math.max(paginacionViajes.totalPages, 1);
        const prevDis = paginacionViajes.page <= 0;
        const nextDis = paginacionViajes.page >= total - 1;

        if (btnPrev) {
            btnPrev.disabled = prevDis;
            btnPrev.parentElement?.classList.toggle("disabled", prevDis);
        }
        if (btnNext) {
            btnNext.disabled = nextDis;
            btnNext.parentElement?.classList.toggle("disabled", nextDis);
        }
        if (label) label.textContent = `${actual} / ${total}`;
    }


    // --- VIEW DETAILS MODAL ---
    const abrirModalVerViaje = async viajeId => {
        if (!viajeId) return;
        if (!viewModal) return;
        viewModal.classList.add("is-open");
        if (viajeViewBody) viajeViewBody.innerHTML = "Cargando...";
        if (viewModalTitle) viewModalTitle.textContent = "Detalle del viaje";
        try {
            await cargarLotesDisponibles();
            await renderViajeDetalleView(viajeId);
        } catch (error) {
            console.error(error);
            if (viajeViewBody) {
                viajeViewBody.innerHTML = '<div class="text-danger text-center py-4">Error al cargar el viaje</div>';
            }
        }
    };

    const cerrarModalVerViaje = () => {
        if (!viewModal) return;
        viewModal.classList.remove("is-open");
    };

    btnCerrarViajeView?.addEventListener("click", cerrarModalVerViaje);
    viewModal?.querySelector(".mp-modal-backdrop")?.addEventListener("click", cerrarModalVerViaje);
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && viewModal?.classList.contains("is-open")) cerrarModalVerViaje();
    });

    async function cargarLotesDisponibles() {
        if (lotesCargados) return;
        try {
            const res = await fetch("/api/lotes", {credentials: "same-origin"});
            if (res.ok) {
                const data = await res.json();
                lotesDisponibles = Array.isArray(data) ? data : [];
                lotesCargados = true;
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function ensureTiposGastoCache() {
        if (tiposGastoCargados && tiposGastoCache.length) return;
        try {
            const res = await fetch("/api/tipogasto");
            if (res.ok) {
                const data = await res.json();
                tiposGastoCache = Array.isArray(data) ? data : [];
                tiposGastoCache.forEach(tipo => {
                    if (!tipo?.tipoGasto) return;
                    tipoGastoMap[String(tipo.tipoGasto).toLowerCase()] = Number(tipo.id);
                });
                tiposGastoCargados = true;
            }
        } catch (error) {
            console.error(error);
        }
    }

    const resolveTipoLabel = idTipo => {
        if (!idTipo) return "-";
        const match = tiposGastoCache.find(t => Number(t.id) === Number(idTipo));
        return match?.tipoGasto || `Tipo #${idTipo}`;
    };

    async function renderViajeDetalleView(idViaje) {
        if (!viajeViewBody) return;
        await ensureTiposGastoCache();

        const res = await fetch(`/api/viajes/${idViaje}`, {credentials: "same-origin"});
        if (!res.ok) throw new Error("No se pudo cargar el viaje");
        const data = await res.json();

        const tramos  = Array.isArray(data.tramos) ? data.tramos : [];
        const ida     = tramos.find(t => String(t.tipoTramo).toLowerCase() === "ida")    || null;
        const vuelta  = tramos.find(t => String(t.tipoTramo).toLowerCase() === "vuelta") || null;

        const calcGastos  = tramo => (tramo?.gastos || []).reduce((sum, g) => sum + (Number(g?.monto) || 0), 0);
        const gastosIda   = calcGastos(ida);
        const gastosVuelta= calcGastos(vuelta);
        const totalGastos = gastosIda + gastosVuelta;

        const loteIds = Array.isArray(data.loteIds) ? data.loteIds.map(Number).filter(Boolean) : [];
        const lotesLabel = loteIds.length
            ? loteIds.map(id => {
                const match = lotesDisponibles.find(l => getLoteId(l) === id);
                return match?.numeroLote || `#${id}`;
            }).join(", ")
            : "-";

        const salidaTotal  = [ida?.fechaSalida, vuelta?.fechaSalida].map(parseDateSafe).filter(Boolean)
            .sort((a, b) => a.getTime() - b.getTime())[0] || null;
        const llegadaTotal = [ida?.fechaEntrada, vuelta?.fechaEntrada].map(parseDateSafe).filter(Boolean)
            .sort((a, b) => b.getTime() - a.getTime())[0] || null;
        const duracionTotal = salidaTotal && llegadaTotal ? formatDurationHuman(salidaTotal, llegadaTotal) : "-";

        let valorTotalLotes = 0;
        const lotesAsignados = Array.isArray(data.lotesAsignados) ? data.lotesAsignados : [];
        lotesAsignados.forEach(l => { valorTotalLotes += parseFloat(l.valorDeclarado) || 0; });

        const hasIva         = tramos.some(t => Boolean(t.iva));
        const ivaCalculado   = valorTotalLotes * 0.13;
        const totalIva       = hasIva ? ivaCalculado : 0;
        const gananciaCalculada = valorTotalLotes - totalGastos - totalIva;

        const renderGastosTable = gastos => {
            const list = Array.isArray(gastos) ? gastos : [];
            if (!list.length) return '<div class="text-muted small">Sin gastos registrados.</div>';
            const rows = list.map(g => {
                const tipo = resolveTipoLabel(g.idTipoGasto);
                const desc = escapeHtml(g.descripcion || "-");
                const monto= formatMoney(Number(g.monto) || 0);
                const fecha= escapeHtml(g.fechaGasto || "-");
                const href = safeHref(g.evidenciaUrl);
                const evidencia = href
                    ? `<a class="btn btn-outline-secondary btn-sm py-0" href="${escapeHtml(href)}" target="_blank" rel="noopener">Ver</a>`
                    : "-";
                return `<tr>
                    <td>${escapeHtml(tipo)}</td>
                    <td>${desc}</td>
                    <td class="text-end fw-semibold text-danger">${monto}</td>
                    <td>${fecha}</td>
                    <td class="text-end">${evidencia}</td>
                </tr>`;
            }).join("");
            return `
                <div class="table-responsive">
                    <table class="table table-sm table-bordered align-middle mb-0" style="font-size:0.85rem">
                        <thead class="table-light">
                            <tr>
                                <th>Tipo</th><th>Descripción</th>
                                <th class="text-end">Monto</th>
                                <th>Fecha</th><th class="text-end">Evidencia</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
        };

        const renderTramo = (titulo, tramo) => {
            if (!tramo) return `
                <div class="card bg-light border-0 mb-3 p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold">${escapeHtml(titulo)}</span>
                        <span class="badge bg-secondary">No registrado</span>
                    </div>
                    <div class="text-muted small">No hay datos para este tramo.</div>
                </div>`;

            const gastos   = calcGastos(tramo);
            const salida   = formatDateTimeHuman(tramo.fechaSalida);
            const llegada  = formatDateTimeHuman(tramo.fechaEntrada);
            const duracion = formatDurationHuman(tramo.fechaSalida, tramo.fechaEntrada);
            const badgeClass    = String(tramo.estadoViaje || "").toLowerCase() === "completado" ? "bg-success" : "bg-warning text-dark";
            const tramoPagado   = Boolean(tramo.pagado);
            const pagadoBadge   = tramoPagado ? "bg-success" : "bg-secondary";
            const pagadoLabel   = tramoPagado ? "Tramo Pagado" : "Pago Pendiente";

            return `
                <div class="card border mb-3 p-3">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="fw-bold text-primary">${escapeHtml(titulo)}</span>
                        <div class="d-flex gap-2">
                            <span class="badge ${badgeClass}">${escapeHtml(String(tramo.estadoViaje || "Pendiente").replaceAll("_", " "))}</span>
                            <span class="badge ${pagadoBadge}">${pagadoLabel}</span>
                        </div>
                    </div>
                    <div class="row g-2 mb-3 small">
                        <div class="col-md-6"><strong>Camión:</strong> ${escapeHtml(tramo.camionPlaca ? `${tramo.camionNombre || ""} (${tramo.camionPlaca})` : "-")}</div>
                        <div class="col-md-6"><strong>Chofer:</strong> ${escapeHtml(tramo.conductorNombre || "-")}</div>
                        <div class="col-md-6"><strong>Salida:</strong> ${escapeHtml(salida)}</div>
                        <div class="col-md-6"><strong>Llegada:</strong> ${escapeHtml(llegada)}</div>
                        <div class="col-md-6"><strong>Duración:</strong> ${escapeHtml(duracion)}</div>
                        <div class="col-md-6"><strong>Ruta:</strong> ${escapeHtml([tramo.paisSalida, tramo.paisDestino].filter(Boolean).join(" ➔ ") || "-")}</div>
                        <div class="col-12"><strong>Observaciones:</strong> ${escapeHtml(tramo.observaciones || "-")}</div>
                    </div>
                    <div class="border-top pt-2">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold small text-secondary">Gastos Tramo:</span>
                            <span class="fw-bold text-danger small">${formatMoney(gastos)}</span>
                        </div>
                        ${renderGastosTable(tramo.gastos)}
                    </div>
                </div>`;
        };

        viajeViewBody.innerHTML = `
            <div class="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-start">
                <div>
                    <h5 class="fw-bold text-dark mb-1">${escapeHtml(data.nombreViaje || "Sin Nombre")}</h5>
                    <p class="text-muted small mb-0">Contenedores: <span class="fw-bold text-dark">${escapeHtml(lotesLabel)}</span></p>
                </div>
                <span class="badge bg-secondary p-2">ID Viaje: ${data.idViaje}</span>
            </div>
            <div class="row">
                <div class="col-md-6">${renderTramo("🚛 Tramo Ida", ida)}</div>
                <div class="col-md-6">${renderTramo("↩ Tramo Vuelta", vuelta)}</div>
            </div>
            <div class="mt-3 border-top pt-3">
                <h6 class="fw-bold text-secondary mb-3 text-uppercase" style="font-size:0.85rem;letter-spacing:0.8px;">Resumen Consolidado del Viaje</h6>
                <div class="row g-3 text-center">
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-2 bg-light">
                            <div class="small text-muted mb-1">Duración Total</div>
                            <strong class="fs-6">${escapeHtml(duracionTotal)}</strong>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-2 bg-light">
                            <div class="small text-muted mb-1">Valor Contenedores</div>
                            <strong class="fs-6 text-primary">${formatMoney(valorTotalLotes)}</strong>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-2 bg-light">
                            <div class="small text-muted mb-1">Total Gastado</div>
                            <strong class="fs-6 text-danger">${formatMoney(totalGastos)}</strong>
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <div class="border rounded p-2 bg-light">
                            <div class="small text-muted mb-1">IVA Retenido (13%)</div>
                            <strong class="fs-6 text-warning">${formatMoney(totalIva)}</strong>
                        </div>
                    </div>
                    <div class="col-md-6 col-12 mx-auto mt-3">
                        <div class="border rounded p-3 bg-white border-2 border-primary shadow-sm">
                            <div class="small text-secondary fw-bold mb-1">Ganancia Neta Final</div>
                            <strong class="fs-4 ${gananciaCalculada >= 0 ? 'text-success' : 'text-danger'}">${formatMoney(gananciaCalculada)}</strong>
                        </div>
                    </div>
                </div>
            </div>`;
    }


    // --- REDIRECTS & CLICK HANDLERS ---
    btnNuevoViaje?.addEventListener("click", () => {
        window.location.href = "/viajes/formulario";
    });

    async function handleToggle(btn) {
        const field   = btn.dataset.toggleField;
        const tramoId = btn.dataset.tramoId;
        const viajeId = btn.dataset.viajeId;
        if (!field || !tramoId) return;

        const csrfToken  = document.querySelector('meta[name="_csrf"]')?.content || '';
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content || 'X-CSRF-TOKEN';
        const isOn  = btn.classList.contains('tleg-toggle-on') || btn.classList.contains('tleg-toggle-iva-on');
        const newVal = !isOn;

        btn.disabled = true;
        if (field === 'pagado') {
            btn.classList.toggle('tleg-toggle-on',  newVal);
            btn.classList.toggle('tleg-toggle-off', !newVal);
        } else {
            btn.classList.toggle('tleg-toggle-iva-on', newVal);
            btn.classList.toggle('tleg-toggle-off',    !newVal);
        }
        btn.title = newVal
            ? (field === 'pagado' ? 'Marcar como pendiente' : 'Quitar IVA')
            : (field === 'pagado' ? 'Marcar como pagado'    : 'Aplicar IVA 13%');

        try {
            const res = await fetch(`/api/viajes/tramo/${tramoId}/${field}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', [csrfHeader]: csrfToken},
                credentials: 'same-origin',
                body: JSON.stringify({valor: newVal})
            });
            if (!res.ok) throw new Error('Error al guardar');
            const vId    = Number(viajeId);
            const cached = viajesCache.find(v => (v.id_viaje ?? v.idViaje) === vId);
            if (cached) {
                ['listaIDa', 'listaVuelta'].forEach(key => {
                    const tramo = Array.isArray(cached[key]) ? cached[key][0] : null;
                    if (tramo && String(tramo.id) === String(tramoId)) tramo[field] = newVal;
                });
            }
        } catch (err) {
            console.error(err);
            if (field === 'pagado') {
                btn.classList.toggle('tleg-toggle-on',  isOn);
                btn.classList.toggle('tleg-toggle-off', !isOn);
            } else {
                btn.classList.toggle('tleg-toggle-iva-on', isOn);
                btn.classList.toggle('tleg-toggle-off',    !isOn);
            }
            notify('error', 'No se pudo guardar el cambio', 'Error');
        } finally {
            btn.disabled = false;
        }
    }

    listaViajes?.addEventListener("click", event => {
        const toggleBtn = event.target.closest('[data-toggle-field]');
        if (toggleBtn) {
            event.preventDefault();
            event.stopPropagation();
            handleToggle(toggleBtn);
            return;
        }

        const statsCard = event.target.closest('[data-viaje-action="view"]');
        if (statsCard) {
            event.preventDefault();
            event.stopPropagation();
            abrirModalVerViaje(statsCard.dataset.viajeId);
            return;
        }

        const actionBtn = event.target.closest('[data-viaje-action="edit"]');
        if (actionBtn) {
            event.preventDefault();
            event.stopPropagation();
            window.location.href = '/viajes/formulario?id=' + actionBtn.dataset.viajeId;
            return;
        }

        const tramoCard = event.target.closest('.tleg-card');
        if (tramoCard) {
            event.preventDefault();
            const viajeId = tramoCard.dataset.viajeIdEdit;
            if (viajeId) window.location.href = '/viajes/formulario?id=' + viajeId;
            return;
        }
    });

    document.getElementById("btnPrevViajes")?.addEventListener("click", () => {
        cargarViajes(paginacionViajes.page - 1);
    });
    document.getElementById("btnNextViajes")?.addEventListener("click", () => {
        cargarViajes(paginacionViajes.page + 1);
    });
    document.getElementById("tamanoPaginaViajes")?.addEventListener("change", event => {
        paginacionViajes.size = Number(event.target.value) || 10;
        cargarViajes(0);
    });

    document.getElementById("filtroBusquedaViajes")?.addEventListener("input", event => {
        clearTimeout(debounceViajes);
        debounceViajes = setTimeout(() => {
            filtrosViajes.q = event.target.value.trim();
        }, 250);
    });

    document.getElementById("btnAplicarFiltrosViajes")?.addEventListener("click", () => {
        const inputBuscar  = document.getElementById("filtroBusquedaViajes");
        const inputInicio  = document.getElementById("filtroFechaInicioViajes");
        const inputFin     = document.getElementById("filtroFechaFinViajes");
        const selectEstado = document.getElementById("filtroEstadoViajes");

        filtrosViajes.q           = inputBuscar?.value.trim() || "";
        filtrosViajes.fechaInicio = inputInicio?.value || "";
        filtrosViajes.fechaFin    = inputFin?.value    || "";

        const estadoSeleccionado = selectEstado?.value || "";
        if (estadoSeleccionado === "__activos__") {
            filtrosViajes.estado = "";
            filtrosViajes.excluirCompletados = true;
        } else {
            filtrosViajes.estado = estadoSeleccionado;
            filtrosViajes.excluirCompletados = false;
        }
        cargarViajes(0);
    });

    document.getElementById("btnLimpiarFiltrosViajes")?.addEventListener("click", () => {
        filtrosViajes.q = "";
        filtrosViajes.estado = "";
        filtrosViajes.fechaInicio = "";
        filtrosViajes.fechaFin = "";
        filtrosViajes.excluirCompletados = false;

        const inputBuscar  = document.getElementById("filtroBusquedaViajes");
        const inputInicio  = document.getElementById("filtroFechaInicioViajes");
        const inputFin     = document.getElementById("filtroFechaFinViajes");
        const selectEstado = document.getElementById("filtroEstadoViajes");

        if (inputBuscar)  inputBuscar.value  = "";
        if (inputInicio)  inputInicio.value  = "";
        if (inputFin)     inputFin.value     = "";
        if (selectEstado) selectEstado.value = "";
        cargarViajes(0);
    });

    async function cargarEstadosViaje() {
        const selectFiltro = document.getElementById("filtroEstadoViajes");
        if (!selectFiltro) return;
        try {
            const res = await fetch("/api/viajes/estados");
            if (res.ok) {
                const estados = await res.json();
                selectFiltro.innerHTML = '<option value="" selected>Todos los estados</option>';
                const activosOption = document.createElement("option");
                activosOption.value = "__activos__";
                activosOption.textContent = "Viajes activos";
                selectFiltro.appendChild(activosOption);
                estados.forEach(estado => {
                    const option = document.createElement("option");
                    option.value       = String(estado).replaceAll("_", " ");
                    option.textContent = String(estado).replaceAll("_", " ");
                    selectFiltro.appendChild(option);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    //----------------------------

    function actualizarMetricas() {
        let gastosTotales = 0;
        let tramosActivos = 0;
        let lotesEnTransito = 0;

        const estadosActivos = ['cargando', 'en_camino', 'descargando', 'con_fallas'];

        viajesCache.forEach(viaje => {
            // Gastos: suma gastoTotal de ida + vuelta
            const ida    = Array.isArray(viaje.listaIDa)    ? viaje.listaIDa[0]    : null;
            const vuelta = Array.isArray(viaje.listaVuelta) ? viaje.listaVuelta[0] : null;

            gastosTotales += parseNumber(ida?.gastoTotal)    || 0;
            gastosTotales += parseNumber(vuelta?.gastoTotal) || 0;

            // Tramos activos: cualquier tramo cuyo estado NO sea completado/cancelado
            [ida, vuelta].forEach(t => {
                if (!t) return;
                const estado = String(t.estadoViaje || t.estado || '').toLowerCase().replaceAll(' ', '_');
                if (estadosActivos.includes(estado)) tramosActivos++;
            });

            // Lotes en tránsito: lotes de viajes que tienen al menos un tramo activo
            const tieneTramoActivo = [ida, vuelta].some(t => {
                if (!t) return false;
                const estado = String(t.estadoViaje || t.estado || '').toLowerCase().replaceAll(' ', '_');
                return estadosActivos.includes(estado);
            });
            if (tieneTramoActivo) {
                const lotes = Array.isArray(viaje.lotes) ? viaje.lotes : [];
                lotesEnTransito += Number(viaje.totalLotes ?? lotes.length) || lotes.length;
            }
        });

        const elGastos  = document.getElementById('metricGastos');
        const elActivos = document.getElementById('metricActivos');
        const elLotes   = document.getElementById('metricLotes');

        if (elGastos)  elGastos.textContent  = formatMoney(gastosTotales);
        if (elActivos) elActivos.textContent = tramosActivos;
        if (elLotes)   elLotes.textContent   = lotesEnTransito;
    }


    actualizarMetricas();
    cargarEstadosViaje();
    cargarViajes(0);
});