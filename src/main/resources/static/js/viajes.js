document.addEventListener("DOMContentLoaded", () => {
    const els = {
        btnNuevoViaje: document.getElementById("btnNuevoViaje"),
        viewModal: document.getElementById("viajeViewModal"),
        btnCerrarView: document.getElementById("btnCerrarViajeView"),
        viewBody: document.getElementById("viajeViewBody"),
        viewTitle: document.querySelector("#viajeViewModal .mp-modal-title"),
        lista: document.getElementById("listaViajes"),
        total: document.getElementById("totalViajes"),
        pageLabel: document.getElementById("paginaActualViajes"),
        btnPrev: document.getElementById("btnPrevViajes"),
        btnNext: document.getElementById("btnNextViajes"),
        sizeSelect: document.getElementById("tamanoPaginaViajes"),
        filtroQ: document.getElementById("filtroBusquedaViajes"),
        filtroInicio: document.getElementById("filtroFechaInicioViajes"),
        filtroFin: document.getElementById("filtroFechaFinViajes"),
        filtroEstado: document.getElementById("filtroEstadoViajes"),
        btnAplicar: document.getElementById("btnAplicarFiltrosViajes"),
        btnLimpiar: document.getElementById("btnLimpiarFiltrosViajes"),
        metricGastos: document.getElementById("metricGastos"),
        metricActivos: document.getElementById("metricActivos"),
        metricLotes: document.getElementById("metricLotes")
    };

    const notify = (type, message, title) => window.mpAlert?.[type]?.(message, title) || window.alert(message);
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content || "";
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content || "X-CSRF-TOKEN";

    const state = {
        viajes: [],
        page: 0,
        size: Number(els.sizeSelect?.value) || 10,
        totalPages: 1,
        totalElements: 0,
        filters: {
            q: "",
            estado: "",
            fechaInicio: "",
            fechaFin: "",
            excluirCompletados: false
        }
    };

    let tiposGastoCache = [];
    let tiposGastoLoaded = false;
    let lotesDisponibles = [];
    let lotesLoaded = false;
    let estadosLoaded = false;
    let debounceTimer = null;

    const money = value => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(Number(value) || 0);
    const num = value => {
        const n = Number.parseFloat(value);
        return Number.isNaN(n) ? 0 : n;
    };

    // ── Helpers de fecha ────────────────────────────────────────────────────
    const toISODate = d => d.toISOString().split('T')[0];
    /** Devuelve { inicio, fin } para el mes de la fecha dada. */
    const rangoMesActual = (fecha = new Date()) => {
        const y = fecha.getFullYear();
        const m = fecha.getMonth(); // 0-based
        const inicio = new Date(y, m, 1);
        const fin    = new Date(y, m + 1, 0); // último día del mes
        return { inicio: toISODate(inicio), fin: toISODate(fin) };
    };
    const escapeHtml = value => {
        if (value === null || value === undefined) return "";
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    };
    const safeDate = value => {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    };
    const humanDateTime = value => {
        const d = safeDate(value);
        if (!d) return "-";
        const p = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };
    const durationHuman = (start, end) => {
        const a = safeDate(start);
        const b = safeDate(end);
        if (!a || !b) return "-";
        const diff = b.getTime() - a.getTime();
        if (diff <= 0) return "-";
        let rest = diff;
        const days = Math.floor(rest / 86400000);
        rest -= days * 86400000;
        const hours = Math.floor(rest / 36e5);
        rest -= hours * 36e5;
        const mins = Math.floor(rest / 60000);
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0 || !parts.length) parts.push(`${mins}m`);
        return parts.join(" ");
    };
    const safeHref = value => {
        if (!value) return "";
        try {
            return new URL(value, window.location.origin).href;
        } catch {
            return "";
        }
    };
    const normState = value => String(value || "").toLowerCase().replaceAll(" ", "_");
    const getViajeId = viaje => viaje?.id_viaje ?? viaje?.idViaje ?? viaje?.id ?? "";
    const getViajeNombre = viaje => viaje?.nombreVieje ?? viaje?.nombreViaje ?? "Sin nombre";
    const getViajeList = (viaje, key) => Array.isArray(viaje?.[key]) ? viaje[key] : [];
    const firstTramo = list => Array.isArray(list) && list.length ? list[0] : null;
    const isActiveState = estado => ["cargando", "en_camino", "descargando", "con_fallas"].includes(normState(estado));

    const syncTramoInCache = (viajeId, tramoId, field, value) => {
        const viaje = state.viajes.find(v => String(getViajeId(v)) === String(viajeId));
        if (!viaje) return;

        ["listaIDa", "listaVuelta", "tramos"].forEach(key => {
            const list = Array.isArray(viaje[key]) ? viaje[key] : [];
            list.forEach(tramo => {
                if (String(tramo?.id) === String(tramoId)) {
                    tramo[field] = value;
                }
            });
        });
    };

    const getLoteId = lote => Number(lote?.idLote ?? lote?.id_lote ?? lote?.id);
    const getLoteLabel = loteId => {
        const match = lotesDisponibles.find(l => getLoteId(l) === Number(loteId));
        return match?.numeroLote || `#${loteId}`;
    };

    const tramoCard = (tramo, tipo, viajeId, lotes) => {
        if (!tramo) {
            const label = tipo === "ida" ? "Ida" : "Vuelta";
            return `
                <div class="tleg-empty">
                    <span class="tleg-empty-icon"></span>
                    <span>Sin tramo de ${escapeHtml(label)}</span>
                </div>`;
        }

        const estadoKey = normState(tramo.estadoViaje || tramo.estado);
        const estadoLabel = String(tramo.estadoViaje || tramo.estado || "-").replaceAll("_", " ");
        const isPagado = Boolean(tramo.pagado);
        const isIva = Boolean(tramo.iva);
        const gasto = num(tramo.gastoTotal);
        const tramoIngresosExtra = num(tramo.ingresoExtraTotal);

        const lotesTramo = Array.isArray(lotes) ? lotes.filter(l => String(l.tipoTramo || l.tipo_tramo || (tipo === "ida" ? "ida" : "")).toLowerCase() === tipo) : [];
        const valorLotesTramo = lotesTramo.reduce((sum, l) => sum + num(l?.valorDeclarado ?? l?.valor_declarado), 0);
        const ivaTramo = isIva ? (valorLotesTramo + tramoIngresosExtra) * 0.13 : 0;
        const ganancia = (valorLotesTramo + tramoIngresosExtra + ivaTramo) - gasto;
        const tipoLabel = tipo === "ida" ? "Ida" : "Vuelta";
        const indicatorClass = tipo === "ida" ? "tleg-ind-ida" : "tleg-ind-vuelta";
        const cardClass = tipo === "ida" ? "tleg-ida" : "tleg-vuelta";

        const ruta = [tramo.paisSalida, tramo.paisDestino].filter(Boolean).join(" -> ") || "-";
        const fechas = `${humanDateTime(tramo.fechaSalida)} -> ${humanDateTime(tramo.fechaEntrada)}`;
        const camion = tramo.camionPlaca
            ? `${tramo.camionNombre || ""} (${tramo.camionPlaca})`
            : (tramo.camionNombre || "-");

        return `
            <div class="tleg-card ${cardClass}"
                 data-tramo-id="${escapeHtml(String(tramo.id ?? ""))}"
                 data-viaje-id="${escapeHtml(String(viajeId))}"
                 data-tramo-tipo="${tipo}">
                <div>
                    <span class="tleg-indicator ${indicatorClass}">${escapeHtml(tipoLabel)}</span>
                </div>
                <div class="tleg-col-vehicle">
                    <div class="tleg-sub">Camion / Chofer</div>
                    <div class="tleg-val">${escapeHtml(camion)}</div>
                    <div class="tleg-val" style="color:#6b7280;font-weight:400">${escapeHtml(tramo.conductorNombre || "-")}</div>
                </div>
                <div class="tleg-col-route">
                    <div class="tleg-route-line">${escapeHtml(ruta)}</div>
                    <div class="tleg-dates">${escapeHtml(fechas)}</div>
                </div>
                <div class="tleg-col-finance">
                    <div class="tleg-fin-row">
                        <span class="tleg-fin-label">Gastos</span>
                        <span class="tleg-fin-val text-danger">${money(gasto)}</span>
                    </div>
                    <div class="tleg-fin-row">
                        <span class="tleg-fin-label">Ing. Extra</span>
                        <span class="tleg-fin-val text-success">${money(tramoIngresosExtra)}</span>
                    </div>
                    <div class="tleg-fin-row">
                        <span class="tleg-fin-label">Balance</span>
                        <span class="tleg-fin-val ${ganancia >= 0 ? "text-success" : "text-danger"}">${money(ganancia)}</span>
                    </div>
                    <div class="mt-1">
                        <span class="status-badge status-${escapeHtml(estadoKey)}">${escapeHtml(estadoLabel)}</span>
                    </div>
                </div>
                <div class="tleg-col-toggles" onclick="event.stopPropagation();">
                    <button type="button"
                        class="tleg-toggle-btn ${isPagado ? "tleg-toggle-on" : "tleg-toggle-off"}"
                        data-toggle-field="pagado"
                        data-tramo-id="${escapeHtml(String(tramo.id ?? ""))}"
                        data-viaje-id="${escapeHtml(String(viajeId))}">
                        <span class="tleg-toggle-dot"></span>
                        <span class="tleg-toggle-label">Pagado</span>
                    </button>
                    <button type="button"
                        class="tleg-toggle-btn ${isIva ? "tleg-toggle-iva-on" : "tleg-toggle-off"}"
                        data-toggle-field="iva"
                        data-tramo-id="${escapeHtml(String(tramo.id ?? ""))}"
                        data-viaje-id="${escapeHtml(String(viajeId))}">
                        <span class="tleg-toggle-dot"></span>
                        <span class="tleg-toggle-label">IVA</span>
                    </button>
                </div>
                <div class="tleg-edit-hint">Toca para editar -></div>
            </div>`;
    };

    const tramoDetalle = (titulo, tramo, lotesAsignadosTramo) => {
        if (!tramo) {
            return `
                <div class="card bg-light border-0 mb-3 p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold">${escapeHtml(titulo)}</span>
                        <span class="badge bg-secondary">No registrado</span>
                    </div>
                    <div class="text-muted small">No hay datos para este tramo.</div>
                </div>`;
        }

        const gastos = Array.isArray(tramo.gastos) ? tramo.gastos : [];
        const totalGastos = gastos.reduce((sum, g) => sum + num(g?.monto), 0);
        const ingresos = Array.isArray(tramo.ingresosExtra) ? tramo.ingresosExtra : [];
        const totalIngresos = ingresos.reduce((sum, i) => sum + num(i?.monto), 0);
        const lotes = Array.isArray(lotesAsignadosTramo) ? lotesAsignadosTramo : [];
        const totalLotesValor = lotes.reduce((sum, l) => sum + num(l?.valorDeclarado), 0);
        const pagadoBadge = tramo.pagado ? "bg-success" : "bg-secondary";
        const pagadoLabel = tramo.pagado ? "Tramo Pagado" : "Pago Pendiente";
        const estadoBadge = normState(tramo.estadoViaje || tramo.estado) === "completado" ? "bg-success" : "bg-warning text-dark";

        const rows = gastos.length
            ? gastos.map(g => {
                const tipo = resolveTipoLabel(g.idTipoGasto);
                const href = safeHref(g.evidenciaUrl);
                return `
                    <tr>
                        <td>${escapeHtml(tipo)}</td>
                        <td>${escapeHtml(g.descripcion || "-")}</td>
                        <td class="text-end fw-semibold text-danger">${money(g.monto)}</td>
                        <td>${escapeHtml(g.fechaGasto || "-")}</td>
                        <td class="text-end">${href ? `<a class="btn btn-outline-secondary btn-sm py-0" href="${escapeHtml(href)}" target="_blank" rel="noopener">Ver</a>` : "-"}</td>
                    </tr>`;
            }).join("")
            : `<tr><td colspan="5" class="text-center text-muted">Sin gastos registrados.</td></tr>`;

        const ingresosRows = ingresos.length
            ? ingresos.map(i => {
                return `
                    <tr>
                        <td>${escapeHtml(i.categoriaNombre || `Categoría #${i.idCategoriaIngresoExtra}`)}</td>
                        <td>${escapeHtml(i.descripcion || "-")}</td>
                        <td class="text-end fw-semibold text-success">${money(i.monto)}</td>
                        <td>${escapeHtml(i.fechaIngreso || "-")}</td>
                    </tr>`;
            }).join("")
            : `<tr><td colspan="4" class="text-center text-muted">Sin ingresos extra.</td></tr>`;

        const lotesRows = lotes.length
            ? lotes.map(l => {
                return `
                    <tr>
                        <td>${escapeHtml(l.numeroLote || "-")}</td>
                        <td>${escapeHtml(l.nombreEncargado ? `Encargado: ${l.nombreEncargado}` : "-")}</td>
                        <td class="text-end fw-semibold text-primary">${money(l.valorDeclarado)}</td>
                    </tr>`;
            }).join("")
            : `<tr><td colspan="3" class="text-center text-muted">Sin contenedores asignados.</td></tr>`;

        return `
            <div class="card border mb-3 p-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="fw-bold text-primary">${escapeHtml(titulo)}</span>
                    <div class="d-flex gap-2">
                        <span class="badge ${estadoBadge}">${escapeHtml(String(tramo.estadoViaje || "Pendiente").replaceAll("_", " "))}</span>
                        <span class="badge ${pagadoBadge}">${escapeHtml(pagadoLabel)}</span>
                    </div>
                </div>
                <div class="row g-2 mb-3 small">
                    <div class="col-md-6"><strong>Camion:</strong> ${escapeHtml(tramo.camionPlaca ? `${tramo.camionNombre || ""} (${tramo.camionPlaca})` : (tramo.camionNombre || "-"))}</div>
                    <div class="col-md-6"><strong>Chofer:</strong> ${escapeHtml(tramo.conductorNombre || "-")}</div>
                    <div class="col-md-6"><strong>Salida:</strong> ${escapeHtml(humanDateTime(tramo.fechaSalida))}</div>
                    <div class="col-md-6"><strong>Llegada:</strong> ${escapeHtml(humanDateTime(tramo.fechaEntrada))}</div>
                    <div class="col-md-6"><strong>Duracion:</strong> ${escapeHtml(durationHuman(tramo.fechaSalida, tramo.fechaEntrada))}</div>
                    <div class="col-md-6"><strong>Ruta:</strong> ${escapeHtml([tramo.paisSalida, tramo.paisDestino].filter(Boolean).join(" -> ") || "-")}</div>
                    <div class="col-12"><strong>Observaciones:</strong> ${escapeHtml(tramo.observaciones || "-")}</div>
                </div>
                <div class="border-top pt-2">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold small text-secondary">Contenedores / Lotes:</span>
                        <span class="fw-bold text-primary small">${money(totalLotesValor)}</span>
                    </div>
                    <div class="table-responsive mb-3">
                        <table class="table table-sm table-bordered align-middle mb-0" style="font-size:0.85rem">
                            <thead class="table-light">
                                <tr>
                                    <th>Número Lote</th><th>Descripción</th><th class="text-end">Valor Declarado</th>
                                </tr>
                            </thead>
                            <tbody>${lotesRows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="border-top pt-2">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold small text-secondary">Gastos Tramo:</span>
                        <span class="fw-bold text-danger small">${money(totalGastos)}</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered align-middle mb-0" style="font-size:0.85rem">
                            <thead class="table-light">
                                <tr>
                                    <th>Tipo</th><th>Descripcion</th><th class="text-end">Monto</th><th>Fecha</th><th class="text-end">Evidencia</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="border-top pt-2 mt-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold small text-secondary">Ingresos Extra:</span>
                        <span class="fw-bold text-success small">${money(totalIngresos)}</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered align-middle mb-0" style="font-size:0.85rem">
                            <thead class="table-light">
                                <tr>
                                    <th>Categoría</th><th>Descripcion</th><th class="text-end">Monto</th><th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>${ingresosRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    };

    const getQuery = () => {
        const query = new URLSearchParams({
            page: String(state.page),
            size: String(state.size)
        });
        if (state.filters.q) query.set("q", state.filters.q);
        if (state.filters.estado) query.set("estado", state.filters.estado);
        if (state.filters.fechaInicio) query.set("fechaInicio", state.filters.fechaInicio);
        if (state.filters.fechaFin) query.set("fechaFin", state.filters.fechaFin);
        query.set("excluirCompletados", String(state.filters.excluirCompletados));
        return query.toString();
    };

    async function cargarLotes() {
        if (lotesLoaded) return;
        const res = await fetch("/api/lotes", {credentials: "same-origin"});
        if (!res.ok) return;
        const data = await res.json();
        lotesDisponibles = Array.isArray(data) ? data : [];
        lotesLoaded = true;
    }

    async function cargarTiposGasto() {
        if (tiposGastoLoaded && tiposGastoCache.length) return;
        const res = await fetch("/api/tipogasto", {credentials: "same-origin"});
        if (!res.ok) return;
        const data = await res.json();
        tiposGastoCache = Array.isArray(data) ? data : [];
        tiposGastoLoaded = true;
    }

    async function cargarEstados() {
        if (!els.filtroEstado || estadosLoaded) return;
        const res = await fetch("/api/viajes/estados", {credentials: "same-origin"});
        if (!res.ok) return;
        const estados = await res.json();
        els.filtroEstado.innerHTML = '<option value="" selected>Todos los estados</option>';
        const activos = document.createElement("option");
        activos.value = "__activos__";
        activos.textContent = "Viajes activos";
        els.filtroEstado.appendChild(activos);
        (Array.isArray(estados) ? estados : []).forEach(estado => {
            const opt = document.createElement("option");
            opt.value = String(estado).replaceAll("_", " ");
            opt.textContent = String(estado).replaceAll("_", " ");
            els.filtroEstado.appendChild(opt);
        });
        estadosLoaded = true;
    }

    function resolveTipoLabel(idTipo) {
        if (!idTipo) return "-";
        const match = tiposGastoCache.find(t => Number(t.id) === Number(idTipo));
        return match?.tipoGasto || `Tipo #${idTipo}`;
    }

    // ── Skeleton helpers ───────────────────────────────────────────
    function skeletonVcard() {
        return `
        <div class="skeleton-vcard">
            <div class="skeleton-vcard-header">
                <span class="skeleton skeleton-block skeleton-w-30" style="height:10px"></span>
                <span class="skeleton skeleton-block skeleton-w-70" style="height:18px"></span>
            </div>
            <div class="skeleton-vcard-body">
                <div class="skeleton-row">
                    <span class="skeleton" style="width:62px;height:26px;border-radius:999px"></span>
                    <span class="skeleton skeleton-block skeleton-w-50" style="height:13px;margin:0"></span>
                    <span class="skeleton skeleton-block skeleton-w-30" style="height:13px;margin:0"></span>
                </div>
                <div class="skeleton-row">
                    <span class="skeleton" style="width:62px;height:26px;border-radius:999px"></span>
                    <span class="skeleton skeleton-block skeleton-w-70" style="height:13px;margin:0"></span>
                </div>
                <div class="skeleton-row" style="gap:6px">
                    <span class="skeleton" style="width:80px;height:24px;border-radius:999px"></span>
                    <span class="skeleton" style="width:60px;height:24px;border-radius:999px"></span>
                </div>
            </div>
        </div>`;
    }

    function skeletonMetricas() {
        [els.metricGastos, els.metricActivos, els.metricLotes].forEach(el => {
            if (el) el.innerHTML = '<span class="skeleton" style="display:block;height:24px;border-radius:6px;background:rgba(255,255,255,.25)"></span>';
        });
    }

    function setLoadingUI(loading) {
        // Botón aplicar filtros
        if (els.btnAplicar) {
            els.btnAplicar.classList.toggle("btn-loading", loading);
            els.btnAplicar.disabled = loading;
        }
        // Paginación
        [els.btnPrev, els.btnNext].forEach(btn => {
            if (btn) btn.disabled = loading;
        });
        // Select de página
        if (els.sizeSelect) els.sizeSelect.disabled = loading;
    }

    async function cargarViajes(page = state.page) {
        if (!els.lista) return;
        state.page = Math.max(0, Number(page) || 0);

        // Mostrar skeletons en la lista y métricas
        els.lista.innerHTML = [1,2,3].map(() => skeletonVcard()).join("");
        skeletonMetricas();
        setLoadingUI(true);

        try {
            const res = await fetch(`/api/viajes?${getQuery()}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar viajes");
            const pageData = await res.json();

            state.page = Number(pageData?.number ?? state.page);
            state.size = Number(pageData?.size ?? state.size);
            state.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            state.totalElements = Number(pageData?.totalElements ?? 0);
            state.viajes = Array.isArray(pageData?.content) ? pageData.content : [];

            renderViajes();
        } catch (error) {
            console.error(error);
            els.lista.innerHTML = `
                <div class="text-center py-5 text-danger">
                    <div style="font-size:2rem;margin-bottom:8px">⚠️</div>
                    <div style="font-weight:600">No se pudieron cargar los viajes</div>
                    <div style="font-size:.85rem;opacity:.7;margin-top:4px">${error.message}</div>
                    <button onclick="location.reload()" class="btn btn-sm btn-outline-primary mt-3">Reintentar</button>
                </div>`;
            // Resetear métricas en error
            [els.metricGastos, els.metricActivos, els.metricLotes].forEach(el => { if (el) el.textContent = "-"; });
        } finally {
            setLoadingUI(false);
        }
    }

    function renderViajes() {
        if (!els.lista) return;
        if (!state.viajes.length) {
            els.lista.innerHTML = `
                <div class="text-center py-5" style="color:#9ca3af">
                    <div style="font-size:2.5rem;margin-bottom:10px">🚛</div>
                    <div style="font-weight:600;font-size:1rem">No se encontraron viajes</div>
                    <div style="font-size:.85rem;margin-top:4px">Prueba cambiando los filtros o el rango de fechas</div>
                </div>`;
            if (els.total) els.total.textContent = "Mostrando 0 viajes";
            actualizarMetricas();
            actualizarPaginacion();
            return;
        }

        els.lista.innerHTML = state.viajes.map(viaje => {
            const ida = firstTramo(getViajeList(viaje, "listaIDa")) || firstTramo(getViajeList(viaje, "listaIda")) || firstTramo(getViajeList(viaje, "lista_ida"));
            const vuelta = firstTramo(getViajeList(viaje, "listaVuelta")) || firstTramo(getViajeList(viaje, "lista_vuelta"));
            const lotes = Array.isArray(viaje.lotes) ? viaje.lotes : [];
            const totalLotes = Number(viaje.totalLotes ?? lotes.length) || lotes.length;
            const valorLotesIda = lotes.filter(l => String(l.tipoTramo || l.tipo_tramo || "ida").toLowerCase() === "ida")
                .reduce((sum, l) => sum + num(l?.valorDeclarado ?? l?.valor_declarado), 0);
            const valorLotesVuelta = lotes.filter(l => String(l.tipoTramo || l.tipo_tramo || "").toLowerCase() === "vuelta")
                .reduce((sum, l) => sum + num(l?.valorDeclarado ?? l?.valor_declarado), 0);
            const valorLotes = valorLotesIda + valorLotesVuelta;
 
            const gastoIda = num(ida?.gastoTotal);
            const gastoVuelta = num(vuelta?.gastoTotal);
            const totalGasto = gastoIda + gastoVuelta;

            const ingresosExtraIda = num(ida?.ingresoExtraTotal);
            const ingresosExtraVuelta = num(vuelta?.ingresoExtraTotal);
            const ingresoExtraTotal = ingresosExtraIda + ingresosExtraVuelta;

            const ivaIda = (ida?.iva ? (valorLotesIda + ingresosExtraIda) * 0.13 : 0);
            const ivaVuelta = (vuelta?.iva ? (valorLotesVuelta + ingresosExtraVuelta) * 0.13 : 0);
            const iva = ivaIda + ivaVuelta;

            const ganancia = valorLotes + ingresoExtraTotal + iva - totalGasto;
 
            // Determinar estado general y camión para el header
            let overallEstadoKey = "pendiente";
            let overallEstadoLabel = "Pendiente";
            const estadoIdaKey = ida ? normState(ida.estadoViaje || ida.estado) : null;
            const estadoVueltaKey = vuelta ? normState(vuelta.estadoViaje || vuelta.estado) : null;
            const activeStates = ["con_fallas", "cargando", "descargando", "en_camino"];
            
            // Priorizar mostrar estados activos, sino si ambos completados, etc.
            if (activeStates.includes(estadoIdaKey)) { overallEstadoKey = estadoIdaKey; overallEstadoLabel = String(ida.estadoViaje || ida.estado).replaceAll("_", " "); }
            else if (activeStates.includes(estadoVueltaKey)) { overallEstadoKey = estadoVueltaKey; overallEstadoLabel = String(vuelta.estadoViaje || vuelta.estado).replaceAll("_", " "); }
            else if (estadoIdaKey === "completado" && (!vuelta || estadoVueltaKey === "completado" || estadoVueltaKey === "cancelado")) { overallEstadoKey = "completado"; overallEstadoLabel = "Completado"; }
            else if (estadoVueltaKey === "completado" && (!ida || estadoIdaKey === "completado" || estadoIdaKey === "cancelado")) { overallEstadoKey = "completado"; overallEstadoLabel = "Completado"; }
            else if (estadoIdaKey === "cancelado" && estadoVueltaKey === "cancelado") { overallEstadoKey = "cancelado"; overallEstadoLabel = "Cancelado"; }
            else if (estadoIdaKey) { overallEstadoKey = estadoIdaKey; overallEstadoLabel = String(ida.estadoViaje || ida.estado).replaceAll("_", " "); }
            
            const camionGeneral = (ida?.camionNombre || vuelta?.camionNombre || "");

            return `
                <div class="vcard" data-viaje-id="${escapeHtml(String(getViajeId(viaje)))}">
                    <div class="vcard-header" data-toggle-viaje="${escapeHtml(String(getViajeId(viaje)))}">
                        <div class="vcard-title-group">
                            <span class="vcard-id">Viaje #${escapeHtml(String(getViajeId(viaje)))}</span>
                            <h3 class="vcard-name">${escapeHtml(getViajeNombre(viaje))}</h3>
                        </div>
                        <div class="vcard-header-status-group">
                            ${camionGeneral ? `<span class="vcard-header-truck"><i class="fas fa-truck"></i> ${escapeHtml(camionGeneral)}</span>` : ""}
                            <span class="status-badge status-${escapeHtml(overallEstadoKey)}">${escapeHtml(overallEstadoLabel)}</span>
                        </div>
                        <button class="vcard-toggle-btn" data-toggle-viaje="${escapeHtml(String(getViajeId(viaje)))}" title="Expandir / Colapsar" type="button" aria-expanded="true">
                            <svg class="vcard-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    <div class="vcard-body" id="vcard-body-${escapeHtml(String(getViajeId(viaje)))}">
                        <div class="vcard-legs">
                            ${tramoCard(ida, "ida", getViajeId(viaje), lotes)}
                            ${tramoCard(vuelta, "vuelta", getViajeId(viaje), lotes)}
                        </div>
                        <div class="vcard-stats" data-viaje-action="view" data-viaje-id="${escapeHtml(String(getViajeId(viaje)))}" title="Ver detalle completo">
                            <div class="vcard-stats-header">Estadisticas</div>
                            <div class="vcard-stat-row">
                                <span class="vcard-stat-label">Lotes</span>
                                <span class="vcard-stat-val">${totalLotes}</span>
                            </div>
                            <div class="vcard-stat-row">
                                <span class="vcard-stat-label">Valor lotes</span>
                                <span class="vcard-stat-val">${money(valorLotes)}</span>
                            </div>
                            <div class="vcard-stat-row">
                                <span class="vcard-stat-label">Ingresos Extra</span>
                                <span class="vcard-stat-val text-success">${money(ingresoExtraTotal)}</span>
                            </div>
                            <div class="vcard-stat-divider"></div>
                            <div class="vcard-stat-row">
                                <span class="vcard-stat-label">Gasto Ida</span>
                                <span class="vcard-stat-val text-danger">${money(gastoIda)}</span>
                            </div>
                            <div class="vcard-stat-row">
                                <span class="vcard-stat-label">Gasto Vuelta</span>
                                <span class="vcard-stat-val text-danger">${money(gastoVuelta)}</span>
                            </div>
                            <div class="vcard-stat-row">
                                <span class="vcard-stat-label">Total Gastado</span>
                                <span class="vcard-stat-val text-danger fw-bold">${money(totalGasto)}</span>
                            </div>
                            <div class="vcard-stat-divider"></div>
                            <div class="vcard-stat-row vcard-stat-ganancia">
                                <span class="vcard-stat-label">Ganancia Total</span>
                                <span class="vcard-stat-val fw-bold ${ganancia >= 0 ? "text-success" : "text-danger"}">${money(ganancia)}</span>
                            </div>
                            <div class="vcard-stats-hint">Toca para ver todo -></div>
                        </div>
                    </div>
                </div>`;
        }).join("");

        const inicio = state.page * state.size;
        const fin = inicio + state.viajes.length;
        if (els.total) els.total.textContent = `Mostrando ${inicio + 1}-${fin} de ${state.totalElements} viajes`;
        actualizarMetricas();
        actualizarPaginacion();
    }

    function actualizarPaginacion() {
        const actual = state.page + 1;
        const total = Math.max(state.totalPages, 1);
        const prevDisabled = state.page <= 0;
        const nextDisabled = state.page >= total - 1;

        if (els.btnPrev) {
            els.btnPrev.disabled = prevDisabled;
            els.btnPrev.parentElement?.classList.toggle("disabled", prevDisabled);
        }
        if (els.btnNext) {
            els.btnNext.disabled = nextDisabled;
            els.btnNext.parentElement?.classList.toggle("disabled", nextDisabled);
        }
        if (els.pageLabel) els.pageLabel.textContent = `${actual} / ${total}`;
    }

    function actualizarMetricas() {
        let gastos = 0;
        let tramosActivos = 0;
        let lotesEnTransito = 0;

        state.viajes.forEach(viaje => {
            gastos += num(viaje.gastoTotal);
            const ida = firstTramo(getViajeList(viaje, "listaIDa")) || firstTramo(getViajeList(viaje, "listaIda")) || firstTramo(getViajeList(viaje, "lista_ida"));
            const vuelta = firstTramo(getViajeList(viaje, "listaVuelta")) || firstTramo(getViajeList(viaje, "lista_vuelta"));

            [ida, vuelta].forEach(tramo => {
                if (tramo && isActiveState(tramo.estadoViaje || tramo.estado)) tramosActivos++;
            });

            const anyActive = [ida, vuelta].some(tramo => tramo && isActiveState(tramo.estadoViaje || tramo.estado));
            if (anyActive) {
                const lotes = Array.isArray(viaje.lotes) ? viaje.lotes : [];
                lotesEnTransito += Number(viaje.totalLotes ?? lotes.length) || lotes.length;
            }
        });

        if (els.metricGastos) els.metricGastos.textContent = money(gastos);
        if (els.metricActivos) els.metricActivos.textContent = String(tramosActivos);
        if (els.metricLotes) els.metricLotes.textContent = String(lotesEnTransito);
    }

    async function abrirModalDetalle(viajeId) {
        if (!els.viewModal || !els.viewBody) return;
        els.viewModal.classList.add("is-open");
        // Spinner mientras carga
        els.viewBody.innerHTML = `
            <div class="mp-modal-spinner">
                <div class="mp-modal-spinner-ring"></div>
                <div class="mp-modal-spinner-text">Cargando detalle del viaje…</div>
            </div>`;
        if (els.viewTitle) els.viewTitle.textContent = "Detalle del viaje";

        try {
            await cargarLotes();
            await cargarTiposGasto();

            const res = await fetch(`/api/viajes/${viajeId}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudo cargar el viaje");
            const data = await res.json();
            const tramos = Array.isArray(data.tramos) ? data.tramos : [];
            const ida = tramos.find(t => normState(t?.tipoTramo) === "ida") || null;
            const vuelta = tramos.find(t => normState(t?.tipoTramo) === "vuelta") || null;

            const loteIds = Array.isArray(data.loteIds) ? data.loteIds.map(Number).filter(Boolean) : [];
            const lotesLabel = loteIds.length ? loteIds.map(getLoteLabel).join(", ") : "-";
            const salida = [ida?.fechaSalida, vuelta?.fechaSalida].map(safeDate).filter(Boolean).sort((a, b) => a.getTime() - b.getTime())[0] || null;
            const llegada = [ida?.fechaEntrada, vuelta?.fechaEntrada].map(safeDate).filter(Boolean).sort((a, b) => b.getTime() - a.getTime())[0] || null;
            const duracion = salida && llegada ? durationHuman(salida, llegada) : "-";

            const lotesAsignados = Array.isArray(data.lotesAsignados) ? data.lotesAsignados : [];
            const valorLotesIda = lotesAsignados.filter(l => String(l.tipoTramo || "ida").toLowerCase() === "ida")
                .reduce((sum, l) => sum + num(l?.valorDeclarado), 0);
            const valorLotesVuelta = lotesAsignados.filter(l => String(l.tipoTramo || "").toLowerCase() === "vuelta")
                .reduce((sum, l) => sum + num(l?.valorDeclarado), 0);
            const valorLotes = valorLotesIda + valorLotesVuelta;

            const tramoGasto = t => Array.isArray(t?.gastos) ? t.gastos.reduce((sum, g) => sum + num(g?.monto), 0) : 0;
            const tramoIngresoExtra = t => Array.isArray(t?.ingresosExtra) ? t.ingresosExtra.reduce((sum, i) => sum + num(i?.monto), 0) : 0;

            const gastosTotales = tramoGasto(ida) + tramoGasto(vuelta);
            const ingresosExtraTotales = tramoIngresoExtra(ida) + tramoIngresoExtra(vuelta);

            const ingresosExtraIda = tramoIngresoExtra(ida);
            const ingresosExtraVuelta = tramoIngresoExtra(vuelta);

            const ivaIda = (ida?.iva ? (valorLotesIda + ingresosExtraIda) * 0.13 : 0);
            const ivaVuelta = (vuelta?.iva ? (valorLotesVuelta + ingresosExtraVuelta) * 0.13 : 0);
            const iva = ivaIda + ivaVuelta;

            const ganancia = valorLotes + ingresosExtraTotales + iva - gastosTotales;

            const lotesIda = lotesAsignados.filter(l => String(l.tipoTramo || "ida").toLowerCase() === "ida");
            const lotesVuelta = lotesAsignados.filter(l => String(l.tipoTramo || "").toLowerCase() === "vuelta");
 
            els.viewBody.innerHTML = `
                <div class="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="fw-bold text-dark mb-1">${escapeHtml(data.nombreViaje || "Sin nombre")}</h5>
                        <p class="text-muted small mb-0">Contenedores: <span class="fw-bold text-dark">${escapeHtml(lotesLabel)}</span></p>
                    </div>
                    <span class="badge bg-secondary p-2">ID Viaje: ${escapeHtml(String(getViajeId(data)))}</span>
                </div>
                <div class="row">
                    <div class="col-md-6">${tramoDetalle("Tramo Ida", ida, lotesIda)}</div>
                    <div class="col-md-6">${tramoDetalle("Tramo Vuelta", vuelta, lotesVuelta)}</div>
                </div>
                <div class="mt-3 border-top pt-3">
                    <h6 class="fw-bold text-secondary mb-3 text-uppercase" style="font-size:0.85rem;letter-spacing:0.8px;">Resumen Consolidado del Viaje</h6>
                    <div class="row g-3 text-center">
                        <div class="col-md col-sm-6">
                            <div class="border rounded p-2 bg-light h-100">
                                <div class="small text-muted mb-1">Duracion Total</div>
                                <strong class="fs-6">${escapeHtml(duracion)}</strong>
                            </div>
                        </div>
                        <div class="col-md col-sm-6">
                            <div class="border rounded p-2 bg-light h-100">
                                <div class="small text-muted mb-1">Valor Contenedores</div>
                                <strong class="fs-6 text-primary">${money(valorLotes)}</strong>
                            </div>
                        </div>
                        <div class="col-md col-sm-6">
                            <div class="border rounded p-2 bg-light h-100">
                                <div class="small text-muted mb-1">Ingresos Extra</div>
                                <strong class="fs-6 text-success">${money(ingresosExtraTotales)}</strong>
                            </div>
                        </div>
                        <div class="col-md col-sm-6">
                            <div class="border rounded p-2 bg-light h-100">
                                <div class="small text-muted mb-1">Total Gastado</div>
                                <strong class="fs-6 text-danger">${money(gastosTotales)}</strong>
                            </div>
                        </div>
                        <div class="col-md col-sm-6">
                            <div class="border rounded p-2 bg-light h-100">
                                <div class="small text-muted mb-1">IVA (+13%)</div>
                                <strong class="fs-6 text-warning">${money(iva)}</strong>
                            </div>
                        </div>
                        <div class="col-md-6 col-12 mx-auto mt-3">
                            <div class="border rounded p-3 bg-white border-2 border-primary shadow-sm">
                                <div class="small text-secondary fw-bold mb-1">Ganancia Neta Final</div>
                                <strong class="fs-4 ${ganancia >= 0 ? "text-success" : "text-danger"}">${money(ganancia)}</strong>
                            </div>
                        </div>
                    </div>
                </div>`;
        } catch (error) {
            console.error(error);
            els.viewBody.innerHTML = '<div class="text-danger text-center py-4">Error al cargar el viaje</div>';
        }
    }

    async function handleToggle(btn) {
        const field = btn.dataset.toggleField;
        const tramoId = btn.dataset.tramoId;
        const viajeId = btn.dataset.viajeId;
        if (!field || !tramoId || !viajeId) return;

        const onClass = field === "pagado" ? "tleg-toggle-on" : "tleg-toggle-iva-on";
        const offClass = "tleg-toggle-off";
        const currentOn = btn.classList.contains(onClass);
        const newValue = !currentOn;

        btn.disabled = true;
        btn.classList.toggle(onClass, newValue);
        btn.classList.toggle(offClass, !newValue);

        try {
            const res = await fetch(`/api/viajes/tramo/${tramoId}/${field}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    [csrfHeader]: csrfToken
                },
                credentials: "same-origin",
                body: JSON.stringify({valor: newValue})
            });
            if (!res.ok) throw new Error("Error al guardar");
            syncTramoInCache(viajeId, tramoId, field, newValue);
            actualizarMetricas();
        } catch (error) {
            console.error(error);
            btn.classList.toggle(onClass, currentOn);
            btn.classList.toggle(offClass, !currentOn);
            notify("error", "No se pudo guardar el cambio", "Error");
        } finally {
            btn.disabled = false;
        }
    }

    function aplicarFiltros() {
        state.filters.q = (els.filtroQ?.value || "").trim();
        state.filters.fechaInicio = els.filtroInicio?.value || "";
        state.filters.fechaFin = els.filtroFin?.value || "";

        const estado = els.filtroEstado?.value || "";
        if (estado === "__activos__") {
            state.filters.estado = "";
            state.filters.excluirCompletados = true;
        } else {
            state.filters.estado = estado;
            state.filters.excluirCompletados = false;
        }

        state.page = 0;
        cargarViajes(0);
    }

    function limpiarFiltros() {
        const rango = rangoMesActual();
        state.filters = {q: "", estado: "__activos__", fechaInicio: rango.inicio, fechaFin: rango.fin, excluirCompletados: true};
        if (els.filtroQ)      els.filtroQ.value      = "";
        if (els.filtroInicio) els.filtroInicio.value = rango.inicio;
        if (els.filtroFin)    els.filtroFin.value    = rango.fin;
        if (els.filtroEstado) els.filtroEstado.value = "__activos__";
        state.page = 0;
        cargarViajes(0);
    }

    els.btnNuevoViaje?.addEventListener("click", () => {
        window.location.href = "/viajes/formulario";
    });

    els.btnCerrarView?.addEventListener("click", () => {
        els.viewModal?.classList.remove("is-open");
    });
    els.viewModal?.querySelector(".mp-modal-backdrop")?.addEventListener("click", () => {
        els.viewModal?.classList.remove("is-open");
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && els.viewModal?.classList.contains("is-open")) {
            els.viewModal.classList.remove("is-open");
        }
    });

    els.btnPrev?.addEventListener("click", () => cargarViajes(state.page - 1));
    els.btnNext?.addEventListener("click", () => cargarViajes(state.page + 1));

    els.sizeSelect?.addEventListener("change", e => {
        state.size = Number(e.target.value) || 10;
        cargarViajes(0);
    });

    els.btnAplicar?.addEventListener("click", aplicarFiltros);
    els.btnLimpiar?.addEventListener("click", limpiarFiltros);

    els.filtroQ?.addEventListener("input", e => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.filters.q = e.target.value.trim();
        }, 250);
    });

    els.lista?.addEventListener("click", event => {
        // Toggle de Acordeón
        const toggleHeader = event.target.closest('[data-toggle-viaje]');
        if (toggleHeader) {
            event.preventDefault();
            event.stopPropagation();
            const viajeId = toggleHeader.dataset.toggleViaje;
            const vcard = toggleHeader.closest('.vcard');
            const btn = vcard.querySelector('.vcard-toggle-btn');
            
            if (vcard) {
                const isCollapsed = vcard.classList.toggle('is-collapsed');
                if (btn) btn.setAttribute('aria-expanded', !isCollapsed);
            }
            return;
        }

        const toggleBtn = event.target.closest("[data-toggle-field]");
        if (toggleBtn) {
            event.preventDefault();
            event.stopPropagation();
            handleToggle(toggleBtn);
            return;
        }

        const viewBtn = event.target.closest('[data-viaje-action="view"]');
        if (viewBtn) {
            event.preventDefault();
            event.stopPropagation();
            abrirModalDetalle(viewBtn.dataset.viajeId);
            return;
        }

        const editBtn = event.target.closest('[data-viaje-action="edit"]');
        if (editBtn) {
            event.preventDefault();
            event.stopPropagation();
            window.location.href = `/viajes/formulario?id=${editBtn.dataset.viajeId}`;
            return;
        }

        const tramoCard = event.target.closest(".tleg-card");
        if (tramoCard) {
            event.preventDefault();
            const viajeId = tramoCard.dataset.viajeId;
            if (viajeId) window.location.href = `/viajes/formulario?id=${viajeId}`;
        }
    });

    async function init() {
        await cargarEstados();
        await cargarTiposGasto();

        // Por defecto: viajes activos del mes actual
        const rango = rangoMesActual();
        if (els.filtroInicio) els.filtroInicio.value = rango.inicio;
        if (els.filtroFin)    els.filtroFin.value    = rango.fin;
        if (els.filtroEstado) els.filtroEstado.value = "__activos__";

        // Inicializar state con activos + mes actual
        state.filters.fechaInicio        = rango.inicio;
        state.filters.fechaFin           = rango.fin;
        state.filters.estado             = "";
        state.filters.excluirCompletados = true;

        await cargarViajes(0);
    }

    init();
});
