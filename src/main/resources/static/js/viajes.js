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
        listaViajes.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Cargando viajes...</td></tr>';
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
            listaViajes.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error al cargar viajes</td></tr>';
        }
    }

    function renderViajes() {
        if (!listaViajes) return;
        if (!viajesCache.length) {
            listaViajes.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron viajes.</td></tr>';
            const total = document.getElementById("totalViajes");
            if (total) total.textContent = "Mostrando 0 viajes";
            actualizarPaginacionViajes();
            return;
        }

        const isActivo = detalle => {
            if (!detalle?.estadoViaje) return false;
            const estado = String(detalle.estadoViaje).toLowerCase();
            return estado !== "completado" && estado !== "cancelado";
        };

        listaViajes.innerHTML = viajesCache.map(viaje => {
            const ida = Array.isArray(viaje.listaIDa) ? viaje.listaIDa[0] : null;
            const vuelta = Array.isArray(viaje.listaVuelta) ? viaje.listaVuelta[0] : null;
            const gastoNumero = parseNumber(viaje.gastoTotal);
            const gastoTotal = formatMoney(gastoNumero);
            const idViaje = viaje.id_viaje ?? viaje.idViaje ?? "";

            const estadoIdaKey = String(ida?.estadoViaje || "").toLowerCase().replaceAll(" ", "_");
            const estadoVueltaKey = String(vuelta?.estadoViaje || "").toLowerCase().replaceAll(" ", "_");
            const estadoIdaLabel = String(ida?.estadoViaje || "-").replaceAll("_", " ");
            const estadoVueltaLabel = String(vuelta?.estadoViaje || "-").replaceAll("_", " ");
            const idaFechaSalida = formatDateTimeHuman(ida?.fechaSalida);
            const vueltaFechaSalida = formatDateTimeHuman(vuelta?.fechaSalida);

            const lotes = Array.isArray(viaje.lotes) ? viaje.lotes : [];
            const totalLotes = Number(viaje.totalLotes ?? lotes.length) || lotes.length;
            const lotesTransito = lotes.filter(l => String(l?.estado || "").toLowerCase() === "en_transito").length;

            let valorTotalLotes = 0;
            lotes.forEach(l => {
                valorTotalLotes += parseFloat(l.valorDeclarado || l.valor_declarado) || 0;
            });
            const ivaCalculado = valorTotalLotes * 0.13;
            const gananciaCalculada = valorTotalLotes - gastoNumero - ivaCalculado;

            const hasIda = !!ida;
            const hasVuelta = !!vuelta;
            const ruta = [ida?.paisSalida, ida?.paisDestino, vuelta?.paisDestino].filter(Boolean).join(" → ") || "-";

            let mainStatusLabel = estadoIdaLabel;
            let mainStatusClass = estadoIdaKey ? `status-${escapeHtml(estadoIdaKey)}` : "";
            if (estadoIdaKey === "completado" && hasVuelta) {
                mainStatusLabel = estadoVueltaLabel;
                mainStatusClass = estadoVueltaKey ? `status-${escapeHtml(estadoVueltaKey)}` : "";
            }

            return `
                <tr class="align-middle border-bottom" data-viaje-id="${escapeHtml(idViaje)}" style="cursor:pointer;">
                    <td class="px-3 py-3">
                        <div class="fw-bold text-primary mb-1">${escapeHtml(viaje.nombreVieje || "Sin nombre")}</div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="status-badge ${mainStatusClass}" style="font-size: 0.7rem; padding: 2px 6px;">
                                ${escapeHtml(mainStatusLabel)}
                            </span>
                        </div>
                    </td>
                    <td class="px-3">
                        <div class="text-secondary small mb-1"><i class="fas fa-truck text-muted me-1"></i> Ida: ${escapeHtml(idaFechaSalida)}</div>
                        ${hasVuelta ? `<div class="text-secondary small"><i class="fas fa-undo text-muted me-1"></i> Vta: ${escapeHtml(vueltaFechaSalida)}</div>` : ''}
                    </td>
                    <td class="px-3">
                        <div class="small fw-medium text-dark">${escapeHtml(ruta)}</div>
                        <div class="small text-muted mt-1">
                            ${hasIda ? `<span title="Chofer Ida">${escapeHtml(ida?.conductorNombre || "-")}</span>` : ''}
                        </div>
                    </td>
                    <td class="px-3 text-center">
                        <div class="fw-bold fs-6">${escapeHtml(String(totalLotes))}</div>
                        <div class="small text-muted">${escapeHtml(String(lotesTransito))} en tránsito</div>
                    </td>
                    <td class="px-3 text-end">
                        <div class="fw-bold text-success" title="Ganancia Neta">${formatMoney(gananciaCalculada)}</div>
                        <div class="small text-muted mt-1" title="Gastos">-${gastoTotal}</div>
                    </td>
                    <td class="px-3 text-center" onclick="event.stopPropagation();">
                        <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-light border" title="Editar Viaje"
                                data-viaje-action="edit" data-viaje-id="${escapeHtml(idViaje)}">
                                <i class="fas fa-edit text-primary"></i>
                            </button>
                            <button type="button" class="btn btn-light border" title="Ver Detalles"
                                data-viaje-action="view" data-viaje-id="${escapeHtml(idViaje)}">
                                <i class="fas fa-eye text-secondary"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        const inicio = paginacionViajes.page * paginacionViajes.size;
        const fin = inicio + viajesCache.length;
        const total = document.getElementById("totalViajes");
        if (total) total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionViajes.totalElements} viajes`;
        actualizarPaginacionViajes();
    }

    function actualizarPaginacionViajes() {
        const btnPrev = document.getElementById("btnPrevViajes");
        const btnNext = document.getElementById("btnNextViajes");
        const label = document.getElementById("paginaActualViajes");
        const actual = paginacionViajes.page + 1;
        const total = Math.max(paginacionViajes.totalPages, 1);
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
        const inst = bootstrap.Modal.getOrCreateInstance(viewModal);
        inst.show();
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
        bootstrap.Modal.getInstance(viewModal)?.hide();
    };

    btnCerrarViajeView?.addEventListener("click", cerrarModalVerViaje);

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

        const tramos = Array.isArray(data.tramos) ? data.tramos : [];
        const ida = tramos.find(t => String(t.tipoTramo).toLowerCase() === "ida") || null;
        const vuelta = tramos.find(t => String(t.tipoTramo).toLowerCase() === "vuelta") || null;

        const calcGastos = tramo => (tramo?.gastos || []).reduce((sum, g) => sum + (Number(g?.monto) || 0), 0);
        const gastosIda = calcGastos(ida);
        const gastosVuelta = calcGastos(vuelta);
        const totalGastos = gastosIda + gastosVuelta;

        const loteIds = Array.isArray(data.loteIds) ? data.loteIds.map(Number).filter(Boolean) : [];
        const lotesLabel = loteIds.length
            ? loteIds
                .map(id => {
                    const match = lotesDisponibles.find(l => getLoteId(l) === id);
                    return match?.numeroLote || `#${id}`;
                })
                .join(", ")
            : "-";

        const salidaTotal = [ida?.fechaSalida, vuelta?.fechaSalida].map(parseDateSafe).filter(Boolean)
            .sort((a, b) => a.getTime() - b.getTime())[0] || null;
        const llegadaTotal = [ida?.fechaEntrada, vuelta?.fechaEntrada].map(parseDateSafe).filter(Boolean)
            .sort((a, b) => b.getTime() - a.getTime())[0] || null;
        const duracionTotal = salidaTotal && llegadaTotal ? formatDurationHuman(salidaTotal, llegadaTotal) : "-";

        const renderGastosTable = gastos => {
            const list = Array.isArray(gastos) ? gastos : [];
            if (!list.length) return '<div class="text-muted small">Sin gastos registrados.</div>';
            const rows = list.map(g => {
                const tipo = resolveTipoLabel(g.idTipoGasto);
                const desc = escapeHtml(g.descripcion || "-");
                const monto = formatMoney(Number(g.monto) || 0);
                const fecha = escapeHtml(g.fechaGasto || "-");
                const href = safeHref(g.evidenciaUrl);
                const evidencia = href
                    ? `<a class="btn btn-outline-secondary btn-sm py-0" href="${escapeHtml(href)}" target="_blank" rel="noopener">Ver</a>`
                    : "-";
                return `
                    <tr>
                        <td>${escapeHtml(tipo)}</td>
                        <td>${desc}</td>
                        <td class="text-end fw-semibold text-danger">${monto}</td>
                        <td>${fecha}</td>
                        <td class="text-end">${evidencia}</td>
                    </tr>
                `;
            }).join("");
            return `
                <div class="table-responsive">
                    <table class="table table-sm table-bordered align-middle mb-0" style="font-size:0.85rem">
                        <thead class="table-light">
                            <tr>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th class="text-end">Monto</th>
                                <th>Fecha</th>
                                <th class="text-end">Evidencia</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        };

        const renderTramo = (titulo, tramo) => {
            if (!tramo) {
                return `
                    <div class="card bg-light border-0 mb-3 p-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold">${escapeHtml(titulo)}</span>
                            <span class="badge bg-secondary">No registrado</span>
                        </div>
                        <div class="text-muted small">No hay datos para este tramo.</div>
                    </div>
                `;
            }

            const gastos = calcGastos(tramo);
            const salida = formatDateTimeHuman(tramo.fechaSalida);
            const llegada = formatDateTimeHuman(tramo.fechaEntrada);
            const duracion = formatDurationHuman(tramo.fechaSalida, tramo.fechaEntrada);
            const badgeClass = String(tramo.estadoViaje || "").toLowerCase() === "completado" ? "bg-success" : "bg-warning text-dark";

            return `
                <div class="card border mb-3 p-3">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="fw-bold text-primary">${escapeHtml(titulo)}</span>
                        <span class="badge ${badgeClass}">${escapeHtml(String(tramo.estadoViaje || "Pendiente").replaceAll("_", " "))}</span>
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
                </div>
            `;
        };

        viajeViewBody.innerHTML = `
            <div class="mb-3">
                <h5 class="fw-bold text-dark mb-1">${escapeHtml(data.nombreViaje || "Sin Nombre")}</h5>
                <p class="text-muted small mb-0">Contenedores: <span class="fw-bold text-dark">${escapeHtml(lotesLabel)}</span></p>
            </div>
            <div class="row">
                <div class="col-md-6">${renderTramo("🚛 Tramo Ida", ida)}</div>
                <div class="col-md-6">${renderTramo("↩ Tramo Vuelta", vuelta)}</div>
            </div>
            <div class="mt-2 border-top pt-3">
                <div class="row g-3 text-center">
                    <div class="col-md-4 col-sm-6">
                        <div class="border rounded p-2 bg-light">
                            <div class="small text-muted mb-1">Duración Total</div>
                            <strong class="fs-6">${escapeHtml(duracionTotal)}</strong>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <div class="border rounded p-2 bg-light">
                            <div class="small text-muted mb-1">Total Gastado</div>
                            <strong class="fs-6 text-danger">${formatMoney(totalGastos)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    // --- REDIRECTS & CLICK HANDLERS ---
    btnNuevoViaje?.addEventListener("click", () => {
        window.location.href = "/viajes/formulario";
    });

    listaViajes?.addEventListener("click", event => {
        const actionBtn = event.target.closest("[data-viaje-action]");
        if (actionBtn) {
            event.preventDefault();
            event.stopPropagation();
            const action = actionBtn.dataset.viajeAction;
            const viajeId = actionBtn.dataset.viajeId;
            if (action === "view") {
                abrirModalVerViaje(viajeId);
            } else {
                window.location.href = "/viajes/formulario?id=" + viajeId;
            }
            return;
        }

        const tr = event.target.closest("tr[data-viaje-id]");
        if (!tr) return;
        const viajeId = tr.dataset.viajeId;
        window.location.href = "/viajes/formulario?id=" + viajeId;
    });

    // Pager listeners
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

    // Filtering listeners
    document.getElementById("filtroBusquedaViajes")?.addEventListener("input", event => {
        clearTimeout(debounceViajes);
        debounceViajes = setTimeout(() => {
            filtrosViajes.q = event.target.value.trim();
        }, 250);
    });

    document.getElementById("btnAplicarFiltrosViajes")?.addEventListener("click", () => {
        const inputBuscar = document.getElementById("filtroBusquedaViajes");
        const inputInicio = document.getElementById("filtroFechaInicioViajes");
        const inputFin = document.getElementById("filtroFechaFinViajes");
        const selectEstado = document.getElementById("filtroEstadoViajes");

        filtrosViajes.q = inputBuscar?.value.trim() || "";
        filtrosViajes.fechaInicio = inputInicio?.value || "";
        filtrosViajes.fechaFin = inputFin?.value || "";

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

        const inputBuscar = document.getElementById("filtroBusquedaViajes");
        const inputInicio = document.getElementById("filtroFechaInicioViajes");
        const inputFin = document.getElementById("filtroFechaFinViajes");
        const selectEstado = document.getElementById("filtroEstadoViajes");

        if (inputBuscar) inputBuscar.value = "";
        if (inputInicio) inputInicio.value = "";
        if (inputFin) inputFin.value = "";
        if (selectEstado) selectEstado.value = "";
        cargarViajes(0);
    });

    // Populate filter states dropdown
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
                    option.value = String(estado).replaceAll("_", " ");
                    option.textContent = String(estado).replaceAll("_", " ");
                    selectFiltro.appendChild(option);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    // --- INITIALIZATION ---
    const inputInicio = document.getElementById("filtroFechaInicioViajes");
    const inputFin = document.getElementById("filtroFechaFinViajes");
    const today = new Date();
    const addDays = (date, days) => {
        const copy = new Date(date);
        copy.setDate(copy.getDate() + days);
        return copy;
    };
    const formatDateInput = date => {
        const pad = num => String(num).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    if (inputInicio && !inputInicio.value) {
        inputInicio.value = formatDateInput(today);
        filtrosViajes.fechaInicio = inputInicio.value;
    }
    if (inputFin && !inputFin.value) {
        inputFin.value = formatDateInput(addDays(today, 14));
        filtrosViajes.fechaFin = inputFin.value;
    }

    cargarEstadosViaje();
    cargarViajes(0);
});
