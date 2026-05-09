document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("viajeModal");
    const viewModal = document.getElementById("viajeViewModal");
    const btnNuevoViaje = document.getElementById("btnNuevoViaje");
    const btnCerrarViaje = document.getElementById("btnCerrarViaje");
    const btnCerrarViajeView = document.getElementById("btnCerrarViajeView");
    const viajeForm = document.getElementById("viajeForm");
    const viajeViewBody = document.getElementById("viajeViewBody");
    const usarMismosDatos = document.getElementById("usarMismosDatos");
    const estadoGuardado = document.getElementById("estadoGuardado");
    const btnGuardarViaje = document.getElementById("btnGuardarViaje");
    const modalTitle = modal?.querySelector(".mp-modal-title");
    const viewModalTitle = viewModal?.querySelector(".mp-modal-title");
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
    let tiposGastoCache = [];

    const tipoGastoMap = {
        combustible: 1,
        viaticos: 2,
        peaje: 3,
        mantenimiento: 4
    };
    let tiposGastoCargados = false;
    let estadosViajeCargados = false;

    const state = {
        ida: {detalleId: 0, gastos: [], editIndex: null},
        vuelta: {detalleId: 0, gastos: [], editIndex: null}
    };

    // V2: lotes state
    let lotesDisponibles = [];
    let lotesSeleccionados = [];
    let loteIdsPendientes = [];
    let paisesCargados = false;
    let lotesCargados = false;

    const getLoteId = lote => Number(lote?.idLote ?? lote?.id_lote ?? lote?.id);

    const renderLoteSelect = () => {
        const select = document.getElementById("loteSelect");
        if (!select) return;
        const selectedIds = new Set(lotesSeleccionados.map(getLoteId).filter(Boolean));
        const disponibles = Array.isArray(lotesDisponibles) ? lotesDisponibles : [];

        const current = select.value;
        select.innerHTML = "";

        const optPlaceholder = document.createElement("option");
        optPlaceholder.value = "";
        optPlaceholder.textContent = "Seleccione un lote";
        select.appendChild(optPlaceholder);

        const opts = disponibles
            .filter(l => !selectedIds.has(getLoteId(l)))

        if (!opts.length) {
            const optEmpty = document.createElement("option");
            optEmpty.value = "";
            optEmpty.disabled = true;
            optEmpty.textContent = "No hay lotes disponibles";
            select.appendChild(optEmpty);
        } else {
            opts.forEach(lote => {
                const id = getLoteId(lote);
                if (!id) return;
                const opt = document.createElement("option");
                opt.value = String(id);
                const numero = lote?.numeroLote || `Lote #${id}`;
                const estado = lote?.estado ? ` (${String(lote.estado).replaceAll("_", " ")})` : "";
                opt.textContent = `${numero}${estado}`;
                select.appendChild(opt);
            });
        }

        if (current) select.value = current;
    };

    const renderLotesAsociados = () => {
        const cont = document.getElementById("lotesAsociados");
        if (!cont) return;

        cont.innerHTML = "";
        if (!lotesSeleccionados.length) {
            renderLoteSelect();
            actualizarResumen();
            return;
        }

        lotesSeleccionados.forEach(lote => {
            const id = getLoteId(lote);
            const numero = lote?.numeroLote || `Lote #${id || "-"}`;
            const chip = document.createElement("span");
            chip.className = "badge bg-primary d-inline-flex align-items-center gap-2";
            chip.style.cursor = "default";
            chip.textContent = numero;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-sm btn-light";
            btn.textContent = "x";
            btn.setAttribute("aria-label", `Quitar ${numero}`);
            btn.addEventListener("click", () => {
                lotesSeleccionados = lotesSeleccionados.filter(l => getLoteId(l) !== id);
                renderLotesAsociados();
            });

            chip.appendChild(btn);
            cont.appendChild(chip);
        });

        renderLoteSelect();
        actualizarResumen();
    };

    const syncLotesPendientes = () => {
        if (!loteIdsPendientes.length) return;
        const ids = new Set(loteIdsPendientes.map(Number).filter(Boolean));
        lotesSeleccionados = (Array.isArray(lotesDisponibles) ? lotesDisponibles : [])
            .filter(l => ids.has(getLoteId(l)));
        // Si algún id no aparece en la lista, igual lo preservamos para no perderlo al guardar
        ids.forEach(id => {
            if (lotesSeleccionados.some(l => getLoteId(l) === id)) return;
            lotesSeleccionados.push({idLote: id, numeroLote: `Lote #${id}`});
        });
        loteIdsPendientes = [];
        renderLotesAsociados();
    };

    const cargarLotesDisponibles = async () => {
        if (lotesCargados) return;
        try {
            const res = await fetch("/api/lotes", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar lotes");
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                throw new Error("Respuesta invalida al cargar lotes (sesion expirada o endpoint bloqueado)");
            }
            const data = await res.json();
            lotesDisponibles = Array.isArray(data) ? data : [];
            lotesCargados = true;
            syncLotesPendientes();
            renderLoteSelect();
        } catch (error) {
            console.error(error);
        }
    };

    const cargarPaises = async () => {
        if (paisesCargados) return;
        try {
            const res = await fetch("/api/viajes/paises", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar paises");
            const paises = await res.json();
            const ids = ["idaPaisSalida", "idaPaisDestino", "vueltaPaisSalida", "vueltaPaisDestino"];
            ids.forEach(id => {
                const select = document.getElementById(id);
                if (!select) return;
                const current = select.value;
                select.innerHTML = '<option value="">Seleccione</option>';
                (Array.isArray(paises) ? paises : []).forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p;
                    opt.textContent = p;
                    select.appendChild(opt);
                });
                if (current) select.value = current;
            });
            paisesCargados = true;
        } catch (error) {
            console.error(error);
        }
    };

    // El selector de lotes se usa como atajo visual (y para accesibilidad).
    // La asociacion real se hace desde el modal de lotes.

    const resetFormulario = () => {
        viajeForm?.reset();
        ["idaCamionId", "idaChoferId", "vueltaCamionId", "vueltaChoferId"].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = "";
        });
        // Reset location fields
        ["idaPaisSalida","idaPaisDestino","idaDireccionSalida","idaDireccionDestino","idaObservaciones",
         "vueltaPaisSalida","vueltaPaisDestino","vueltaDireccionSalida","vueltaDireccionDestino","vueltaObservaciones"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        lotesSeleccionados = [];
        renderLotesAsociados();
        state.ida.gastos = [];
        state.vuelta.gastos = [];
        state.ida.detalleId = 0;
        state.vuelta.detalleId = 0;
        renderGastos("ida");
        renderGastos("vuelta");
        actualizarDuraciones();
        const btnEliminar = document.getElementById("btnEliminarViaje");
        if (btnEliminar) btnEliminar.style.display = "none";
        if (usarMismosDatos) {
            usarMismosDatos.checked = false;
            const camposVuelta = document.querySelectorAll("#tab-vuelta input, #tab-vuelta select, #tab-vuelta button, #tab-vuelta textarea");
            camposVuelta.forEach(el => {
                if (!el.classList.contains("tab-button")) el.disabled = false;
            });
        }
    };

    const abrirModal = viajeId => {
        modal?.classList.add("is-open");
        if (estadoGuardado) estadoGuardado.textContent = "";
        if (!tiposGastoCargados) cargarTiposGasto();
        if (!estadosViajeCargados) cargarEstadosViaje();
        if (!paisesCargados) cargarPaises();
        cargarLotesDisponibles();
        if (modalTitle) {
            modalTitle.textContent = viajeId ? "Editar viaje" : "Agregar viaje";
        }
        if (viajeForm) {
            if (viajeId) {
                viajeForm.dataset.viajeId = viajeId;
                cargarViajeDetalle(viajeId);
            } else {
                delete viajeForm.dataset.viajeId;
                resetFormulario();
            }
        }
    };

    const cerrarModal = () => {
        modal?.classList.remove("is-open");
    };

    const abrirModalVerViaje = async viajeId => {
        if (!viajeId) return;
        viewModal?.classList.add("is-open");
        if (viajeViewBody) viajeViewBody.innerHTML = "Cargando...";
        if (viewModalTitle) viewModalTitle.textContent = "Detalle del viaje";
        try {
            // Para mostrar numeros de lote en el detalle, intentamos tener el catalogo cargado.
            await cargarLotesDisponibles();
            await renderViajeDetalleView(viajeId);
        } catch (error) {
            console.error(error);
            if (viajeViewBody) {
                viajeViewBody.innerHTML = '<div class="text-danger text-center">Error al cargar el viaje</div>';
            }
        }
    };

    const cerrarModalVerViaje = () => {
        viewModal?.classList.remove("is-open");
    };

    btnNuevoViaje?.addEventListener("click", () => abrirModal());
    btnCerrarViaje?.addEventListener("click", cerrarModal);
    modal?.querySelector(".mp-modal-backdrop")?.addEventListener("click", cerrarModal);

    btnCerrarViajeView?.addEventListener("click", cerrarModalVerViaje);
    viewModal?.querySelector(".mp-modal-backdrop")?.addEventListener("click", cerrarModalVerViaje);
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (viewModal?.classList.contains("is-open")) {
            cerrarModalVerViaje();
        }
    });

    const tabs = document.querySelectorAll(".tab-button");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(btn => btn.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add("active");
        });
    });

    const syncDatalist = (inputId, hiddenId, listId) => {
        const input = document.getElementById(inputId);
        const hidden = document.getElementById(hiddenId);
        const list = document.getElementById(listId);
        if (!input || !hidden || !list) return;
        input.addEventListener("change", () => {
            const option = Array.from(list.options).find(opt => opt.value === input.value);
            hidden.value = option ? option.dataset.id : "";
        });
    };

    syncDatalist("idaChoferInput", "idaChoferId", "choferesList");
    syncDatalist("vueltaChoferInput", "vueltaChoferId", "choferesList");

    const parseNumber = value => {
        const number = Number.parseFloat(value);
        return Number.isNaN(number) ? 0 : number;
    };

    const parseDateSafe = value => {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
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
        const minutos = Math.floor(remaining / 60000);
        if (dias > 0) return `${dias}d ${horas}h ${minutos}m`;
        if (horas > 0) return `${horas}h ${minutos}m`;
        return `${minutos}m`;
    };

    const normalizeDateTime = value => {
        if (!value) return null;
        return value.length === 16 ? `${value}:00` : value;
    };

    const formatDateTimeLocal = value => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const pad = num => String(num).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    const formatDateOnly = value => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        const pad = num => String(num).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    const formatMoney = value => `$${value.toFixed(2)}`;

    const calcDuracion = (inicio, fin) => {
        if (!inicio || !fin) return "-";
        const diff = new Date(fin) - new Date(inicio);
        if (diff <= 0) return "-";
        const horas = Math.floor(diff / 36e5);
        const minutos = Math.floor((diff % 36e5) / 60000);
        return `${horas}h ${minutos}m`;
    };

    const actualizarDuraciones = () => {
        const idaDuracion = document.getElementById("idaDuracion");
        const vueltaDuracion = document.getElementById("vueltaDuracion");
        if (idaDuracion) {
            idaDuracion.textContent = calcDuracion(
                document.getElementById("idaSalida")?.value,
                document.getElementById("idaLlegada")?.value
            );
        }
        if (vueltaDuracion) {
            vueltaDuracion.textContent = calcDuracion(
                document.getElementById("vueltaSalida")?.value,
                document.getElementById("vueltaLlegada")?.value
            );
        }
    };

    ["idaSalida", "idaLlegada", "vueltaSalida", "vueltaLlegada"].forEach(id => {
        document.getElementById(id)?.addEventListener("change", actualizarDuraciones);
    });

    const actualizarResumen = () => {
        const gastosIda = state.ida.gastos.reduce((sum, g) => sum + g.monto, 0);
        const gastosVuelta = state.vuelta.gastos.reduce((sum, g) => sum + g.monto, 0);
        const totalGastos = gastosIda + gastosVuelta;

        const elGastosIda = document.getElementById("resumenGastosIda");
        const elGastosVuelta = document.getElementById("resumenGastosVuelta");
        const totalGastado = document.getElementById("totalGastado");
        const resumenLotes = document.getElementById("resumenLotes");
        if (elGastosIda) elGastosIda.textContent = formatMoney(gastosIda);
        if (elGastosVuelta) elGastosVuelta.textContent = formatMoney(gastosVuelta);
        if (totalGastado) totalGastado.textContent = formatMoney(totalGastos);
        if (resumenLotes) resumenLotes.textContent = String(lotesSeleccionados.length);

        const idaTotal = document.getElementById("idaTotalGastos");
        const vueltaTotal = document.getElementById("vueltaTotalGastos");
        if (idaTotal) idaTotal.textContent = formatMoney(gastosIda);
        if (vueltaTotal) vueltaTotal.textContent = formatMoney(gastosVuelta);
    };

    const renderGastos = tramo => {
        const tbody = document.getElementById(`${tramo}GastosBody`);
        if (!tbody) return;
        tbody.innerHTML = "";
        state[tramo].gastos.forEach((gasto, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${gasto.tipoLabel || gasto.tipoRaw || "-"}</td>
                <td>${gasto.descripcion || "-"}</td>
                <td>${formatMoney(gasto.monto)}</td>
                <td>${gasto.fecha || "-"}</td>
                <td>
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-edit="${tramo}" data-index="${index}">Editar</button>
                    <button type="button" class="btn btn-danger btn-sm" data-delete="${tramo}" data-index="${index}">Eliminar</button>
                    ${gasto.evidencia ? `<button type="button" class="btn btn-outline-secondary btn-sm" data-evidencia="${gasto.evidencia}">Ver</button>` : ""}
                </td>
            `;
            tbody.appendChild(row);
        });
        actualizarResumen();
    };

    const resetGastoForm = tramo => {
        const form = document.getElementById(`${tramo}GastoForm`);
        if (!form) return;
        form.querySelector("[data-gasto-tipo]").value = "";
        form.querySelector("[data-gasto-desc]").value = "";
        form.querySelector("[data-gasto-monto]").value = "";
        form.querySelector("[data-gasto-fecha]").value = "";
        form.querySelector("[data-gasto-evidencia]").value = "";
        state[tramo].editIndex = null;
        form.classList.remove("is-open");
    };

    document.querySelectorAll("[data-gasto-btn]").forEach(btn => {
        btn.addEventListener("click", () => {
            const tramo = btn.dataset.gastoBtn;
            document.getElementById(`${tramo}GastoForm`)?.classList.add("is-open");
        });
    });

    document.querySelectorAll("[data-gasto-cancelar]").forEach(btn => {
        btn.addEventListener("click", () => {
            resetGastoForm(btn.dataset.gastoCancelar);
        });
    });

    document.querySelectorAll("[data-gasto-guardar]").forEach(btn => {
        btn.addEventListener("click", () => {
            const tramo = btn.dataset.gastoGuardar;
            const form = document.getElementById(`${tramo}GastoForm`);
            if (!form) return;
            const tipoSelect = form.querySelector("[data-gasto-tipo]");
            const rawTipo = tipoSelect.value;
            const tipoLabel = tipoSelect.options[tipoSelect.selectedIndex]?.textContent?.trim() || rawTipo;
            const tipoId = Number(rawTipo) || tipoGastoMap[String(rawTipo || "").toLowerCase()] || 0;
            const descripcion = form.querySelector("[data-gasto-desc]").value;
            const monto = parseNumber(form.querySelector("[data-gasto-monto]").value);
            const fecha = form.querySelector("[data-gasto-fecha]").value;
            const evidenciaInput = form.querySelector("[data-gasto-evidencia]");
            const evidencia = evidenciaInput.files[0]?.name || "";

            if (!tipoId || monto <= 0) {
                return;
            }

            const existingId = state[tramo].editIndex !== null
                ? (state[tramo].gastos[state[tramo].editIndex]?.id || 0)
                : 0;
            const gasto = {id: existingId, tipoId, tipoLabel, tipoRaw: rawTipo, descripcion, monto, fecha, evidencia};
            if (state[tramo].editIndex !== null) {
                state[tramo].gastos[state[tramo].editIndex] = gasto;
            } else {
                state[tramo].gastos.push(gasto);
            }
            renderGastos(tramo);
            resetGastoForm(tramo);
        });
    });

    modal?.addEventListener("click", event => {
        const editBtn = event.target.closest("[data-edit]");
        if (editBtn) {
            const tramo = editBtn.dataset.edit;
            const index = Number(editBtn.dataset.index);
            const gasto = state[tramo].gastos[index];
            const form = document.getElementById(`${tramo}GastoForm`);
            if (!form || !gasto) return;
            form.querySelector("[data-gasto-tipo]").value = gasto.tipoRaw || gasto.tipoId || "";
            form.querySelector("[data-gasto-desc]").value = gasto.descripcion;
            form.querySelector("[data-gasto-monto]").value = gasto.monto;
            form.querySelector("[data-gasto-fecha]").value = gasto.fecha;
            state[tramo].editIndex = index;
            form.classList.add("is-open");
        }
        const deleteBtn = event.target.closest("[data-delete]");
        if (deleteBtn) {
            const tramo = deleteBtn.dataset.delete;
            const index = Number(deleteBtn.dataset.index);
            state[tramo].gastos.splice(index, 1);
            renderGastos(tramo);
        }
        const evidenciaBtn = event.target.closest("[data-evidencia]");
        if (evidenciaBtn) {
            alert(`Evidencia: ${evidenciaBtn.dataset.evidencia}`);
        }
    });

    const seleccion = {camionTramo: "ida", choferTramo: "ida"};
    const modalBuscarCamion = document.getElementById("modalBuscarCamionViaje");
    const modalBuscarCliente = document.getElementById("modalBuscarClienteViaje");
    const modalBuscarChofer = document.getElementById("modalBuscarChoferViaje");
    const modalBuscarLote = document.getElementById("modalBuscarLoteViaje");

    const paginacionCamionesModal = {page: 0, size: 10, totalPages: 1, totalElements: 0, sort: "idCamion,desc"};
    const filtrosCamionesModal = {q: "", estado: ""};
    let camionesModalCache = [];
    let debounceCamionesModal = null;



    const paginacionChoferesModal = {page: 0, size: 10, totalPages: 1, totalElements: 0};
    const filtrosChoferesModal = {q: "", estado: ""};
    let choferesModalCache = [];
    let debounceChoferesModal = null;

    const escapeHtml = text => String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const safeHref = rawUrl => {
        const value = String(rawUrl ?? "").trim();
        if (!value) return "";
        try {
            const u = new URL(value, window.location.origin);
            if (u.protocol !== "http:" && u.protocol !== "https:") return "";
            return u.href;
        } catch {
            return "";
        }
    };

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
        listaViajes.innerHTML = '<div class="card-clean text-center">Cargando viajes...</div>';
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
            listaViajes.innerHTML = '<div class="card-clean text-center text-danger">Error al cargar viajes</div>';
        }
    }

    function renderViajes() {
        if (!listaViajes) return;
        if (!viajesCache.length) {
            listaViajes.innerHTML = '<div class="card-clean text-center">No hay viajes registrados</div>';
            const total = document.getElementById("totalViajes");
            if (total) total.textContent = "Mostrando 0 viajes";
            actualizarPaginacionViajes();
            return;
        }

        let ingresosPagina = 0;
        let gastosPagina = 0;
        let gananciaPagina = 0;
        let activosPagina = 0;
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
            gastosPagina += gastoNumero;
            if (isActivo(ida) || isActivo(vuelta)) {
                activosPagina += 1;
            }

            const estadoIdaKey = String(ida?.estadoViaje || "").toLowerCase().replaceAll(" ", "_");
            const estadoVueltaKey = String(vuelta?.estadoViaje || "").toLowerCase().replaceAll(" ", "_");
            const estadoIdaLabel = String(ida?.estadoViaje || "-").replaceAll("_", " ");
            const estadoVueltaLabel = String(vuelta?.estadoViaje || "-").replaceAll("_", " ");
            const idaFechaSalida = formatDateTimeHuman(ida?.fechaSalida);
            const idaFechaLlegada = formatDateTimeHuman(ida?.fechaEntrada);
            const vueltaFechaSalida = formatDateTimeHuman(vuelta?.fechaSalida);
            const vueltaFechaLlegada = formatDateTimeHuman(vuelta?.fechaEntrada);
            const headerEstadoKey = estadoIdaKey || estadoVueltaKey;
            const headerFecha = ida?.fechaSalida ? idaFechaSalida : (vuelta?.fechaSalida ? vueltaFechaSalida : "-");

            const lotes = Array.isArray(viaje.lotes) ? viaje.lotes : [];
            const totalLotes = Number(viaje.totalLotes ?? lotes.length) || lotes.length;
            const lotesTransito = lotes.filter(l => String(l?.estado || "").toLowerCase() === "en_transito").length;

            return `
    <div class="trip-card trip-card-action" role="button" tabindex="0" data-viaje-id="${escapeHtml(idViaje)}">
        <div class="trip-card-header">
            <div>
                <div class="trip-card-kicker">Viaje</div>
                <div class="trip-card-title">${escapeHtml(viaje.nombreVieje || "Sin nombre")}</div>
            </div>
            <div class="trip-card-date">
                <span>Salida</span>
                <span class="status-badge ${headerEstadoKey ? `status-${escapeHtml(headerEstadoKey)}` : ""}">
                    ${escapeHtml(headerFecha)}
                </span>
            </div>
        </div>
        <div class="trip-card-body">
            <div class="trip-legs">
                <div class="trip-leg-block">
                    <div class="trip-leg-main">
                        <div class="trip-leg-title">Datos del viaje (Ida)</div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Camion</span>
                            <span class="trip-leg-value">${escapeHtml(ida?.camionNombre || ida?.camionPlaca || "-")}</span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Chofer</span>
                            <span class="trip-leg-value">${escapeHtml(ida?.conductorNombre || "-")}</span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Estado</span>
                            <span class="status-badge ${estadoIdaKey ? `status-${escapeHtml(estadoIdaKey)}` : ""}">
                                ${escapeHtml(estadoIdaLabel)}
                            </span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Salida</span>
                            <span class="status-badge ${estadoIdaKey ? `status-${escapeHtml(estadoIdaKey)}` : ""}">
                                ${escapeHtml(idaFechaSalida)}
                            </span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Llegada</span>
                            <span class="trip-leg-value">${escapeHtml(idaFechaLlegada)}</span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Ruta</span>
                            <span class="trip-leg-value">${escapeHtml([ida?.paisSalida, ida?.paisDestino].filter(Boolean).join(" → ") || "-")}</span>
                        </div>
                    </div>
                    <div class="trip-leg-stats">
                        <div class="trip-metric-item">
                            <span>Gastos</span>
                            <span>${formatMoney(parseNumber(ida?.gastoTotal))}</span>
                        </div>
                    </div>
                </div>

                <div class="trip-leg-block">
                    <div class="trip-leg-main">
                        <div class="trip-leg-title">Datos del viaje (Vuelta)</div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Camion</span>
                            <span class="trip-leg-value">${escapeHtml(vuelta?.camionNombre || vuelta?.camionPlaca || "-")}</span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Chofer</span>
                            <span class="trip-leg-value">${escapeHtml(vuelta?.conductorNombre || "-")}</span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Estado</span>
                            <span class="status-badge ${estadoVueltaKey ? `status-${escapeHtml(estadoVueltaKey)}` : ""}">
                                ${escapeHtml(estadoVueltaLabel)}
                            </span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Salida</span>
                            <span class="status-badge ${estadoVueltaKey ? `status-${escapeHtml(estadoVueltaKey)}` : ""}">
                                ${escapeHtml(vueltaFechaSalida)}
                            </span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Llegada</span>
                            <span class="trip-leg-value">${escapeHtml(vueltaFechaLlegada)}</span>
                        </div>
                        <div class="trip-leg-row">
                            <span class="trip-leg-label">Ruta</span>
                            <span class="trip-leg-value">${escapeHtml([vuelta?.paisSalida, vuelta?.paisDestino].filter(Boolean).join(" → ") || "-")}</span>
                        </div>
                    </div>
                    <div class="trip-leg-stats">
                        <div class="trip-metric-item">
                            <span>Gastos</span>
                            <span>${formatMoney(parseNumber(vuelta?.gastoTotal))}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="trip-total">
                <div class="trip-total-title">Total</div>
                <div class="trip-metric-item">
                    <span>Gastos</span>
                    <span>${gastoTotal}</span>
                </div>
                <div class="trip-metric-item">
                    <span>Lotes</span>
                    <span>${escapeHtml(String(totalLotes))}</span>
                </div>
                <div class="trip-metric-item">
                    <span>Lotes en transito</span>
                    <span>${escapeHtml(String(lotesTransito))}</span>
                </div>

                <div class="trip-card-actions">
                    <button type="button" class="btn btn-outline-secondary btn-sm trip-card-action-btn"
                        data-viaje-action="edit" data-viaje-id="${escapeHtml(idViaje)}">
                        Actualizar
                    </button>
                    <button type="button" class="btn btn-primary btn-sm trip-card-action-btn"
                        data-viaje-action="view" data-viaje-id="${escapeHtml(idViaje)}">
                        Ver viaje
                    </button>
                </div>
            </div>
        </div>

        
    </div>
`;
        }).join("");

        const inicio = paginacionViajes.page * paginacionViajes.size;
        const fin = inicio + viajesCache.length;
        const total = document.getElementById("totalViajes");
        if (total) total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionViajes.totalElements} viajes`;
        actualizarPaginacionViajes();

        const metricIngresos = document.getElementById("metricIngresos");
        const metricGastos = document.getElementById("metricGastos");
        const metricGanancia = document.getElementById("metricGanancia");
        const metricActivos = document.getElementById("metricActivos");
        if (metricGastos) metricGastos.textContent = formatMoney(gastosPagina);
        if (metricActivos) metricActivos.textContent = String(activosPagina);
        const metricLotes = document.getElementById("metricLotes");
        if (metricLotes) {
            const lotesTransitoPagina = viajesCache.reduce((sum, v) => {
                const lotes = Array.isArray(v?.lotes) ? v.lotes : [];
                return sum + lotes.filter(l => String(l?.estado || "").toLowerCase() === "en_transito").length;
            }, 0);
            metricLotes.textContent = String(lotesTransitoPagina);
        }
    }

    function actualizarPaginacionViajes() {
        const btnPrev = document.getElementById("btnPrevViajes");
        const btnNext = document.getElementById("btnNextViajes");
        const pagina = document.getElementById("paginaActualViajes");
        const paginaActual = paginacionViajes.page + 1;
        const totalPaginas = Math.max(paginacionViajes.totalPages, 1);
        const hayAnterior = paginacionViajes.page > 0;
        const haySiguiente = paginacionViajes.page < totalPaginas - 1;
        if (btnPrev) {
            btnPrev.disabled = !hayAnterior;
            btnPrev.parentElement?.classList.toggle("disabled", !hayAnterior);
        }
        if (btnNext) {
            btnNext.disabled = !haySiguiente;
            btnNext.parentElement?.classList.toggle("disabled", !haySiguiente);
        }
        if (pagina) pagina.textContent = `${paginaActual} / ${totalPaginas}`;
    }

    let focusReturnTarget = null;

    const abrirModalCamion = tramo => {
        seleccion.camionTramo = tramo;
        focusReturnTarget = document.getElementById(tramo === "vuelta" ? "vueltaCamionInput" : "idaCamionInput");
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarCamion);
        modalInstance.show();
    };

    const abrirModalCliente = () => {
        if (!modalBuscarCliente) return;
        focusReturnTarget = document.getElementById("clienteInput");
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarCliente);
        modalInstance.show();
    };

    document.getElementById("btnBuscarCamionIda")?.addEventListener("click", () => abrirModalCamion("ida"));
    document.getElementById("btnBuscarCamionVuelta")?.addEventListener("click", () => abrirModalCamion("vuelta"));
    document.getElementById("btnBuscarCliente")?.addEventListener("click", abrirModalCliente);

    const abrirModalChofer = tramo => {
        seleccion.choferTramo = tramo;
        focusReturnTarget = document.getElementById(tramo === "vuelta" ? "vueltaChoferInput" : "idaChoferInput");
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarChofer);
        modalInstance.show();
    };

    const abrirModalLotes = async () => {
        if (!modalBuscarLote) return;
        await cargarLotesDisponibles();
        await cargarEstadosLoteModal();
        renderLotesViajeModal();
        bootstrap.Modal.getOrCreateInstance(modalBuscarLote).show();
    };

    // El usuario espera que el boton "+ Agregar" abra el modal de lotes.
    document.getElementById("btnAgregarLote")?.addEventListener("click", abrirModalLotes);
    document.getElementById("btnNuevoLoteDesdeViaje")?.addEventListener("click", () => {
        window.location.href = "/lotes";
    });

    const filtrosLotesModal = {q: "", estado: ""};
    let debounceLotesModal = null;

    const cargarEstadosLoteModal = async () => {
        const select = document.getElementById("filtroEstadoLotesViajeModal");
        if (!select) return;
        try {
            const res = await fetch("/api/lotes/estados", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar estados de lote");
            const data = await res.json();
            const current = select.value;
            select.innerHTML = '<option value="" selected>Todos los estados</option>';
            (Array.isArray(data) ? data : []).forEach(v => {
                const opt = document.createElement("option");
                opt.value = v;
                opt.textContent = String(v).replaceAll("_", " ");
                select.appendChild(opt);
            });
            if (current) select.value = current;
        } catch (e) {
            console.error(e);
        }
    };

    const getLotesFiltradosModal = () => {
        const q = filtrosLotesModal.q.trim().toLowerCase();
        const estado = filtrosLotesModal.estado.trim().toLowerCase();
        return (Array.isArray(lotesDisponibles) ? lotesDisponibles : []).filter(l => {
            if (estado && String(l?.estado || "").toLowerCase() !== estado) return false;
            if (!q) return true;
            const numero = String(l?.numeroLote || "").toLowerCase();
            const enc = String(l?.nombreEncargado || "").toLowerCase();
            const desc = String(l?.descripcion || "").toLowerCase();
            return numero.includes(q) || enc.includes(q) || desc.includes(q);
        });
    };

    const renderLotesViajeModal = () => {
        const tbody = document.getElementById("tablaLotesViaje");
        if (!tbody) return;
        const list = getLotesFiltradosModal();
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay lotes</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(l => {
            const id = getLoteId(l);
            const numero = l?.numeroLote || `Lote #${id}`;
            const estado = String(l?.estado || "-").replaceAll("_", " ");
            const cat = l?.categoriaNombre || "-";
            const rem = l?.remitenteNombre || "-";
            const dest = l?.destinatarioNombre || "-";
            const ya = lotesSeleccionados.some(x => getLoteId(x) === id);
            const btn = ya
                ? '<button type="button" class="btn btn-outline-secondary btn-sm" disabled>Agregado</button>'
                : `<button type="button" class="btn btn-primary btn-sm" data-select-lote="${escapeHtml(String(id))}">Agregar</button>`;
            return `
                <tr>
                    <td>${escapeHtml(String(id))}</td>
                    <td>${escapeHtml(numero)}</td>
                    <td>${escapeHtml(estado)}</td>
                    <td>${escapeHtml(cat)}</td>
                    <td>${escapeHtml(rem)}</td>
                    <td>${escapeHtml(dest)}</td>
                    <td class="text-end">${btn}</td>
                </tr>
            `;
        }).join("");
    };

    document.getElementById("tablaLotesViaje")?.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-select-lote]");
        if (!btn) return;
        const id = Number(btn.dataset.selectLote);
        if (!id) return;
        if (lotesSeleccionados.some(l => getLoteId(l) === id)) return;
        const match = lotesDisponibles.find(l => getLoteId(l) === id);
        lotesSeleccionados.push(match || {idLote: id, numeroLote: `Lote #${id}`});
        renderLotesAsociados();
        renderLotesViajeModal();
    });

    document.getElementById("filtroBusquedaLotesViajeModal")?.addEventListener("input", (event) => {
        clearTimeout(debounceLotesModal);
        debounceLotesModal = setTimeout(() => {
            filtrosLotesModal.q = event.target.value || "";
            renderLotesViajeModal();
        }, 250);
    });
    document.getElementById("filtroEstadoLotesViajeModal")?.addEventListener("change", (event) => {
        filtrosLotesModal.estado = event.target.value || "";
        renderLotesViajeModal();
    });

    async function cargarViajeDetalle(idViaje) {
        if (!viajeForm) return;
        if (estadoGuardado) {
            estadoGuardado.textContent = "Cargando...";
            estadoGuardado.className = "estado-guardado";
        }
        if (btnGuardarViaje) btnGuardarViaje.disabled = true;
        try {
            if (!estadosViajeCargados) {
                await cargarEstadosViaje();
            }
            const res = await fetch(`/api/viajes/${idViaje}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudo cargar el viaje");
            const data = await res.json();

            resetFormulario();

            document.getElementById("nombreViaje").value = data.nombreViaje || "";

            // V2: lotes asociados
            loteIdsPendientes = Array.isArray(data.loteIds) ? data.loteIds.map(Number).filter(Boolean) : [];
            if (lotesCargados) {
                syncLotesPendientes();
            } else {
                renderLotesAsociados();
            }

            const tramos = Array.isArray(data.tramos) ? data.tramos : [];
            const tramoIda = tramos.find(t => String(t.tipoTramo).toLowerCase() === "ida");
            const tramoVuelta = tramos.find(t => String(t.tipoTramo).toLowerCase() === "vuelta");
            const tramoBase = tramoIda || tramoVuelta;
            if (tramoBase) {
                document.getElementById("pagadoGeneral").checked = Boolean(tramoBase.pagado);
                document.getElementById("ivaGeneral").checked = Boolean(tramoBase.iva);
            }

            if (tramoIda) {
                state.ida.detalleId = Number(tramoIda.id) || 0;
                document.getElementById("idaEstado").value = tramoIda.estadoViaje || "";
                document.getElementById("idaCamionId").value = tramoIda.idCamion || "";
                const idaCamionLabel = tramoIda.camionNombre
                    ? `${tramoIda.camionNombre}${tramoIda.camionPlaca ? ` (${tramoIda.camionPlaca})` : ""}`
                    : (tramoIda.camionPlaca || "");
                document.getElementById("idaCamionInput").value = idaCamionLabel || "";
                document.getElementById("idaChoferId").value = tramoIda.idConductor || "";
                document.getElementById("idaChoferInput").value = tramoIda.conductorNombre || "";
                document.getElementById("idaSalida").value = formatDateTimeLocal(tramoIda.fechaSalida);
                document.getElementById("idaLlegada").value = formatDateTimeLocal(tramoIda.fechaEntrada);

                // Ubicacion (V2)
                document.getElementById("idaPaisSalida").value = tramoIda.paisSalida || "";
                document.getElementById("idaPaisDestino").value = tramoIda.paisDestino || "";
                document.getElementById("idaDireccionSalida").value = tramoIda.direccionSalida || "";
                document.getElementById("idaDireccionDestino").value = tramoIda.direccionDestino || "";
                document.getElementById("idaObservaciones").value = tramoIda.observaciones || "";

                state.ida.gastos = (tramoIda.gastos || []).map(g => ({
                    id: Number(g.id) || 0,
                    tipoId: g.idTipoGasto,
                    tipoLabel: resolveTipoLabel(g.idTipoGasto),
                    tipoRaw: g.idTipoGasto ? String(g.idTipoGasto) : "",
                    descripcion: g.descripcion || "",
                    monto: Number(g.monto) || 0,
                    fecha: g.fechaGasto || "",
                    evidencia: g.evidenciaUrl || ""
                }));
                renderGastos("ida");
            }

            if (tramoVuelta) {
                state.vuelta.detalleId = Number(tramoVuelta.id) || 0;
                document.getElementById("vueltaEstado").value = tramoVuelta.estadoViaje || "";
                document.getElementById("vueltaCamionId").value = tramoVuelta.idCamion || "";
                const vueltaCamionLabel = tramoVuelta.camionNombre
                    ? `${tramoVuelta.camionNombre}${tramoVuelta.camionPlaca ? ` (${tramoVuelta.camionPlaca})` : ""}`
                    : (tramoVuelta.camionPlaca || "");
                document.getElementById("vueltaCamionInput").value = vueltaCamionLabel || "";
                document.getElementById("vueltaChoferId").value = tramoVuelta.idConductor || "";
                document.getElementById("vueltaChoferInput").value = tramoVuelta.conductorNombre || "";
                document.getElementById("vueltaSalida").value = formatDateTimeLocal(tramoVuelta.fechaSalida);
                document.getElementById("vueltaLlegada").value = formatDateTimeLocal(tramoVuelta.fechaEntrada);

                // Ubicacion (V2)
                document.getElementById("vueltaPaisSalida").value = tramoVuelta.paisSalida || "";
                document.getElementById("vueltaPaisDestino").value = tramoVuelta.paisDestino || "";
                document.getElementById("vueltaDireccionSalida").value = tramoVuelta.direccionSalida || "";
                document.getElementById("vueltaDireccionDestino").value = tramoVuelta.direccionDestino || "";
                document.getElementById("vueltaObservaciones").value = tramoVuelta.observaciones || "";

                state.vuelta.gastos = (tramoVuelta.gastos || []).map(g => ({
                    id: Number(g.id) || 0,
                    tipoId: g.idTipoGasto,
                    tipoLabel: resolveTipoLabel(g.idTipoGasto),
                    tipoRaw: g.idTipoGasto ? String(g.idTipoGasto) : "",
                    descripcion: g.descripcion || "",
                    monto: Number(g.monto) || 0,
                    fecha: g.fechaGasto || "",
                    evidencia: g.evidenciaUrl || ""
                }));
                renderGastos("vuelta");
            }

            actualizarDuraciones();
            actualizarResumen();
            if (estadoGuardado) estadoGuardado.textContent = "";
        } catch (error) {
            console.error(error);
            if (estadoGuardado) {
                estadoGuardado.textContent = "Error al cargar el viaje.";
                estadoGuardado.className = "estado-guardado error";
            }
        } finally {
            if (btnGuardarViaje) btnGuardarViaje.disabled = false;
        }
    }

    document.getElementById("btnBuscarChoferIda")?.addEventListener("click", () => abrirModalChofer("ida"));
    document.getElementById("btnBuscarChoferVuelta")?.addEventListener("click", () => abrirModalChofer("vuelta"));

    [modalBuscarCamion, modalBuscarCliente, modalBuscarChofer].forEach(modalEl => {
        if (!modalEl) return;
        modalEl.addEventListener("hide.bs.modal", () => {
            const active = document.activeElement;
            if (active && modalEl.contains(active)) {
                active.blur();
            }
        });
        modalEl.addEventListener("hidden.bs.modal", () => {
            if (focusReturnTarget) {
                focusReturnTarget.focus();
                focusReturnTarget = null;
            }
        });
    });

    async function cargarEstadosViaje() {
        const selectIda = document.getElementById("idaEstado");
        const selectVuelta = document.getElementById("vueltaEstado");
        const selectFiltro = document.getElementById("filtroEstadoViajes");
        if (!selectIda && !selectVuelta && !selectFiltro) return;
        try {
            const res = await fetch("/api/viajes/estados");
            if (!res.ok) throw new Error("No se pudieron cargar estados");
            const estados = await res.json();
            const poblarSelect = (select, placeholder) => {
                if (!select) return;
                const current = select.value;
                select.innerHTML = `<option value="" selected>${placeholder}</option>`;
                estados.forEach(estado => {
                    const option = document.createElement("option");
                    option.value = estado;
                    option.textContent = String(estado).replaceAll("_", " ");
                    select.appendChild(option);
                });
                if (current) select.value = current;
            };

            poblarSelect(selectIda, "Seleccione un estado");
            poblarSelect(selectVuelta, "Seleccione un estado");
            if (selectFiltro) {
                const current = selectFiltro.value;
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
                if (current) selectFiltro.value = current;
            }
            estadosViajeCargados = true;
        } catch (error) {
            console.error(error);
        }
    }

    async function cargarTiposGasto() {
        const selects = document.querySelectorAll("[data-gasto-tipo]");
        if (!selects.length) return;
        try {
            const res = await fetch("/api/tipogasto");
            if (!res.ok) throw new Error("No se pudieron cargar tipos de gasto");
            const tipos = await res.json();
            tiposGastoCache = Array.isArray(tipos) ? tipos : [];
            tipos.forEach(tipo => {
                if (!tipo?.tipoGasto) return;
                tipoGastoMap[String(tipo.tipoGasto).toLowerCase()] = Number(tipo.id);
            });
            selects.forEach(select => {
                const current = select.value;
                select.innerHTML = '<option value="">Seleccione</option>';
                tipos.forEach(tipo => {
                    const option = document.createElement("option");
                    option.value = String(tipo.id);
                    option.textContent = tipo.tipoGasto;
                    select.appendChild(option);
                });
                if (current) select.value = current;
            });
            tiposGastoCargados = true;
        } catch (error) {
            console.error(error);
        }
    }

    const resolveTipoLabel = idTipo => {
        if (!idTipo) return "-";
        const match = tiposGastoCache.find(t => Number(t.id) === Number(idTipo));
        return match?.tipoGasto || `Tipo #${idTipo}`;
    };

    const ensureTiposGastoCache = async () => {
        if (tiposGastoCargados && tiposGastoCache.length) return;
        try {
            const res = await fetch("/api/tipogasto");
            if (!res.ok) throw new Error("No se pudieron cargar tipos de gasto");
            const tipos = await res.json();
            tiposGastoCache = Array.isArray(tipos) ? tipos : [];
            tiposGastoCache.forEach(tipo => {
                if (!tipo?.tipoGasto) return;
                tipoGastoMap[String(tipo.tipoGasto).toLowerCase()] = Number(tipo.id);
            });
            tiposGastoCargados = true;
        } catch (error) {
            console.error(error);
        }
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
        const tramoBase = ida || vuelta || {};

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

        const boolBadge = v => v
            ? '<span class="badge bg-success">SI</span>'
            : '<span class="badge bg-secondary">NO</span>';

        const renderGastosTable = gastos => {
            const list = Array.isArray(gastos) ? gastos : [];
            if (!list.length) return '<div class="text-muted">Sin gastos registrados.</div>';
            const rows = list.map(g => {
                const tipo = resolveTipoLabel(g.idTipoGasto);
                const desc = escapeHtml(g.descripcion || "-");
                const monto = formatMoney(Number(g.monto) || 0);
                const fecha = escapeHtml(g.fechaGasto || "-");
                const href = safeHref(g.evidenciaUrl);
                const evidencia = href
                    ? `<a class="btn btn-outline-secondary btn-sm" href="${escapeHtml(href)}" target="_blank" rel="noopener">Ver</a>`
                    : "-";
                return `
                    <tr>
                        <td>${escapeHtml(tipo)}</td>
                        <td>${desc}</td>
                        <td class="text-end">${monto}</td>
                        <td>${fecha}</td>
                        <td class="text-end">${evidencia}</td>
                    </tr>
                `;
            }).join("");
            return `
                <div class="table-responsive">
                    <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Tipo</th>
                                <th>Descripcion</th>
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
                    <div class="viaje-view-section">
                        <div class="viaje-view-section-head">
                            <div><strong>${escapeHtml(titulo)}</strong></div>
                            <span class="badge bg-secondary">No registrado</span>
                        </div>
                        <div class="viaje-view-section-body">
                            <div class="text-muted">No hay datos para este tramo.</div>
                        </div>
                    </div>
                `;
            }

            const gastos = calcGastos(tramo);
            const salida = formatDateTimeHuman(tramo.fechaSalida);
            const llegada = formatDateTimeHuman(tramo.fechaEntrada);
            const duracion = formatDurationHuman(tramo.fechaSalida, tramo.fechaEntrada);
            const estado = String(tramo.estadoViaje || "-").replaceAll("_", " ");
            const camion = tramo.camionNombre
                ? `${tramo.camionNombre}${tramo.camionPlaca ? ` (${tramo.camionPlaca})` : ""}`
                : (tramo.camionPlaca || "-");

            return `
                <div class="viaje-view-section">
                    <div class="viaje-view-section-head">
                        <div><strong>${escapeHtml(titulo)}</strong></div>
                        <span class="badge bg-primary">${escapeHtml(estado)}</span>
                    </div>
                    <div class="viaje-view-section-body">
                        <div class="viaje-view-kv mb-3">
                            <div class="k">Camion</div><div class="v">${escapeHtml(camion)}</div>
                            <div class="k">Chofer</div><div class="v">${escapeHtml(tramo.conductorNombre || "-")}</div>
                            <div class="k">Salida</div><div class="v">${escapeHtml(salida)}</div>
                            <div class="k">Llegada</div><div class="v">${escapeHtml(llegada)}</div>
                            <div class="k">Duracion</div><div class="v">${escapeHtml(duracion)}</div>
                            <div class="k">Gastos</div><div class="v"><strong>${formatMoney(gastos)}</strong></div>
                            <div class="k">Ruta</div><div class="v">${escapeHtml([tramo.paisSalida, tramo.paisDestino].filter(Boolean).join(" → ") || "-")}</div>
                            <div class="k">Dir. salida</div><div class="v">${escapeHtml(tramo.direccionSalida || "-")}</div>
                            <div class="k">Dir. destino</div><div class="v">${escapeHtml(tramo.direccionDestino || "-")}</div>
                            <div class="k">Obs.</div><div class="v">${escapeHtml(tramo.observaciones || "-")}</div>
                        </div>
                        <div class="mb-2"><strong>Gastos</strong></div>
                        ${renderGastosTable(tramo.gastos)}
                    </div>
                </div>
            `;
        };

        if (viewModalTitle) {
            const idLabel = data.idViaje || data.id_viaje || idViaje;
            viewModalTitle.textContent = `Detalle del viaje ${idLabel ? `#${idLabel}` : ""}`.trim();
        }

        viajeViewBody.innerHTML = `
            <div class="viaje-view-header">
                <div>
                    <h3 class="viaje-view-title">${escapeHtml(data.nombreViaje || data.nombreVieje || "Viaje")}</h3>
                    <div class="viaje-view-sub">
                        <span class="ms-2"><strong>Pagado:</strong> ${boolBadge(Boolean(tramoBase.pagado))}</span>
                        <span class="ms-2"><strong>IVA:</strong> ${boolBadge(Boolean(tramoBase.iva))}</span>
                        <span class="ms-2"><strong>Duracion total:</strong> ${escapeHtml(duracionTotal)}</span>
                        <span class="ms-2"><strong>Lotes:</strong> ${escapeHtml(lotesLabel)}</span>
                    </div>
                </div>
            </div>

            <div class="viaje-view-totals">
                <div class="viaje-view-total">
                    <div>Total gastado</div>
                    <strong>${formatMoney(totalGastos)}</strong>
                </div>
                <div class="viaje-view-total">
                    <div>Total lotes</div>
                    <strong>${escapeHtml(String(loteIds.length))}</strong>
                </div>
            </div>

            <div class="viaje-view-grid">
                ${renderTramo("Tramo (Ida)", ida)}
                ${renderTramo("Tramo (Vuelta)", vuelta)}
            </div>
        `;
    }

    async function cargarEstadosCamionModal() {
        const selectEstado = document.getElementById("filtroEstadoCamionesViajeModal");
        if (!selectEstado) return;
        try {
            const res = await fetch("/api/camiones/estados");
            if (!res.ok) throw new Error("No se pudieron cargar estados");
            const estados = await res.json();
            selectEstado.innerHTML = '<option value="" selected>Todos los estados</option>';
            estados.forEach(estado => {
                const option = document.createElement("option");
                option.value = estado;
                option.textContent = String(estado).replaceAll("_", " ");
                selectEstado.appendChild(option);
            });
        } catch (error) {
            console.error(error);
        }
    }

    async function cargarCamionesViajeModal(page = paginacionCamionesModal.page) {
        const tbody = document.getElementById("tablaCamionesViaje");
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando camiones...</td></tr>';
        const pageSeguro = Math.max(0, Number(page) || 0);
        const sizeSeguro = Math.max(1, Number(paginacionCamionesModal.size) || 10);
        try {
            const query = new URLSearchParams({
                page: String(pageSeguro),
                size: String(sizeSeguro),
                sort: paginacionCamionesModal.sort
            });
            if (filtrosCamionesModal.q) query.set("q", filtrosCamionesModal.q);
            if (filtrosCamionesModal.estado) query.set("estado", filtrosCamionesModal.estado);

            const res = await fetch(`/api/camiones?${query.toString()}`);
            if (!res.ok) throw new Error("No se pudieron cargar camiones");
            const pageData = await res.json();

            paginacionCamionesModal.page = Number(pageData?.number ?? pageSeguro);
            paginacionCamionesModal.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            paginacionCamionesModal.totalElements = Number(pageData?.totalElements ?? 0);
            camionesModalCache = Array.isArray(pageData?.content) ? pageData.content : [];

            renderCamionesViajeModal();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar camiones</td></tr>';
        }
    }

    function renderCamionesViajeModal() {
        const tbody = document.getElementById("tablaCamionesViaje");
        const total = document.getElementById("totalCamionesViajeModal");
        if (!tbody) return;
        if (!camionesModalCache.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay camiones</td></tr>';
            if (total) total.textContent = "Mostrando 0 camiones";
            return;
        }
        const inicio = paginacionCamionesModal.page * paginacionCamionesModal.size;
        tbody.innerHTML = camionesModalCache.map((camion, index) => `
            <tr>
                <td class="row-num">${String(inicio + index + 1).padStart(2, "0")}</td>
                <td><span class="plate">${escapeHtml(camion.placa || "-")}</span></td>
                <td>${escapeHtml(camion.modelo || "-")}</td>
                <td>${escapeHtml(camion.nombre || "-")}</td>
                <td>${escapeHtml(camion.estadoCamion || "-")}</td>
                <td>
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-select-camion="${camion.id}">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join("");
        if (total) {
            const fin = inicio + camionesModalCache.length;
            total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionCamionesModal.totalElements} camiones`;
        }
        actualizarPaginacionCamionesModal();
    }

    function actualizarPaginacionCamionesModal() {
        const btnPrev = document.getElementById("btnPrevCamionesViajeModal");
        const btnNext = document.getElementById("btnNextCamionesViajeModal");
        const pagina = document.getElementById("paginaActualCamionesViajeModal");
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
        if (pagina) pagina.textContent = `${paginaActual} / ${totalPaginas}`;
    }

    async function cargarClientesViajeModal(page = paginacionClientesModal.page) {
        const tbody = document.getElementById("tablaClientesViaje");
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando clientes...</td></tr>';
        const pageSeguro = Math.max(0, Number(page) || 0);
        const sizeSeguro = Math.max(1, Number(paginacionClientesModal.size) || 10);
        try {
            const query = new URLSearchParams({
                page: String(pageSeguro),
                size: String(sizeSeguro)
            });
            if (filtrosClientesModal.q) query.set("q", filtrosClientesModal.q);
            const res = await fetch(`/api/clientes?${query.toString()}`);
            if (!res.ok) throw new Error("No se pudieron cargar clientes");
            const pageData = await res.json();

            paginacionClientesModal.page = Number(pageData?.number ?? pageSeguro);
            paginacionClientesModal.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            paginacionClientesModal.totalElements = Number(pageData?.totalElements ?? 0);
            clientesModalCache = Array.isArray(pageData?.content) ? pageData.content : [];

            renderClientesViajeModal();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar clientes</td></tr>';
        }
    }

    async function cargarEstadosChoferModal() {
        const selectEstado = document.getElementById("filtroEstadoChoferesViajeModal");
        if (!selectEstado) return;
        try {
            const res = await fetch("/api/usuarios/estados");
            if (!res.ok) throw new Error("No se pudieron cargar estados");
            const estados = await res.json();
            selectEstado.innerHTML = '<option value="" selected>Todos los estados</option>';
            estados.forEach(estado => {
                const option = document.createElement("option");
                option.value = estado;
                option.textContent = String(estado).replaceAll("_", " ");
                selectEstado.appendChild(option);
            });
        } catch (error) {
            console.error(error);
        }
    }

    const getRolText = usuario => {
        if (!usuario || usuario.rol == null) return "";
        if (typeof usuario.rol === "string") return usuario.rol;
        if (typeof usuario.rol === "object") {
            return usuario.rol.nombre ?? usuario.rol.name ?? usuario.rol.rol ?? "";
        }
        return String(usuario.rol);
    };

    const esChofer = usuario => {
        const rol = getRolText(usuario).toLowerCase();
        return rol.includes("user") || rol.includes("usuario") || rol.includes("chofer");
    };

    async function cargarChoferesViajeModal(page = paginacionChoferesModal.page) {
        const tbody = document.getElementById("tablaChoferesViaje");
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando choferes...</td></tr>';
        const pageSeguro = Math.max(0, Number(page) || 0);
        const sizeSeguro = Math.max(1, Number(paginacionChoferesModal.size) || 10);
        try {
            const query = new URLSearchParams({
                page: String(pageSeguro),
                size: String(sizeSeguro)
            });
            if (filtrosChoferesModal.q) query.set("q", filtrosChoferesModal.q);
            if (filtrosChoferesModal.estado) query.set("estado", filtrosChoferesModal.estado);

            const res = await fetch(`/api/usuarios?${query.toString()}`);
            if (!res.ok) throw new Error("No se pudieron cargar choferes");
            const pageData = await res.json();

            paginacionChoferesModal.page = Number(pageData?.number ?? pageSeguro);
            paginacionChoferesModal.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            paginacionChoferesModal.totalElements = Number(pageData?.totalElements ?? 0);
            const usuarios = Array.isArray(pageData?.content) ? pageData.content : [];
            const filtrados = usuarios.filter(esChofer);
            choferesModalCache = filtrados.length ? filtrados : usuarios;

            renderChoferesViajeModal();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar choferes</td></tr>';
        }
    }

    function renderChoferesViajeModal() {
        const tbody = document.getElementById("tablaChoferesViaje");
        const total = document.getElementById("totalChoferesViajeModal");
        if (!tbody) return;
        if (!choferesModalCache.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay choferes disponibles</td></tr>';
            if (total) total.textContent = "Mostrando 0 choferes";
            return;
        }
        const inicio = paginacionChoferesModal.page * paginacionChoferesModal.size;
        tbody.innerHTML = choferesModalCache.map((usuario, index) => `
            <tr>
                <td class="row-num">${String(inicio + index + 1).padStart(2, "0")}</td>
                <td>${escapeHtml(`${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || "-")}</td>
                <td>${escapeHtml(usuario.email || "-")}</td>
                <td>${escapeHtml(usuario.estado || "-")}</td>
                <td>
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-select-chofer="${usuario.id}">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join("");
        if (total) {
            const fin = inicio + choferesModalCache.length;
            total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionChoferesModal.totalElements} usuarios`;
        }
        actualizarPaginacionChoferesModal();
    }

    function actualizarPaginacionChoferesModal() {
        const btnPrev = document.getElementById("btnPrevChoferesViajeModal");
        const btnNext = document.getElementById("btnNextChoferesViajeModal");
        const pagina = document.getElementById("paginaActualChoferesViajeModal");
        const paginaActual = paginacionChoferesModal.page + 1;
        const totalPaginas = Math.max(paginacionChoferesModal.totalPages, 1);
        const hayAnterior = paginacionChoferesModal.page > 0;
        const haySiguiente = paginacionChoferesModal.page < totalPaginas - 1;
        if (btnPrev) {
            btnPrev.disabled = !hayAnterior;
            btnPrev.parentElement?.classList.toggle("disabled", !hayAnterior);
        }
        if (btnNext) {
            btnNext.disabled = !haySiguiente;
            btnNext.parentElement?.classList.toggle("disabled", !haySiguiente);
        }
        if (pagina) pagina.textContent = `${paginaActual} / ${totalPaginas}`;
    }

    function renderClientesViajeModal() {
        const tbody = document.getElementById("tablaClientesViaje");
        const total = document.getElementById("totalClientesViajeModal");
        if (!tbody) return;
        if (!clientesModalCache.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay clientes</td></tr>';
            if (total) total.textContent = "Mostrando 0 clientes";
            return;
        }
        const inicio = paginacionClientesModal.page * paginacionClientesModal.size;
        tbody.innerHTML = clientesModalCache.map((cliente, index) => `
            <tr>
                <td class="row-num">${String(inicio + index + 1).padStart(2, "0")}</td>
                <td>${escapeHtml(cliente.nombre || "-")}</td>
                <td>${escapeHtml(cliente.telefono || "-")}</td>
                <td>${escapeHtml(cliente.duiNit || "-")}</td>
                <td>
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-select-cliente="${cliente.id}">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join("");
        if (total) {
            const fin = inicio + clientesModalCache.length;
            total.textContent = `Mostrando ${inicio + 1}-${fin} de ${paginacionClientesModal.totalElements} clientes`;
        }
        actualizarPaginacionClientesModal();
    }

    function actualizarPaginacionClientesModal() {
        const btnPrev = document.getElementById("btnPrevClientesViajeModal");
        const btnNext = document.getElementById("btnNextClientesViajeModal");
        const pagina = document.getElementById("paginaActualClientesViajeModal");
        const paginaActual = paginacionClientesModal.page + 1;
        const totalPaginas = Math.max(paginacionClientesModal.totalPages, 1);
        const hayAnterior = paginacionClientesModal.page > 0;
        const haySiguiente = paginacionClientesModal.page < totalPaginas - 1;
        if (btnPrev) {
            btnPrev.disabled = !hayAnterior;
            btnPrev.parentElement?.classList.toggle("disabled", !hayAnterior);
        }
        if (btnNext) {
            btnNext.disabled = !haySiguiente;
            btnNext.parentElement?.classList.toggle("disabled", !haySiguiente);
        }
        if (pagina) pagina.textContent = `${paginaActual} / ${totalPaginas}`;
    }

    document.getElementById("tablaCamionesViaje")?.addEventListener("click", event => {
        const boton = event.target.closest("[data-select-camion]");
        if (!boton) return;
        const camionId = Number(boton.dataset.selectCamion);
        const camion = camionesModalCache.find(c => Number(c.id) === camionId);
        if (!camion) return;
        const inputId = seleccion.camionTramo === "vuelta" ? "vueltaCamionInput" : "idaCamionInput";
        const hiddenId = seleccion.camionTramo === "vuelta" ? "vueltaCamionId" : "idaCamionId";
        const nombre = camion.nombre ? camion.nombre.trim() : "";
        const placa = camion.placa ? camion.placa.trim() : "";
        document.getElementById(inputId).value = nombre ? `${nombre} (${placa || "-"})` : (placa || camion.modelo || "");
        document.getElementById(hiddenId).value = camion.id;
        bootstrap.Modal.getInstance(modalBuscarCamion)?.hide();
        document.getElementById(inputId)?.focus();
    });

    document.getElementById("tablaClientesViaje")?.addEventListener("click", event => {
        const boton = event.target.closest("[data-select-cliente]");
        if (!boton) return;
        const clienteId = Number(boton.dataset.selectCliente);
        const cliente = clientesModalCache.find(c => Number(c.id) === clienteId);
        if (!cliente) return;
        document.getElementById("clienteInput").value = cliente.nombre || "";
        document.getElementById("clienteId").value = cliente.id;
        bootstrap.Modal.getInstance(modalBuscarCliente)?.hide();
        document.getElementById("clienteInput")?.focus();
    });

    document.getElementById("tablaChoferesViaje")?.addEventListener("click", event => {
        const boton = event.target.closest("[data-select-chofer]");
        if (!boton) return;
        const usuarioId = Number(boton.dataset.selectChofer);
        const usuario = choferesModalCache.find(u => Number(u.id) === usuarioId);
        if (!usuario) return;
        const inputId = seleccion.choferTramo === "vuelta" ? "vueltaChoferInput" : "idaChoferInput";
        const hiddenId = seleccion.choferTramo === "vuelta" ? "vueltaChoferId" : "idaChoferId";
        const nombre = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
        document.getElementById(inputId).value = nombre || usuario.email || "";
        document.getElementById(hiddenId).value = usuario.id;
        bootstrap.Modal.getInstance(modalBuscarChofer)?.hide();
        document.getElementById(inputId)?.focus();
    });

    modalBuscarCamion?.addEventListener("shown.bs.modal", () => {
        cargarEstadosCamionModal();
        cargarCamionesViajeModal();
    });
    modalBuscarCliente?.addEventListener("shown.bs.modal", () => {
        cargarClientesViajeModal();
    });
    modalBuscarChofer?.addEventListener("shown.bs.modal", () => {
        cargarEstadosChoferModal();
        cargarChoferesViajeModal();
    });

    document.getElementById("btnPrevCamionesViajeModal")?.addEventListener("click", () => {
        cargarCamionesViajeModal(paginacionCamionesModal.page - 1);
    });
    document.getElementById("btnNextCamionesViajeModal")?.addEventListener("click", () => {
        cargarCamionesViajeModal(paginacionCamionesModal.page + 1);
    });
    document.getElementById("btnPrevClientesViajeModal")?.addEventListener("click", () => {
        cargarClientesViajeModal(paginacionClientesModal.page - 1);
    });
    document.getElementById("btnNextClientesViajeModal")?.addEventListener("click", () => {
        cargarClientesViajeModal(paginacionClientesModal.page + 1);
    });
    document.getElementById("btnPrevChoferesViajeModal")?.addEventListener("click", () => {
        cargarChoferesViajeModal(paginacionChoferesModal.page - 1);
    });
    document.getElementById("btnNextChoferesViajeModal")?.addEventListener("click", () => {
        cargarChoferesViajeModal(paginacionChoferesModal.page + 1);
    });

    document.getElementById("filtroBusquedaCamionesViajeModal")?.addEventListener("input", event => {
        clearTimeout(debounceCamionesModal);
        debounceCamionesModal = setTimeout(() => {
            filtrosCamionesModal.q = event.target.value.trim();
            cargarCamionesViajeModal(0);
        }, 300);
    });

    document.getElementById("filtroEstadoCamionesViajeModal")?.addEventListener("change", event => {
        filtrosCamionesModal.estado = event.target.value;
        cargarCamionesViajeModal(0);
    });

    document.getElementById("btnLimpiarFiltrosCamionesViajeModal")?.addEventListener("click", () => {
        filtrosCamionesModal.q = "";
        filtrosCamionesModal.estado = "";
        document.getElementById("filtroBusquedaCamionesViajeModal").value = "";
        document.getElementById("filtroEstadoCamionesViajeModal").value = "";
        cargarCamionesViajeModal(0);
    });

    document.getElementById("filtroBusquedaClientesViajeModal")?.addEventListener("input", event => {
        clearTimeout(debounceClientesModal);
        debounceClientesModal = setTimeout(() => {
            filtrosClientesModal.q = event.target.value.trim();
            cargarClientesViajeModal(0);
        }, 300);
    });

    document.getElementById("btnLimpiarFiltrosClientesViajeModal")?.addEventListener("click", () => {
        filtrosClientesModal.q = "";
        document.getElementById("filtroBusquedaClientesViajeModal").value = "";
        cargarClientesViajeModal(0);
    });

    document.getElementById("filtroBusquedaChoferesViajeModal")?.addEventListener("input", event => {
        clearTimeout(debounceChoferesModal);
        debounceChoferesModal = setTimeout(() => {
            filtrosChoferesModal.q = event.target.value.trim();
            cargarChoferesViajeModal(0);
        }, 300);
    });

    document.getElementById("filtroEstadoChoferesViajeModal")?.addEventListener("change", event => {
        filtrosChoferesModal.estado = event.target.value;
        cargarChoferesViajeModal(0);
    });

    document.getElementById("btnLimpiarFiltrosChoferesViajeModal")?.addEventListener("click", () => {
        filtrosChoferesModal.q = "";
        filtrosChoferesModal.estado = "";
        document.getElementById("filtroBusquedaChoferesViajeModal").value = "";
        document.getElementById("filtroEstadoChoferesViajeModal").value = "";
        cargarChoferesViajeModal(0);
    });

    usarMismosDatos?.addEventListener("change", () => {
        const disabled = usarMismosDatos.checked;
        const camposVuelta = document.querySelectorAll(
            "#tab-vuelta input, #tab-vuelta select, #tab-vuelta button"
        );
        camposVuelta.forEach(el => {
            if (el.dataset.gastoBtn === "vuelta" || el.dataset.gastoGuardar === "vuelta" || el.dataset.gastoCancelar === "vuelta") {
                el.disabled = disabled;
            } else if (!el.classList.contains("tab-button")) {
                el.disabled = disabled;
            }
        });

        if (disabled) {
            document.getElementById("vueltaCamionInput").value = document.getElementById("idaCamionInput").value;
            document.getElementById("vueltaCamionId").value = document.getElementById("idaCamionId").value;
            document.getElementById("vueltaChoferInput").value = document.getElementById("idaChoferInput").value;
            document.getElementById("vueltaChoferId").value = document.getElementById("idaChoferId").value;
            document.getElementById("vueltaSalida").value = document.getElementById("idaSalida").value;
            document.getElementById("vueltaLlegada").value = document.getElementById("idaLlegada").value;

            // Ubicacion (V2)
            document.getElementById("vueltaPaisSalida").value = document.getElementById("idaPaisSalida").value;
            document.getElementById("vueltaPaisDestino").value = document.getElementById("idaPaisDestino").value;
            document.getElementById("vueltaDireccionSalida").value = document.getElementById("idaDireccionSalida").value;
            document.getElementById("vueltaDireccionDestino").value = document.getElementById("idaDireccionDestino").value;
            document.getElementById("vueltaObservaciones").value = document.getElementById("idaObservaciones").value;

            state.vuelta.gastos = state.ida.gastos.map(g => ({...g}));
            renderGastos("vuelta");
            actualizarDuraciones();
        }
    });

    const validarFormulario = () => {
        let valido = true;
        const requeridos = [
            "nombreViaje",
            "idaCamionInput",
            "idaChoferInput",
            "idaSalida",
            "idaLlegada"
        ];
        requeridos.forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;
            if (!input.value) {
                input.classList.add("is-invalid");
                valido = false;
            } else {
                input.classList.remove("is-invalid");
            }
        });
        const idaCamion = document.getElementById("idaCamionId")?.value;
        const idaChofer = document.getElementById("idaChoferId")?.value;
        if (!idaCamion) {
            document.getElementById("idaCamionInput")?.classList.add("is-invalid");
            valido = false;
        }
        if (!idaChofer) {
            document.getElementById("idaChoferInput")?.classList.add("is-invalid");
            valido = false;
        }
        const idaEstado = document.getElementById("idaEstado");
        if (idaEstado && !idaEstado.value) {
            idaEstado.classList.add("is-invalid");
            valido = false;
        } else if (idaEstado) {
            idaEstado.classList.remove("is-invalid");
        }

        const vueltaInputs = [
            "vueltaCamionId",
            "vueltaChoferId",
            "vueltaSalida",
            "vueltaLlegada"
        ];
        const vueltaTieneDatos = vueltaInputs.some(id => {
            const el = document.getElementById(id);
            return Boolean(el?.value);
        }) || state.vuelta.gastos.length > 0;

        const vueltaEstado = document.getElementById("vueltaEstado");
        if (vueltaTieneDatos) {
            if (vueltaEstado && !vueltaEstado.value) {
                vueltaEstado.classList.add("is-invalid");
                valido = false;
            } else if (vueltaEstado) {
                vueltaEstado.classList.remove("is-invalid");
            }
        } else if (vueltaEstado) {
            vueltaEstado.classList.remove("is-invalid");
        }
        return valido;
    };

    const buildPayload = () => {
        const estadoIda = document.getElementById("idaEstado")?.value || null;
        const estadoVuelta = document.getElementById("vueltaEstado")?.value || null;
        const pagado = document.getElementById("pagadoGeneral")?.checked ?? false;
        const iva = document.getElementById("ivaGeneral")?.checked ?? false;


        const getId = (hiddenId, inputId) => {
            const hidden = document.getElementById(hiddenId)?.value;
            if (hidden) return Number(hidden);
            const raw = document.getElementById(inputId)?.value;
            return Number.isNaN(Number(raw)) ? null : Number(raw);
        };

        const buildTramo = tramo => {
            const idCamion = getId(`${tramo}CamionId`, `${tramo}CamionInput`);
            const idConductor = getId(`${tramo}ChoferId`, `${tramo}ChoferInput`);
            const fechaSalida = normalizeDateTime(document.getElementById(`${tramo}Salida`)?.value);
            const fechaEntrada = normalizeDateTime(document.getElementById(`${tramo}Llegada`)?.value);

            // Ubicacion (V2)
            const paisSalida = document.getElementById(`${tramo}PaisSalida`)?.value || null;
            const paisDestino = document.getElementById(`${tramo}PaisDestino`)?.value || null;
            const direccionSalida = document.getElementById(`${tramo}DireccionSalida`)?.value || "";
            const direccionDestino = document.getElementById(`${tramo}DireccionDestino`)?.value || "";
            const observaciones = document.getElementById(`${tramo}Observaciones`)?.value || "";

            const gastos = state[tramo].gastos.map(g => ({
                id: Number(g.id) || 0,
                idTipoGasto: g.tipoId,
                monto: g.monto,
                descripcion: g.descripcion || "",
                evidenciaUrl: g.evidencia || "",
                fechaGasto: g.fecha || null
            }));

            const hasData = Boolean(
                idCamion || idConductor || fechaSalida || fechaEntrada || gastos.length ||
                paisSalida || paisDestino || direccionSalida || direccionDestino || observaciones
            );
            if (!hasData) return null;

            return {
                id: Number(state[tramo].detalleId) || 0,
                tipoTramo: tramo,
                idCamion,
                idConductor,
                estadoViaje: tramo === "ida" ? estadoIda : estadoVuelta,
                pagado,
                iva,
                fechaSalida,
                fechaEntrada,
                paisSalida,
                paisDestino,
                direccionSalida,
                direccionDestino,
                observaciones,
                gastos
            };
        };

        const tramos = [];
        const tramoIda = buildTramo("ida");
        if (!tramoIda) {
            return {
                nombreViaje: document.getElementById("nombreViaje")?.value || "",
                loteIds: lotesSeleccionados.map(getLoteId).filter(Boolean),
                tramos: []
            };
        }
        if (tramoIda) tramos.push(tramoIda);
        const tramoVuelta = buildTramo("vuelta");
        if (tramoVuelta) tramos.push(tramoVuelta);

        return {
            nombreViaje: document.getElementById("nombreViaje")?.value || "",
            loteIds: lotesSeleccionados.map(getLoteId).filter(Boolean),
            tramos
        };
    };

    viajeForm?.addEventListener("submit", async event => {
        event.preventDefault();
        if (estadoGuardado) estadoGuardado.textContent = "";
        if (!validarFormulario()) {
            if (estadoGuardado) {
                estadoGuardado.textContent = "Faltan campos requeridos.";
                estadoGuardado.className = "estado-guardado error";
            }
            return;
        }

        if (estadoGuardado) {
            estadoGuardado.textContent = "Guardando...";
            estadoGuardado.className = "estado-guardado";
        }
        if (btnGuardarViaje) btnGuardarViaje.disabled = true;

        const payload = buildPayload();
        const viajeId = viajeForm?.dataset.viajeId;
        const url = viajeId ? `/api/viajes/${viajeId}` : "/api/viajes";
        const method = viajeId ? "PUT" : "POST";

        try {
            const headers = {"Content-Type": "application/json"};
            if (csrfToken && csrfHeader) {
                headers[csrfHeader] = csrfToken;
            }
            const res = await fetch(url, {
                method,
                headers,
                credentials: "same-origin",
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const contentType = res.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    const err = await res.json().catch(() => null);
                    const msg = err?.message || err?.error || JSON.stringify(err) || "Error al guardar";
                    throw new Error(msg);
                } else {
                    const errorText = await res.text().catch(() => "");
                    throw new Error(errorText || "Error al guardar");
                }
            }
            if (estadoGuardado) {
                estadoGuardado.textContent = "Guardado correctamente";
                estadoGuardado.className = "estado-guardado ok";
            }
            cerrarModal();
            alert("Guardado correctamente");
            cargarViajes(paginacionViajes.page);
        } catch (error) {
            console.error(error);
            if (estadoGuardado) {
                estadoGuardado.textContent = "Error al guardar";
                estadoGuardado.className = "estado-guardado error";
            }
            alert(`Error al guardar: ${error.message || "verifica los datos"}`);
        } finally {
            if (btnGuardarViaje) btnGuardarViaje.disabled = false;
        }
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
                abrirModal(viajeId);
            }
            return;
        }
        const card = event.target.closest(".trip-card-action");
        if (!card) return;
        abrirModal(card.dataset.viajeId);
    });

    // Permite abrir el detalle con teclado cuando la tarjeta es foco (Enter/Espacio).
    listaViajes?.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target.closest?.("[data-viaje-action]")) return;
        const card = event.target.closest?.(".trip-card-action");
        if (!card) return;
        event.preventDefault();
        abrirModal(card.dataset.viajeId);
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

    cargarEstadosViaje();
    cargarTiposGasto();
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
    cargarViajes();
});
