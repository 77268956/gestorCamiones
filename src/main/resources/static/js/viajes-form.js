document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);
    const qs = (sel, root = document) => root.querySelector(sel);
    const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const viajeForm = $("viajeForm");
    const usarMismosDatos = $("usarMismosDatos");
    const estadoGuardado = $("estadoGuardado");
    const btnGuardarViaje = $("btnGuardarViaje");
    const btnEliminarViaje = $("btnEliminarViaje");
    const formTitle = $("formTitle");

    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content || "";
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content || "";
    const notify = (type, message, title) => window.mpAlert?.[type]?.(message, title) || window.alert(message);

    const viajeId = new URLSearchParams(window.location.search).get("id");

    const state = {
        ida: {detalleId: 0, gastos: [], ingresosExtra: [], editIndex: null, editIngresoIndex: null},
        vuelta: {detalleId: 0, gastos: [], ingresosExtra: [], editIndex: null, editIngresoIndex: null}
    };

    const data = {
        lotesDisponibles: [],
        lotesSeleccionados: [],
        lotesOriginalIds: new Set(),
        editLoteCurrentData: null,
        tiposGasto: [],
        tiposGastoMap: {},
        categoriasIngresoExtra: [],
        categoriasIngresoExtraMap: {},
        estadosViajeCargados: false,
        paisesCargados: false,
        lotesEstadosCargados: false,
        categoriasCargadas: false,
        lotesCargados: false
    };

    const lookup = {
        camionTramo: "ida",
        choferTramo: "ida"
    };

    const filtros = {
        camiones: {q: "", estado: ""},
        choferes: {q: "", estado: ""},
        lotes: {q: "", estado: ""}
    };

    const paginacion = {
        camiones: {page: 0, size: 10, totalPages: 1, totalElements: 0, items: [], sort: "idCamion,desc"},
        choferes: {page: 0, size: 10, totalPages: 1, totalElements: 0, items: [], sort: "id,desc"},
        lotes: {items: []}
    };

    let debounceCamiones = null;
    let debounceChoferes = null;
    let debounceLotes = null;
    let modalCamion = null;
    let modalChofer = null;
    let modalLote = null;
    let focusReturnTarget = null;

    const esc = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const num = value => {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const formatMoney = value => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(num(value));

    const formatDateTimeInput = value => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
        const pad = n => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const normalizeTipoTramo = value => String(value || "").toLowerCase();

    const getLoteId = lote => Number(lote?.idLote ?? lote?.id_lote ?? lote?.id ?? 0);

    const getTramoField = (tramo, suffix) => $(`${tramo}${suffix}`);

    const setValue = (id, value) => {
        const el = $(id);
        if (el) el.value = value ?? "";
    };

    const setText = (id, value) => {
        const el = $(id);
        if (el) el.textContent = value ?? "";
    };

    const requestJson = async (url, options = {}) => {
        const res = await fetch(url, {...options, credentials: options.credentials || "same-origin"});
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    };

    const withCsrf = headers => {
        if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;
        return headers;
    };

    const clearInvalid = root => {
        qsa(".is-invalid", root || document).forEach(el => el.classList.remove("is-invalid"));
    };

    const getTramoFromResponse = (tramos, tipo) => {
        const list = Array.isArray(tramos) ? tramos : [];
        const wanted = normalizeTipoTramo(tipo);
        return list.find(tramo => normalizeTipoTramo(tramo?.tipoTramo) === wanted) || null;
    };

    const setSelectOptions = (select, placeholder, options) => {
        if (!select) return;
        const current = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        (Array.isArray(options) ? options : []).forEach(optionValue => {
            const option = document.createElement("option");
            option.value = String(optionValue);
            option.textContent = String(optionValue).replaceAll("_", " ");
            select.appendChild(option);
        });
        if (current) select.value = current;
    };

    const getGastoTipoLabel = tipoId => {
        const match = data.tiposGasto.find(t => Number(t.id) === Number(tipoId));
        return match?.tipoGasto || `Tipo #${tipoId}`;
    };

    const getFieldValue = (tramo, field) => $(`${tramo}${field}`)?.value?.trim() || "";

    const getFieldId = (tramo, field) => {
        const hidden = $(`${tramo}${field}Id`)?.value;
        if (hidden) return Number(hidden);
        const raw = $(`${tramo}${field}Input`)?.value;
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const loadTiposGasto = async () => {
        if (data.tiposGasto.length) return;
        try {
            const tipos = await requestJson("/api/tipogasto");
            data.tiposGasto = Array.isArray(tipos) ? tipos : [];
            data.tiposGastoMap = {};
            data.tiposGasto.forEach(tipo => {
                if (tipo?.tipoGasto != null) {
                    data.tiposGastoMap[String(tipo.tipoGasto).toLowerCase()] = Number(tipo.id);
                }
            });
            qsa("[data-gasto-tipo]").forEach(select => {
                const current = select.value;
                select.innerHTML = '<option value="">Seleccione</option>';
                data.tiposGasto.forEach(tipo => {
                    const option = document.createElement("option");
                    option.value = String(tipo.id);
                    option.textContent = tipo.tipoGasto;
                    select.appendChild(option);
                });
                if (current) select.value = current;
            });
        } catch (error) {
            console.error(error);
        }
    };

    const getIngresoCategoriaLabel = catId => {
        const match = data.categoriasIngresoExtra.find(c => Number(c.idCategoriaIngresoExtra) === Number(catId));
        return match?.nombre || `Categoría #${catId}`;
    };

    const loadCategoriasIngresoExtra = async () => {
        if (data.categoriasIngresoExtra.length) return;
        try {
            const categorias = await requestJson("/api/viajes/categorias-ingreso-extra");
            data.categoriasIngresoExtra = Array.isArray(categorias) ? categorias : [];
            data.categoriasIngresoExtraMap = {};
            data.categoriasIngresoExtra.forEach(cat => {
                if (cat?.nombre != null) {
                    data.categoriasIngresoExtraMap[String(cat.nombre).toLowerCase()] = Number(cat.idCategoriaIngresoExtra);
                }
            });
            qsa("[data-ingreso-tipo]").forEach(select => {
                const current = select.value;
                select.innerHTML = '<option value="">Seleccione</option>';
                data.categoriasIngresoExtra.forEach(cat => {
                    const option = document.createElement("option");
                    option.value = String(cat.idCategoriaIngresoExtra);
                    option.textContent = cat.nombre;
                    select.appendChild(option);
                });
                if (current) select.value = current;
            });
        } catch (error) {
            console.error(error);
        }
    };

    const loadEstadosViaje = async () => {
        if (data.estadosViajeCargados) return;
        try {
            const estados = await requestJson("/api/viajes/estados");
            setSelectOptions($("idaEstado"), "Seleccione un estado", estados);
            setSelectOptions($("vueltaEstado"), "Seleccione un estado", estados);
            data.estadosViajeCargados = true;
        } catch (error) {
            console.error(error);
        }
    };

    const loadPaises = async () => {
        if (data.paisesCargados) return;
        try {
            const paises = await requestJson("/api/viajes/paises");
            ["idaPaisSalida", "idaPaisDestino", "vueltaPaisSalida", "vueltaPaisDestino"].forEach(id => {
                setSelectOptions($(id), "Seleccione", paises);
            });
            data.paisesCargados = true;
        } catch (error) {
            console.error(error);
        }
    };





    const loadEstadosLote = async () => {
        if (data.lotesEstadosCargados) {
            // Ya cargados, solo llenar el select de edición si existe
            const selectEdit = $("editLoteEstado");
            if (selectEdit && !selectEdit.options.length) {
                fillEstadosSelect(selectEdit);
            }
            return;
        }
        try {
            const estados = await requestJson("/api/lotes/estados");
            data.estadosLotesCache = estados; // guardar para reusar

            setSelectOptions($("filtroEstadoLotesViajeModal"), "Todos los estados", estados);

            const selectEdit = $("editLoteEstado");
            if (selectEdit) fillEstadosSelect(selectEdit, estados);

            const selectInline = document.querySelector("#nuevoLoteInlineForm [data-lote-estado]");
            if (selectInline) fillEstadosSelect(selectInline, estados);

            data.lotesEstadosCargados = true;
        } catch (error) {
            console.error(error);
        }
    };

    const fillEstadosSelect = (select, estados) => {
        const estadosData = estados || data.estadosLotesCache || [];
        select.innerHTML = '<option value="">Seleccione estado</option>';
        estadosData.forEach(estado => {
            const option = document.createElement("option");
            option.value = estado;
            option.textContent = String(estado).replaceAll("_", " ");
            select.appendChild(option);
        });
    };











    const loadCategorias = async () => {
        if (data.categoriasCargadas) return;
        const select = document.querySelector("#nuevoLoteInlineForm [data-lote-categoria]");
        if (!select) return;
        try {
            const categorias = await requestJson("/api/categorias");
            const current = select.value;
            select.innerHTML = '<option value="">Seleccione categoria</option>';
            (Array.isArray(categorias) ? categorias : []).forEach(cat => {
                const option = document.createElement("option");
                option.value = String(cat.idCategoria);
                option.textContent = cat.nombre || `Cat #${cat.id}`;
                select.appendChild(option);
            });
            if (current) select.value = current;
            data.categoriasCargadas = true;
        } catch (error) {
            console.error(error);
        }
    };





    const renderGastos = tramo => {
        const tbody = $(`${tramo}GastosBody`);
        if (!tbody) return;
        tbody.innerHTML = "";
        state[tramo].gastos.forEach((gasto, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${esc(gasto.tipoLabel)}</td>
                <td>${esc(gasto.descripcion || "-")}</td>
                <td class="text-end fw-semibold text-danger">${formatMoney(gasto.monto)}</td>
                <td>${esc(gasto.fecha || "-")}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-edit-gasto="${tramo}" data-index="${index}">Editar</button>
                        <button type="button" class="btn btn-danger btn-sm text-white" data-delete-gasto="${tramo}" data-index="${index}">Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        updateResumen();
    };

    const renderIngresosExtra = tramo => {
        const tbody = $(`${tramo}IngresosBody`);
        if (!tbody) return;
        tbody.innerHTML = "";
        state[tramo].ingresosExtra.forEach((ingreso, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${esc(ingreso.categoriaLabel)}</td>
                <td>${esc(ingreso.descripcion || "-")}</td>
                <td class="text-end fw-semibold text-success">${formatMoney(ingreso.monto)}</td>
                <td>${esc(ingreso.fecha || "-")}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-edit-ingreso="${tramo}" data-index="${index}">Editar</button>
                        <button type="button" class="btn btn-danger btn-sm text-white" data-delete-ingreso="${tramo}" data-index="${index}">Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        updateResumen();
    };

    const resetIngresoForm = tramo => {
        const form = $(`${tramo}IngresoForm`);
        if (!form) return;
        const tipo = form.querySelector("[data-ingreso-tipo]");
        const desc = form.querySelector("[data-ingreso-desc]");
        const monto = form.querySelector("[data-ingreso-monto]");
        const fecha = form.querySelector("[data-ingreso-fecha]");
        if (tipo) tipo.value = "";
        if (desc) desc.value = "";
        if (monto) monto.value = "";
        if (fecha) fecha.value = "";
        state[tramo].editIngresoIndex = null;
        form.classList.remove("is-open");
    };

    const saveIngreso = tramo => {
        const form = $(`${tramo}IngresoForm`);
        if (!form) return;
        const tipoSelect = form.querySelector("[data-ingreso-tipo]");
        const rawTipo = tipoSelect?.value || "";
        const catId = Number(rawTipo) || data.categoriasIngresoExtraMap[String(rawTipo).toLowerCase()] || 0;
        const descripcion = form.querySelector("[data-ingreso-desc]")?.value || "";
        const monto = num(form.querySelector("[data-ingreso-monto]")?.value);
        const fecha = form.querySelector("[data-ingreso-fecha]")?.value || "";
        if (!catId || monto <= 0) return;

        const ingreso = {
            id: state[tramo].editIngresoIndex !== null ? Number(state[tramo].ingresosExtra[state[tramo].editIngresoIndex]?.id || 0) : 0,
            categoriaId: catId,
            categoriaLabel: tipoSelect?.selectedOptions?.[0]?.textContent?.trim() || getIngresoCategoriaLabel(catId),
            categoriaRaw: rawTipo,
            descripcion,
            monto,
            fecha
        };
        if (state[tramo].editIngresoIndex !== null) state[tramo].ingresosExtra[state[tramo].editIngresoIndex] = ingreso;
        else state[tramo].ingresosExtra.push(ingreso);
        renderIngresosExtra(tramo);
        resetIngresoForm(tramo);
    };

    const resetGastoForm = tramo => {
        const form = $(`${tramo}GastoForm`);
        if (!form) return;
        const tipo = form.querySelector("[data-gasto-tipo]");
        const desc = form.querySelector("[data-gasto-desc]");
        const monto = form.querySelector("[data-gasto-monto]");
        const fecha = form.querySelector("[data-gasto-fecha]");
        const evidencia = form.querySelector("[data-gasto-evidencia]");
        if (tipo) tipo.value = "";
        if (desc) desc.value = "";
        if (monto) monto.value = "";
        if (fecha) fecha.value = "";
        if (evidencia) evidencia.value = "";
        state[tramo].editIndex = null;
        form.classList.remove("is-open");
    };

    const updateDuraciones = () => {
        ["ida", "vuelta"].forEach(tramo => {
            const salida = $( `${tramo}Salida` )?.value;
            const llegada = $( `${tramo}Llegada` )?.value;
            const target = $(`${tramo}Duracion`);
            if (!target) return;
            if (!salida || !llegada) {
                target.textContent = "-";
                return;
            }
            const d1 = new Date(salida);
            const d2 = new Date(llegada);
            if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 <= d1) {
                target.textContent = "-";
                return;
            }
            let diff = d2.getTime() - d1.getTime();
            const days = Math.floor(diff / 86400000);
            diff -= days * 86400000;
            const hours = Math.floor(diff / 3600000);
            diff -= hours * 3600000;
            const minutes = Math.floor(diff / 60000);
            const parts = [];
            if (days) parts.push(`${days}d`);
            if (hours) parts.push(`${hours}h`);
            if (minutes || !parts.length) parts.push(`${minutes}m`);
            target.textContent = parts.join(" ");
        });
    };

    const updateResumen = () => {
        let valorLotesIda = 0;
        let valorLotesVuelta = 0;
        data.lotesSeleccionados.forEach(lote => {
            const tramo = normalizeTipoTramo(lote.tipoTramo) || "ida";
            const val = num(lote.valorDeclarado ?? lote.valor_declarado);
            if (tramo === "ida") {
                valorLotesIda += val;
            } else if (tramo === "vuelta") {
                valorLotesVuelta += val;
            }
        });
        const totalValorLotes = valorLotesIda + valorLotesVuelta;

        const gastosIda = state.ida.gastos.reduce((acc, gasto) => acc + num(gasto.monto), 0);
        const gastosVuelta = state.vuelta.gastos.reduce((acc, gasto) => acc + num(gasto.monto), 0);
        const totalGastos = gastosIda + gastosVuelta;

        const ingresosExtraIda = state.ida.ingresosExtra.reduce((acc, ing) => acc + num(ing.monto), 0);
        const ingresosExtraVuelta = state.vuelta.ingresosExtra.reduce((acc, ing) => acc + num(ing.monto), 0);
        const totalIngresosExtra = ingresosExtraIda + ingresosExtraVuelta;

        const ivaIdaActivo = $("idaIva")?.checked ?? false;
        const ivaVueltaActivo = $("vueltaIva")?.checked ?? false;

        // Cálculos Tramo Ida
        const ivaIda = ivaIdaActivo ? (valorLotesIda + ingresosExtraIda) * 0.13 : 0;
        const gananciaIda = (valorLotesIda + ingresosExtraIda + ivaIda) - gastosIda;

        // Cálculos Tramo Vuelta
        const ivaVuelta = ivaVueltaActivo ? (valorLotesVuelta + ingresosExtraVuelta) * 0.13 : 0;
        const gananciaVuelta = (valorLotesVuelta + ingresosExtraVuelta + ivaVuelta) - gastosVuelta;

        // Cálculos Generales
        const totalIva = ivaIda + ivaVuelta;
        const totalGanancia = gananciaIda + gananciaVuelta;

        // Actualizar badges en las cabeceras de gastos/ingresos
        setText("idaTotalGastos", formatMoney(gastosIda));
        setText("vueltaTotalGastos", formatMoney(gastosVuelta));
        setText("idaTotalIngresosExtra", formatMoney(ingresosExtraIda));
        setText("vueltaTotalIngresosExtra", formatMoney(ingresosExtraVuelta));

        // Actualizar Resumen Financiero General
        setText("resumenValorLotes", formatMoney(totalValorLotes));
        setText("resumenIngresosExtra", formatMoney(totalIngresosExtra));
        setText("totalGastado", formatMoney(totalGastos));
        setText("resumenIVA", formatMoney(totalIva));
        setText("resumenGanancia", formatMoney(totalGanancia));
        setText("resumenLotes", String(data.lotesSeleccionados.length));

        // Actualizar Resumen Financiero por Tramo (Ida)
        setText("tramoIdaValorLotes", formatMoney(valorLotesIda));
        setText("tramoIdaIngresosExtra", formatMoney(ingresosExtraIda));
        setText("tramoIdaGastos", formatMoney(gastosIda));
        setText("tramoIdaIVA", formatMoney(ivaIda));
        setText("tramoIdaGanancia", formatMoney(gananciaIda));

        // Actualizar Resumen Financiero por Tramo (Vuelta)
        setText("tramoVueltaValorLotes", formatMoney(valorLotesVuelta));
        setText("tramoVueltaIngresosExtra", formatMoney(ingresosExtraVuelta));
        setText("tramoVueltaGastos", formatMoney(gastosVuelta));
        setText("tramoVueltaIVA", formatMoney(ivaVuelta));
        setText("tramoVueltaGanancia", formatMoney(gananciaVuelta));

        // Actualizar color dinámico de balance (ganancia/pérdida)
        const updateGananciaColor = (id, val) => {
            const el = $(id);
            if (!el) return;
            if (val >= 0) {
                el.style.setProperty("color", "#16a34a", "important"); // Verde
            } else {
                el.style.setProperty("color", "#dc2626", "important"); // Rojo
            }
        };
        updateGananciaColor("resumenGanancia", totalGanancia);
        updateGananciaColor("tramoIdaGanancia", gananciaIda);
        updateGananciaColor("tramoVueltaGanancia", gananciaVuelta);
    };

    const renderLotesAsociados = () => {
        const cont = $("lotesAsociados");
        if (!cont) return;
        cont.innerHTML = "";

        if (!data.lotesSeleccionados.length) {
            cont.innerHTML = '<div class="text-muted text-center py-3">No hay contenedores asociados.</div>';
            updateResumen();
            return;
        }

        data.lotesSeleccionados.forEach((lote, index) => {
            const id = getLoteId(lote);
            const tramo = normalizeTipoTramo(lote.tipoTramo) || "ida";
            const card = document.createElement("div");
            card.className = "card border-start border-3 p-3";
            card.style.borderLeftColor = tramo === "vuelta" ? "#7c3aed" : "#2563eb";
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-bold text-dark">${esc(lote.numeroLote || `Lote #${id}`)}</div>
                        <div class="small text-muted mb-2">Encargado: ${esc(lote.nombreEncargado || "-")} | Valor: ${formatMoney(lote.valorDeclarado ?? lote.valor_declarado)}</div>
                    </div>
                    <div class="d-flex gap-1">
                        <button type="button" class="btn btn-outline-secondary btn-sm px-2 py-1" data-edit-lote="${id}" title="Editar info lote"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn btn-outline-danger btn-sm px-2 py-1" data-remove-lote="${index}" title="Desasociar lote"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="row g-2 align-items-center mt-1">
                    <div class="col-12">
                        <div class="input-group input-group-sm">
                            <label class="input-group-text" style="font-size:0.75rem;">Tramo</label>
                            <select class="form-select form-select-sm" data-lote-tramo="${index}" style="font-size:0.75rem;">
                                <option value="ida" ${tramo === "ida" ? "selected" : ""}>Comenzar Ida</option>
                                <option value="vuelta" ${tramo === "vuelta" ? "selected" : ""}>Comenzar Vuelta</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-12 col-md-2">

                    </div>
                </div>
            `;
            cont.appendChild(card);
        });

        qsa("[data-lote-tramo]", cont).forEach(select => {
            select.addEventListener("change", () => {
                const index = Number(select.dataset.loteTramo);
                if (data.lotesSeleccionados[index]) {
                    data.lotesSeleccionados[index].tipoTramo = select.value;
                    updateResumen();
                }
            });
        });

        qsa("[data-lote-pagado]", cont).forEach(input => {
            input.addEventListener("change", () => {
                const index = Number(input.dataset.lotePagado);
                if (data.lotesSeleccionados[index]) {
                    data.lotesSeleccionados[index].pagado = input.checked;
                    updateResumen();
                }
            });
        });

        qsa("[data-remove-lote]", cont).forEach(btn => {
            btn.addEventListener("click", () => {
                data.lotesSeleccionados.splice(Number(btn.dataset.removeLote), 1);
                renderLotesAsociados();
                renderLotesModal();
            });
        });

        qsa("[data-edit-lote]", cont).forEach(btn => {
            btn.addEventListener("click", () => abrirFormEdicionLote(Number(btn.dataset.editLote)));
        });

        updateResumen();
    };

    const syncLotesPendientes = () => {
        if (!data.lotesDisponibles.length || !data.lotesOriginalIds.size) return;
        const selected = [];
        data.lotesOriginalIds.forEach(id => {
            const base = data.lotesDisponibles.find(lote => getLoteId(lote) === id);
            const fromPayload = data.lotesSeleccionados.find(lote => getLoteId(lote) === id);
            if (base) {
                selected.push({
                    ...base,
                    tipoTramo: normalizeTipoTramo(fromPayload?.tipoTramo || base.tipoTramo || "ida"),
                    pagado: Boolean(fromPayload?.pagado ?? base.pagado)
                });
            } else if (fromPayload) {
                selected.push({
                    ...fromPayload,
                    tipoTramo: normalizeTipoTramo(fromPayload.tipoTramo || "ida"),
                    pagado: Boolean(fromPayload.pagado)
                });
            } else {
                selected.push({
                    idLote: id,
                    numeroLote: `Lote #${id}`,
                    tipoTramo: "ida",
                    pagado: false
                });
            }
        });
        data.lotesSeleccionados = selected;
        renderLotesAsociados();
    };

    const loadLotesDisponibles = async () => {
        if (data.lotesCargados) return;
        try {
            const lotes = await requestJson("/api/lotes");
            data.lotesDisponibles = Array.isArray(lotes) ? lotes : [];
            data.lotesCargados = true;
            syncLotesPendientes();
        } catch (error) {
            console.error(error);
        }
    };

    const openModal = modalEl => {
        if (!modalEl) return null;
        focusReturnTarget = document.activeElement;
        return bootstrap.Modal.getOrCreateInstance(modalEl);
    };

    const loadCamiones = async (page = paginacion.camiones.page) => {
        const tbody = $("tablaCamionesViaje");
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando camiones...</td></tr>';
        try {
            const params = new URLSearchParams({
                page: String(Math.max(0, Number(page) || 0)),
                size: String(paginacion.camiones.size),
                sort: paginacion.camiones.sort,
                excluirAsignados: "true"
            });
            if (filtros.camiones.q) params.set("q", filtros.camiones.q);
            if (filtros.camiones.estado) params.set("estado", filtros.camiones.estado);
            if (viajeId) params.set("viajeIdActual", viajeId);

            const pageData = await requestJson(`/api/camiones?${params.toString()}`);
            paginacion.camiones.page = Number(pageData?.number ?? 0);
            paginacion.camiones.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            paginacion.camiones.totalElements = Number(pageData?.totalElements ?? 0);
            paginacion.camiones.items = Array.isArray(pageData?.content) ? pageData.content : [];
            renderCamiones();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar camiones</td></tr>';
        }
    };

    const renderCamiones = () => {
        const tbody = $("tablaCamionesViaje");
        if (!tbody) return;
        if (!paginacion.camiones.items.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay camiones</td></tr>';
            return;
        }
        tbody.innerHTML = paginacion.camiones.items.map(camion => `
            <tr>
                <td>${camion.id}</td>
                <td><span class="badge bg-secondary font-monospace">${esc(camion.placa || "-")}</span></td>
                <td>${esc(camion.modelo || "-")}</td>
                <td>${esc(camion.marca || "-")}</td>
                <td><span class="badge bg-light text-dark border">${esc(camion.estadoCamion || camion.estado || "-")}</span></td>
                <td class="text-end"><button type="button" class="btn btn-primary btn-sm px-3" data-select-camion="${camion.id}">Seleccionar</button></td>
            </tr>
        `).join("");
        const total = $("totalCamionesViajeModal");
        if (total) {
            const start = paginacion.camiones.page * paginacion.camiones.size + 1;
            const end = start + paginacion.camiones.items.length - 1;
            total.textContent = `Mostrando ${start}-${end} de ${paginacion.camiones.totalElements} camiones`;
        }
        updatePagination("camiones");
    };

    const loadChoferes = async (page = paginacion.choferes.page) => {
        const tbody = $("tablaChoferesViaje");
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando choferes...</td></tr>';
        try {
            const params = new URLSearchParams({
                page: String(Math.max(0, Number(page) || 0)),
                size: String(paginacion.choferes.size),
                sort: paginacion.choferes.sort,
                excluirAsignados: "true"
            });
            if (filtros.choferes.q) params.set("q", filtros.choferes.q);
            if (filtros.choferes.estado) params.set("estado", filtros.choferes.estado);
            if (viajeId) params.set("viajeIdActual", viajeId);

            const pageData = await requestJson(`/api/usuarios?${params.toString()}`);
            paginacion.choferes.page = Number(pageData?.number ?? 0);
            paginacion.choferes.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            paginacion.choferes.totalElements = Number(pageData?.totalElements ?? 0);
            const usuarios = Array.isArray(pageData?.content) ? pageData.content : [];
            paginacion.choferes.items = usuarios.filter(u => {
                const rol = String(u?.rol?.nombre ?? u?.rol?.name ?? u?.rol ?? "").toLowerCase();
                return rol.includes("user") || rol.includes("usuario") || rol.includes("chofer");
            });
            if (!paginacion.choferes.items.length) paginacion.choferes.items = usuarios;
            renderChoferes();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar choferes</td></tr>';
        }
    };

    const renderChoferes = () => {
        const tbody = $("tablaChoferesViaje");
        if (!tbody) return;
        if (!paginacion.choferes.items.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay choferes disponibles</td></tr>';
            return;
        }
        tbody.innerHTML = paginacion.choferes.items.map(usuario => {
            const nombre = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || usuario.email || "-";
            return `
                <tr>
                    <td>${usuario.id}</td>
                    <td><strong>${esc(nombre)}</strong></td>
                    <td>${esc(usuario.email || "-")}</td>
                    <td><span class="badge bg-light text-dark border">${esc(usuario.estado || "-")}</span></td>
                    <td class="text-end"><button type="button" class="btn btn-primary btn-sm px-3" data-select-chofer="${usuario.id}">Seleccionar</button></td>
                </tr>
            `;
        }).join("");
        const total = $("totalChoferesViajeModal");
        if (total) {
            const start = paginacion.choferes.page * paginacion.choferes.size + 1;
            const end = start + paginacion.choferes.items.length - 1;
            total.textContent = `Mostrando ${start}-${end} de ${paginacion.choferes.totalElements} usuarios`;
        }
        updatePagination("choferes");
    };

    const updatePagination = tipo => {
        const config = paginacion[tipo];
        const btnPrev = $(`btnPrev${tipo === "camiones" ? "Camiones" : "Choferes"}ViajeModal`);
        const btnNext = $(`btnNext${tipo === "camiones" ? "Camiones" : "Choferes"}ViajeModal`);
        const label = $(`paginaActual${tipo === "camiones" ? "Camiones" : "Choferes"}ViajeModal`);
        const pageActual = config.page + 1;
        const totalPages = Math.max(config.totalPages, 1);
        const prev = config.page > 0;
        const next = config.page < totalPages - 1;
        if (btnPrev) {
            btnPrev.disabled = !prev;
            btnPrev.parentElement?.classList.toggle("disabled", !prev);
        }
        if (btnNext) {
            btnNext.disabled = !next;
            btnNext.parentElement?.classList.toggle("disabled", !next);
        }
        if (label) label.textContent = `${pageActual} / ${totalPages}`;
    };

    const loadLotesModal = async () => {
        const tbody = $("tablaLotesViaje");
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Cargando lotes...</td></tr>';
        try {
            const lotes = await requestJson("/api/lotes");
            data.lotesDisponibles = Array.isArray(lotes) ? lotes : [];
            paginacion.lotes.items = data.lotesDisponibles;
            data.lotesCargados = true;
            renderLotesModal();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar lotes</td></tr>';
        }
    };

    const getLotesFiltrados = () => {
        const query = filtros.lotes.q.toLowerCase();
        const estado = filtros.lotes.estado;
        const selectedIds = new Set(data.lotesSeleccionados.map(getLoteId).filter(Boolean));
        return data.lotesDisponibles
            .filter(lote => !selectedIds.has(getLoteId(lote)))
            .filter(lote => {
                if (estado && String(lote.estado || "") !== estado) return false;
                if (!query) return true;
                const numero = String(lote.numeroLote || "").toLowerCase();
                const encargado = String(lote.nombreEncargado || "").toLowerCase();
                const descripcion = String(lote.descripcion || "").toLowerCase();
                return numero.includes(query) || encargado.includes(query) || descripcion.includes(query);
            });
    };

    const renderLotesModal = () => {
        const tbody = $("tablaLotesViaje");
        if (!tbody) return;
        const list = getLotesFiltrados();
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay lotes disponibles</td></tr>';
            return;
        }
        const tramoDefault = $("tramoDefaultLoteViaje")?.value || "ida";
        tbody.innerHTML = list.map(lote => {
            const id = getLoteId(lote);
            return `
                <tr>
                    <td>${id}</td>
                    <td><strong>${esc(lote.numeroLote || `Lote #${id}`)}</strong></td>
                    <td><span class="badge bg-secondary">${esc(String(lote.estado || "").replaceAll("_", " "))}</span></td>
                    <td>${esc(lote.categoriaNombre || lote.idCategoria || "-")}</td>
                    <td>${esc(lote.clienteRemitenteNombre || "-")}</td>
                    <td>${esc(lote.clienteDestinatarioNombre || "-")}</td>
                    <td style="min-width:100px;">
                        <select class="form-select form-select-sm" data-tramo-row="${id}">
                            <option value="ida" ${tramoDefault === "ida" ? "selected" : ""}>Ida</option>
                            <option value="vuelta" ${tramoDefault === "vuelta" ? "selected" : ""}>Vuelta</option>
                        </select>
                    </td>
                    <td class="text-end"><button type="button" class="btn btn-success btn-sm btn-seleccionar-lote-modal" data-id="${id}">Asociar</button></td>
                </tr>
            `;
        }).join("");
    };

    const abrirFormEdicionLote = async idLote => {
        try {
            const lote = await requestJson(`/api/lotes/${idLote}`);
            data.editLoteCurrentData = lote;
            setValue("editLoteId", idLote);
            setValue("editLoteNumero", lote.numeroLote || "");
            setValue("editLotePeso", lote.peso || 0);
            setValue("editLoteValor", lote.valorDeclarado || 0);
            setValue("editLoteEncargado", lote.nombreEncargado || "");
            setValue("editLoteDescripcion", lote.descripcion || "");

            await loadEstadosLote();

            // Forzar llenado si el select está vacío
            const selectEdit = $("editLoteEstado");
            if (selectEdit && selectEdit.options.length <= 1) {
                fillEstadosSelect(selectEdit);
            }
            setValue("editLoteEstado", lote.estado || "");

            $("loteEditFormContainer")?.style.setProperty("display", "block");
            $("loteEditFormContainer")?.scrollIntoView({behavior: "smooth"});

            $("modalBuscarLoteViaje")?.addEventListener("hidden.bs.modal", () => {
                focusReturnTarget?.focus();
            });
        } catch (error) {
            console.error(error);
            notify("error", "Error al cargar la informacion del lote para editar.", "Viajes");
        }
    };
    const saveLoteEdit = async () => {
        if (!data.editLoteCurrentData) return;
        const idLote = Number($("editLoteId")?.value || 0);
        const payload = {
            ...data.editLoteCurrentData,
            estado: $("editLoteEstado")?.value || "",
            peso: num($("editLotePeso")?.value),
            valorDeclarado: num($("editLoteValor")?.value),
            nombreEncargado: $("editLoteEncargado")?.value || "",
            descripcion: $("editLoteDescripcion")?.value || ""
        };
        const btn = $("btnGuardarLoteEdit");
        btn.disabled = true;
        try {
            const updated = await requestJson(`/api/lotes/${idLote}`, {
                method: "PUT",
                headers: withCsrf({"Content-Type": "application/json"}),
                body: JSON.stringify(payload)
            });
            data.lotesDisponibles = data.lotesDisponibles.map(lote => getLoteId(lote) === idLote ? {...lote, ...updated} : lote);
            data.lotesSeleccionados = data.lotesSeleccionados.map(lote => getLoteId(lote) === idLote ? {...lote, ...updated} : lote);
            renderLotesAsociados();
            renderLotesModal();
            $("loteEditFormContainer")?.style.setProperty("display", "none");
            data.editLoteCurrentData = null;
            notify("success", "Contenedor actualizado correctamente.", "Viajes");
        } catch (error) {
            console.error(error);
            notify("error", `Error al actualizar lote: ${error.message}`, "Viajes");
        } finally {
            btn.disabled = false;
        }
    };

    const syncVueltaFromIda = () => {
        if (!usarMismosDatos?.checked) return;
        const pairs = [
            ["idaCamionInput", "vueltaCamionInput"],
            ["idaCamionId", "vueltaCamionId"],
            ["idaChoferInput", "vueltaChoferInput"],
            ["idaChoferId", "vueltaChoferId"],
            ["idaSalida", "vueltaSalida"],
            ["idaLlegada", "vueltaLlegada"],
            ["idaPaisSalida", "vueltaPaisSalida"],
            ["idaPaisDestino", "vueltaPaisDestino"],
            ["idaDireccionSalida", "vueltaDireccionSalida"],
            ["idaDireccionDestino", "vueltaDireccionDestino"],
            ["idaObservaciones", "vueltaObservaciones"],
            ["idaEstado", "vueltaEstado"]
        ];
        pairs.forEach(([sourceId, targetId]) => {
            const source = $(sourceId);
            const target = $(targetId);
            if (!source || !target) return;
            target.value = source.value;
        });
        const idaPagado = $("idaPagado");
        const vueltaPagado = $("vueltaPagado");
        if (idaPagado && vueltaPagado) vueltaPagado.checked = idaPagado.checked;
        state.vuelta.ingresosExtra = state.ida.ingresosExtra.map(ing => ({...ing, id: 0}));
        renderGastos("vuelta");
        renderIngresosExtra("vuelta");
        updateDuraciones();
        updateResumen();
    };

    const setVueltaDisabled = disabled => {
        const root = $("tab-vuelta");
        if (!root) return;
        qsa("input, select, textarea, button", root).forEach(el => {
            if (el.classList.contains("tab-button")) return;
            if (el.id === "btnBuscarCamionVuelta" || el.id === "btnBuscarChoferVuelta") el.disabled = disabled;
            else if (el.type !== "hidden") el.disabled = disabled;
        });
    };

    const resetFormulario = () => {
        viajeForm?.reset();
        delete viajeForm.dataset.viajeId;
        state.ida = {detalleId: 0, gastos: [], ingresosExtra: [], editIndex: null, editIngresoIndex: null};
        state.vuelta = {detalleId: 0, gastos: [], ingresosExtra: [], editIndex: null, editIngresoIndex: null};
        data.lotesSeleccionados = [];
        data.lotesOriginalIds = new Set();
        data.editLoteCurrentData = null;
        $("idaCamionId").value = "";
        $("idaChoferId").value = "";
        $("vueltaCamionId").value = "";
        $("vueltaChoferId").value = "";
        renderGastos("ida");
        renderGastos("vuelta");
        renderIngresosExtra("ida");
        renderIngresosExtra("vuelta");
        renderLotesAsociados();
        updateDuraciones();
        updateResumen();
        if (btnEliminarViaje) btnEliminarViaje.style.display = "none";
        setVueltaDisabled(false);
        if (usarMismosDatos) usarMismosDatos.checked = false;
        if (estadoGuardado) estadoGuardado.textContent = "";
    };

    const applyTramoToForm = (tramoKey, tramo) => {
        if (!tramo) return;
        state[tramoKey].detalleId = Number(tramo.id || 0);
        setValue(`${tramoKey}CamionId`, tramo.idCamion || tramo.id_camion || "");
        setValue(`${tramoKey}ChoferId`, tramo.idConductor || tramo.id_conductor || "");
        setValue(`${tramoKey}CamionInput`, tramo.camionNombre || tramo.camion_nombre || "");
        setValue(`${tramoKey}ChoferInput`, tramo.conductorNombre || tramo.conductor_nombre || "");
        setValue(`${tramoKey}Salida`, formatDateTimeInput(tramo.fechaSalida || tramo.fecha_salida));
        setValue(`${tramoKey}Llegada`, formatDateTimeInput(tramo.fechaEntrada || tramo.fecha_entrada));
        setValue(`${tramoKey}PaisSalida`, tramo.paisSalida || tramo.pais_salida || "");
        setValue(`${tramoKey}PaisDestino`, tramo.paisDestino || tramo.pais_destino || "");
        setValue(`${tramoKey}DireccionSalida`, tramo.direccionSalida || tramo.direccion_salida || "");
        setValue(`${tramoKey}DireccionDestino`, tramo.direccionDestino || tramo.direccion_destino || "");
        setValue(`${tramoKey}Observaciones`, tramo.observaciones || "");
        setValue(`${tramoKey}Estado`, tramo.estadoViaje || tramo.estado_viaje || "");
        const pagado = $( `${tramoKey}Pagado` );
        if (pagado) pagado.checked = Boolean(tramo.pagado);
        const iva = $(`${tramoKey}Iva`);
        if (iva && typeof tramo.iva === "boolean") iva.checked = Boolean(tramo.iva);
        state[tramoKey].gastos = Array.isArray(tramo.gastos) ? tramo.gastos.map(gasto => ({
            id: Number(gasto.id || 0),
            tipoId: Number(gasto.idTipoGasto || gasto.id_tipo_gasto || 0),
            tipoLabel: getGastoTipoLabel(gasto.idTipoGasto || gasto.id_tipo_gasto),
            tipoRaw: String(gasto.idTipoGasto || gasto.id_tipo_gasto || ""),
            descripcion: gasto.descripcion || "",
            monto: num(gasto.monto),
            fecha: gasto.fechaGasto || gasto.fecha_gasto || gasto.fecha || "",
            evidencia: gasto.evidenciaUrl || gasto.evidencia_url || ""
        })) : [];
        state[tramoKey].ingresosExtra = Array.isArray(tramo.ingresosExtra) ? tramo.ingresosExtra.map(ingreso => ({
            id: Number(ingreso.id || 0),
            categoriaId: Number(ingreso.idCategoriaIngresoExtra || 0),
            categoriaLabel: ingreso.categoriaNombre || getIngresoCategoriaLabel(ingreso.idCategoriaIngresoExtra),
            categoriaRaw: String(ingreso.idCategoriaIngresoExtra || ""),
            descripcion: ingreso.descripcion || "",
            monto: num(ingreso.monto),
            fecha: ingreso.fechaIngreso || ingreso.fecha || ""
        })) : [];
        renderGastos(tramoKey);
        renderIngresosExtra(tramoKey);
    };

    const cargarViajeDetalle = async id => {
        if (!viajeForm) return;
        if (estadoGuardado) {
            estadoGuardado.textContent = "Cargando...";
            estadoGuardado.className = "estado-guardado text-secondary";
        }
        if (btnGuardarViaje) btnGuardarViaje.disabled = true;
        try {
            await loadTiposGasto();
            await loadCategoriasIngresoExtra();
            await loadEstadosViaje();
            await loadPaises();
            await loadLotesDisponibles();

            const detalle = await requestJson(`/api/viajes/${id}`);
            viajeForm.dataset.viajeId = String(id);
            setValue("nombreViaje", detalle.nombreViaje || "");

            data.lotesOriginalIds = new Set((Array.isArray(detalle.loteIds) ? detalle.loteIds : []).map(Number).filter(Boolean));
            const lotesAsignados = Array.isArray(detalle.lotesAsignados) ? detalle.lotesAsignados : [];
            data.lotesSeleccionados = lotesAsignados.map(lote => ({
                ...lote,
                idLote: getLoteId(lote),
                tipoTramo: normalizeTipoTramo(lote.tipoTramo || "ida"),
                pagado: Boolean(lote.pagado)
            }));

            const tramos = Array.isArray(detalle.tramos) ? detalle.tramos : [];
            const tramoIda = getTramoFromResponse(tramos, "ida");
            const tramoVuelta = getTramoFromResponse(tramos, "vuelta");

            resetFormulario();
            viajeForm.dataset.viajeId = String(id);
            setValue("nombreViaje", detalle.nombreViaje || "");
            data.lotesOriginalIds = new Set((Array.isArray(detalle.loteIds) ? detalle.loteIds : []).map(Number).filter(Boolean));
            data.lotesSeleccionados = lotesAsignados.map(lote => ({
                ...lote,
                idLote: getLoteId(lote),
                tipoTramo: normalizeTipoTramo(lote.tipoTramo || "ida"),
                pagado: Boolean(lote.pagado)
            }));
            syncLotesPendientes();

            applyTramoToForm("ida", tramoIda);
            applyTramoToForm("vuelta", tramoVuelta);

            if (!tramoVuelta) {
                setVueltaDisabled(false);
            }

            updateDuraciones();
            updateResumen();
            if (btnEliminarViaje) btnEliminarViaje.style.display = "inline-block";
            if (formTitle) formTitle.textContent = "Editar viaje";
            if (estadoGuardado) estadoGuardado.textContent = "";
        } catch (error) {
            console.error(error);
            if (estadoGuardado) {
                estadoGuardado.textContent = "Error al cargar el viaje.";
                estadoGuardado.className = "estado-guardado text-danger";
            }
            notify("error", "No se pudo cargar el viaje.", "Viajes");
        } finally {
            if (btnGuardarViaje) btnGuardarViaje.disabled = false;
        }
    };

    const validarFormulario = () => {
        clearInvalid(viajeForm);
        const errores = [];
        const requerido = [
            ["nombreViaje", "Nombre del viaje"],
            ["idaCamionInput", "Camion ida"],
            ["idaChoferInput", "Chofer ida"],
            ["idaSalida", "Fecha salida ida"],
            ["idaLlegada", "Fecha llegada ida"],
            ["idaEstado", "Estado ida"]
        ];
        let ok = true;
        requerido.forEach(([id, label]) => {
            const el = $(id);
            if (!el || String(el.value || "").trim()) return;
            el.classList.add("is-invalid");
            errores.push(label);
            ok = false;
        });

        if (!$("idaCamionId")?.value) {
            $("idaCamionInput")?.classList.add("is-invalid");
            ok = false;
        }
        if (!$("idaChoferId")?.value) {
            $("idaChoferInput")?.classList.add("is-invalid");
            ok = false;
        }

        const idaSalida = $("idaSalida")?.value;
        const idaLlegada = $("idaLlegada")?.value;
        if (idaSalida && idaLlegada && new Date(idaSalida) >= new Date(idaLlegada)) {
            $("idaSalida")?.classList.add("is-invalid");
            $("idaLlegada")?.classList.add("is-invalid");
            errores.push("La salida de ida debe ser anterior a la llegada");
            ok = false;
        }

        const vueltaTieneDatos = [
            "vueltaCamionId",
            "vueltaChoferId",
            "vueltaSalida",
            "vueltaLlegada",
            "vueltaEstado"
        ].some(id => String($(id)?.value || "").trim()) || state.vuelta.gastos.length > 0;

        if (vueltaTieneDatos) {
            ["vueltaCamionInput", "vueltaChoferInput", "vueltaSalida", "vueltaLlegada", "vueltaEstado"].forEach(id => {
                if (!String($(id)?.value || "").trim()) {
                    $(id)?.classList.add("is-invalid");
                    ok = false;
                }
            });
            const vueltaSalida = $("vueltaSalida")?.value;
            const vueltaLlegada = $("vueltaLlegada")?.value;
            if (vueltaSalida && vueltaLlegada && new Date(vueltaSalida) >= new Date(vueltaLlegada)) {
                $("vueltaSalida")?.classList.add("is-invalid");
                $("vueltaLlegada")?.classList.add("is-invalid");
                errores.push("La salida de vuelta debe ser anterior a la llegada");
                ok = false;
            }
        }

        if (!ok && estadoGuardado) {
            estadoGuardado.textContent = errores.length ? errores.join(". ") : "Revisa el formulario.";
            estadoGuardado.className = "estado-guardado text-danger";
        }
        return ok;
    };

    const buildTramo = tramo => {
        const idCamion = getFieldId(tramo, "Camion");
        const idConductor = getFieldId(tramo, "Chofer");
        const fechaSalida = getFieldValue(tramo, "Salida");
        const fechaEntrada = getFieldValue(tramo, "Llegada");
        const paisSalida = getFieldValue(tramo, "PaisSalida");
        const paisDestino = getFieldValue(tramo, "PaisDestino");
        const direccionSalida = getFieldValue(tramo, "DireccionSalida");
        const direccionDestino = getFieldValue(tramo, "DireccionDestino");
        const observaciones = getFieldValue(tramo, "Observaciones");
        const estadoViaje = getFieldValue(tramo, "Estado");
        const pagado = $( `${tramo}Pagado` )?.checked ?? false;
        const iva = $(`${tramo}Iva`)?.checked ?? false;
        const gastos = state[tramo].gastos.map(gasto => ({
            id: Number(gasto.id || 0),
            idTipoGasto: Number(gasto.tipoId || 0),
            monto: num(gasto.monto),
            descripcion: gasto.descripcion || "",
            evidenciaUrl: gasto.evidencia || "",
            fechaGasto: gasto.fecha || null
        }));

        const ingresosExtra = state[tramo].ingresosExtra.map(ingreso => ({
            id: Number(ingreso.id || 0),
            idCategoriaIngresoExtra: Number(ingreso.categoriaId || 0),
            monto: num(ingreso.monto),
            descripcion: ingreso.descripcion || "",
            fechaIngreso: ingreso.fecha || null
        }));

        const hasData = Boolean(
            idCamion || idConductor || fechaSalida || fechaEntrada || estadoViaje ||
            paisSalida || paisDestino || direccionSalida || direccionDestino || observaciones ||
            pagado || iva || gastos.length || ingresosExtra.length
        );
        if (!hasData) return null;

        return {
            id: Number(state[tramo].detalleId || 0),
            tipoTramo: tramo,
            idCamion,
            idConductor,
            estadoViaje,
            pagado,
            iva,
            fechaSalida: fechaSalida || null,
            fechaEntrada: fechaEntrada || null,
            paisSalida: paisSalida || null,
            paisDestino: paisDestino || null,
            direccionSalida,
            direccionDestino,
            observaciones,
            gastos,
            ingresosExtra
        };
    };

    const buildPayload = () => {
        if (usarMismosDatos?.checked) syncVueltaFromIda();
        return {
            id_vieje: Number(viajeId) || 0,
            nombreViaje: $("nombreViaje")?.value?.trim() || "",
            loteIds: data.lotesSeleccionados.map(getLoteId).filter(Boolean),
            lotesAsignados: data.lotesSeleccionados.map(lote => ({
                idLote: getLoteId(lote),
                tipoTramo: normalizeTipoTramo(lote.tipoTramo || "ida"),
                pagado: Boolean(lote.pagado)
            })),
            tramos: [buildTramo("ida"), buildTramo("vuelta")].filter(Boolean)
        };
    };

    const saveViaje = async event => {
        event.preventDefault();
        if (estadoGuardado) estadoGuardado.textContent = "";
        if (!validarFormulario()) return;
        if (btnGuardarViaje) btnGuardarViaje.disabled = true;
        if (estadoGuardado) {
            estadoGuardado.textContent = "Guardando...";
            estadoGuardado.className = "estado-guardado text-secondary";
        }

        const payload = buildPayload();
        const method = viajeId ? "PUT" : "POST";
        const url = viajeId ? `/api/viajes/${viajeId}` : "/api/viajes";

        try {
            const response = await fetch(url, {
                method,
                headers: withCsrf({"Content-Type": "application/json"}),
                credentials: "same-origin",
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || "Error al guardar el viaje");
            }
            if (estadoGuardado) {
                estadoGuardado.textContent = "Guardado correctamente.";
                estadoGuardado.className = "estado-guardado text-success";
            }
            window.location.href = "/viajes";
        } catch (error) {
            console.error(error);
            const msg = error.message || "Error al guardar el viaje";
            if (estadoGuardado) {
                estadoGuardado.textContent = msg;
                estadoGuardado.className = "estado-guardado text-danger";
            }
            notify("error", msg, "Viajes");
        } finally {
            if (btnGuardarViaje) btnGuardarViaje.disabled = false;
        }
    };

    const deleteViaje = async () => {
        if (!viajeId) return;
        if (!confirm("¿Eliminar este viaje? Esta accion no se puede deshacer.")) return;
        if (btnEliminarViaje) btnEliminarViaje.disabled = true;
        try {
            const response = await fetch(`/api/viajes/${viajeId}`, {
                method: "DELETE",
                headers: withCsrf({}),
                credentials: "same-origin"
            });
            if (!response.ok) throw new Error("No se pudo eliminar el viaje");
            window.location.href = "/viajes";
        } catch (error) {
            console.error(error);
            notify("error", error.message || "No se pudo eliminar el viaje", "Viajes");
        } finally {
            if (btnEliminarViaje) btnEliminarViaje.disabled = false;
        }
    };

    const saveGasto = tramo => {
        const form = $(`${tramo}GastoForm`);
        if (!form) return;
        const tipoSelect = form.querySelector("[data-gasto-tipo]");
        const rawTipo = tipoSelect?.value || "";
        const tipoId = Number(rawTipo) || data.tiposGastoMap[String(rawTipo).toLowerCase()] || 0;
        const descripcion = form.querySelector("[data-gasto-desc]")?.value || "";
        const monto = num(form.querySelector("[data-gasto-monto]")?.value);
        const fecha = form.querySelector("[data-gasto-fecha]")?.value || "";
        const evidencia = form.querySelector("[data-gasto-evidencia]")?.files?.[0]?.name || "";
        if (!tipoId || monto <= 0) return;

        const gasto = {
            id: state[tramo].editIndex !== null ? Number(state[tramo].gastos[state[tramo].editIndex]?.id || 0) : 0,
            tipoId,
            tipoLabel: tipoSelect?.selectedOptions?.[0]?.textContent?.trim() || getGastoTipoLabel(tipoId),
            tipoRaw: rawTipo,
            descripcion,
            monto,
            fecha,
            evidencia
        };
        if (state[tramo].editIndex !== null) state[tramo].gastos[state[tramo].editIndex] = gasto;
        else state[tramo].gastos.push(gasto);
        renderGastos(tramo);
        resetGastoForm(tramo);
    };

    const loadViaje = async () => {
        if (!viajeId) {
            if (formTitle) formTitle.textContent = "Agregar viaje";
            resetFormulario();
            return;
        }
        if (formTitle) formTitle.textContent = "Editar viaje";
        await cargarViajeDetalle(viajeId);
    };

    // Events
    viajeForm?.addEventListener("submit", saveViaje);
    btnEliminarViaje?.addEventListener("click", deleteViaje);
    $("btnCerrarLoteEdit")?.addEventListener("click", () => {
        $("loteEditFormContainer").style.display = "none";
        data.editLoteCurrentData = null;
    });
    $("btnGuardarLoteEdit")?.addEventListener("click", saveLoteEdit);

    qsa(".tab-button").forEach(tab => {
        tab.addEventListener("click", () => {
            qsa(".tab-button").forEach(btn => btn.classList.remove("active"));
            qsa(".tab-panel").forEach(panel => panel.classList.remove("active"));
            tab.classList.add("active");
            $(`tab-${tab.dataset.tab}`)?.classList.add("active");
        });
    });

    qsa("[data-gasto-btn]").forEach(btn => {
        btn.addEventListener("click", () => {
            $(`${btn.dataset.gastoBtn}GastoForm`)?.classList.add("is-open");
        });
    });
    qsa("[data-gasto-cancelar]").forEach(btn => {
        btn.addEventListener("click", () => resetGastoForm(btn.dataset.gastoCancelar));
    });
    qsa("[data-gasto-guardar]").forEach(btn => {
        btn.addEventListener("click", () => saveGasto(btn.dataset.gastoGuardar));
    });
    qsa("[id$='GastosBody']").forEach(tbody => {
        tbody.addEventListener("click", event => {
            const edit = event.target.closest("[data-edit-gasto]");
            if (edit) {
                const tramo = edit.dataset.editGasto;
                const index = Number(edit.dataset.index);
                const gasto = state[tramo].gastos[index];
                if (!gasto) return;
                const form = $(`${tramo}GastoForm`);
                form.querySelector("[data-gasto-tipo]").value = gasto.tipoRaw;
                form.querySelector("[data-gasto-desc]").value = gasto.descripcion || "";
                form.querySelector("[data-gasto-monto]").value = gasto.monto || "";
                form.querySelector("[data-gasto-fecha]").value = gasto.fecha || "";
                state[tramo].editIndex = index;
                form.classList.add("is-open");
                return;
            }
            const del = event.target.closest("[data-delete-gasto]");
            if (del) {
                const tramo = del.dataset.deleteGasto;
                state[tramo].gastos.splice(Number(del.dataset.index), 1);
                renderGastos(tramo);
            }
        });
    });

    qsa("[data-ingreso-btn]").forEach(btn => {
        btn.addEventListener("click", () => {
            $(`${btn.dataset.ingresoBtn}IngresoForm`)?.classList.add("is-open");
        });
    });
    qsa("[data-ingreso-cancelar]").forEach(btn => {
        btn.addEventListener("click", () => resetIngresoForm(btn.dataset.ingresoCancelar));
    });
    qsa("[data-ingreso-guardar]").forEach(btn => {
        btn.addEventListener("click", () => saveIngreso(btn.dataset.ingresoGuardar));
    });
    qsa("[id$='IngresosBody']").forEach(tbody => {
        tbody.addEventListener("click", event => {
            const edit = event.target.closest("[data-edit-ingreso]");
            if (edit) {
                const tramo = edit.dataset.editIngreso;
                const index = Number(edit.dataset.index);
                const ingreso = state[tramo].ingresosExtra[index];
                if (!ingreso) return;
                const form = $(`${tramo}IngresoForm`);
                form.querySelector("[data-ingreso-tipo]").value = ingreso.categoriaRaw;
                form.querySelector("[data-ingreso-desc]").value = ingreso.descripcion || "";
                form.querySelector("[data-ingreso-monto]").value = ingreso.monto || "";
                form.querySelector("[data-ingreso-fecha]").value = ingreso.fecha || "";
                state[tramo].editIngresoIndex = index;
                form.classList.add("is-open");
                return;
            }
            const del = event.target.closest("[data-delete-ingreso]");
            if (del) {
                const tramo = del.dataset.deleteIngreso;
                state[tramo].ingresosExtra.splice(Number(del.dataset.index), 1);
                renderIngresosExtra(tramo);
            }
        });
    });

    $("idaIva")?.addEventListener("change", updateResumen);
    $("vueltaIva")?.addEventListener("change", updateResumen);
    $("idaPagado")?.addEventListener("change", updateResumen);
    $("vueltaPagado")?.addEventListener("change", updateResumen);
    ["idaSalida", "idaLlegada", "vueltaSalida", "vueltaLlegada"].forEach(id => $(id)?.addEventListener("input", () => {
        updateDuraciones();
        updateResumen();
        if (usarMismosDatos?.checked && id.startsWith("ida")) syncVueltaFromIda();
    }));
    ["idaCamionInput", "idaChoferInput", "idaCamionId", "idaChoferId", "idaPaisSalida", "idaPaisDestino", "idaDireccionSalida", "idaDireccionDestino", "idaObservaciones", "idaEstado"].forEach(id => {
        $(id)?.addEventListener("input", () => {
            updateResumen();
            if (usarMismosDatos?.checked && id.startsWith("ida")) syncVueltaFromIda();
        });
        $(id)?.addEventListener("change", () => {
            updateResumen();
            if (usarMismosDatos?.checked && id.startsWith("ida")) syncVueltaFromIda();
        });
    });

    usarMismosDatos?.addEventListener("change", () => {
        if (usarMismosDatos.checked) syncVueltaFromIda();
        setVueltaDisabled(usarMismosDatos.checked);
        updateResumen();
    });

    $("btnBuscarCamionIda")?.addEventListener("click", () => {
        lookup.camionTramo = "ida";
        modalCamion = openModal($("modalBuscarCamionViaje"));
        modalCamion?.show();
    });
    $("btnBuscarCamionVuelta")?.addEventListener("click", () => {
        lookup.camionTramo = "vuelta";
        modalCamion = openModal($("modalBuscarCamionViaje"));
        modalCamion?.show();
    });
    $("btnBuscarChoferIda")?.addEventListener("click", () => {
        lookup.choferTramo = "ida";
        modalChofer = openModal($("modalBuscarChoferViaje"));
        modalChofer?.show();
    });
    $("btnBuscarChoferVuelta")?.addEventListener("click", () => {
        lookup.choferTramo = "vuelta";
        modalChofer = openModal($("modalBuscarChoferViaje"));
        modalChofer?.show();
    });

    $("tablaCamionesViaje")?.addEventListener("click", event => {
        const btn = event.target.closest("[data-select-camion]");
        if (!btn) return;
        const camion = paginacion.camiones.items.find(item => Number(item.id) === Number(btn.dataset.selectCamion));
        if (!camion) return;
        const tramo = lookup.camionTramo === "vuelta" ? "vuelta" : "ida";
        const input = $(`${tramo}CamionInput`);
        const hidden = $(`${tramo}CamionId`);
        input.value = camion.nombre ? `${camion.nombre} (${camion.placa || "-"})` : (camion.placa || camion.modelo || "");
        hidden.value = camion.id;
        bootstrap.Modal.getInstance($("modalBuscarCamionViaje"))?.hide();
        input.focus();
    });
    $("tablaChoferesViaje")?.addEventListener("click", event => {
        const btn = event.target.closest("[data-select-chofer]");
        if (!btn) return;
        const chofer = paginacion.choferes.items.find(item => Number(item.id) === Number(btn.dataset.selectChofer));
        if (!chofer) return;
        const tramo = lookup.choferTramo === "vuelta" ? "vuelta" : "ida";
        const input = $(`${tramo}ChoferInput`);
        const hidden = $(`${tramo}ChoferId`);
        input.value = `${chofer.nombre || ""} ${chofer.apellido || ""}`.trim() || chofer.email || "";
        hidden.value = chofer.id;
        bootstrap.Modal.getInstance($("modalBuscarChoferViaje"))?.hide();
        input.focus();
    });

    $("btnAbrirModalBusquedaLotes")?.addEventListener("click", async () => {
        modalLote = openModal($("modalBuscarLoteViaje"));
        await loadCategorias();
        await loadEstadosLote();
        modalLote?.show();
    });

    $("filtroBusquedaCamionesViajeModal")?.addEventListener("input", event => {
        clearTimeout(debounceCamiones);
        debounceCamiones = setTimeout(() => {
            filtros.camiones.q = event.target.value.trim();
            loadCamiones(0);
        }, 300);
    });
    $("filtroEstadoCamionesViajeModal")?.addEventListener("change", event => {
        filtros.camiones.estado = event.target.value;
        loadCamiones(0);
    });
    $("btnLimpiarFiltrosCamionesViajeModal")?.addEventListener("click", () => {
        filtros.camiones.q = "";
        filtros.camiones.estado = "";
        $("filtroBusquedaCamionesViajeModal").value = "";
        $("filtroEstadoCamionesViajeModal").value = "";
        loadCamiones(0);
    });

    $("filtroBusquedaChoferesViajeModal")?.addEventListener("input", event => {
        clearTimeout(debounceChoferes);
        debounceChoferes = setTimeout(() => {
            filtros.choferes.q = event.target.value.trim();
            loadChoferes(0);
        }, 300);
    });
    $("filtroEstadoChoferesViajeModal")?.addEventListener("change", event => {
        filtros.choferes.estado = event.target.value;
        loadChoferes(0);
    });
    $("btnLimpiarFiltrosChoferesViajeModal")?.addEventListener("click", () => {
        filtros.choferes.q = "";
        filtros.choferes.estado = "";
        $("filtroBusquedaChoferesViajeModal").value = "";
        $("filtroEstadoChoferesViajeModal").value = "";
        loadChoferes(0);
    });

    $("btnPrevCamionesViajeModal")?.addEventListener("click", () => loadCamiones(paginacion.camiones.page - 1));
    $("btnNextCamionesViajeModal")?.addEventListener("click", () => loadCamiones(paginacion.camiones.page + 1));
    $("btnPrevChoferesViajeModal")?.addEventListener("click", () => loadChoferes(paginacion.choferes.page - 1));
    $("btnNextChoferesViajeModal")?.addEventListener("click", () => loadChoferes(paginacion.choferes.page + 1));

    $("modalBuscarCamionViaje")?.addEventListener("shown.bs.modal", () => {
        loadCamiones();
    });
    $("modalBuscarChoferViaje")?.addEventListener("shown.bs.modal", () => {
        loadChoferes();
    });

    $("btnPrevCamionesViajeModal");
    $("btnNextCamionesViajeModal");

    $("modalBuscarLoteViaje")?.addEventListener("shown.bs.modal", () => {
        filtros.lotes.q = "";
        filtros.lotes.estado = "";
        $("filtroBusquedaLotesViajeModal").value = "";
        $("filtroEstadoLotesViajeModal").value = "";
        $("nuevoLoteInlineForm").style.display = "none";
        loadLotesModal();
    });

    $("filtroBusquedaLotesViajeModal")?.addEventListener("input", event => {
        clearTimeout(debounceLotes);
        debounceLotes = setTimeout(() => {
            filtros.lotes.q = event.target.value.trim();
            renderLotesModal();
        }, 300);
    });
    $("filtroEstadoLotesViajeModal")?.addEventListener("change", event => {
        filtros.lotes.estado = event.target.value;
        renderLotesModal();
    });
    $("tramoDefaultLoteViaje")?.addEventListener("change", renderLotesModal);

    $("tablaLotesViaje")?.addEventListener("click", event => {
        const btn = event.target.closest(".btn-seleccionar-lote-modal");
        if (!btn) return;
        const id = Number(btn.dataset.id);
        if (!id) return;
        if (data.lotesSeleccionados.some(lote => getLoteId(lote) === id)) return;
        const match = data.lotesDisponibles.find(lote => getLoteId(lote) === id);
        const tramo = qs(`[data-tramo-row="${id}"]`)?.value || $("tramoDefaultLoteViaje")?.value || "ida";
        data.lotesSeleccionados.push({
            ...(match || {idLote: id, numeroLote: `Lote #${id}`}),
            tipoTramo: tramo,
            pagado: false
        });
        renderLotesAsociados();
        renderLotesModal();
    });

    $("btnNuevoLoteDesdeViaje")?.addEventListener("click", async () => {
        const form = $("nuevoLoteInlineForm");
        if (!form) return;
        form.style.display = form.style.display === "none" ? "block" : "none";
        if (form.style.display === "block") {
            await loadEstadosLote();
            await loadCategorias();
        }
    });
    $("btnCancelarLoteInline")?.addEventListener("click", () => {
        $("nuevoLoteInlineForm").style.display = "none";
    });
    $("btnGuardarLoteInline")?.addEventListener("click", async () => {
        const form = $("nuevoLoteInlineForm");
        if (!form) return;
        const numero = form.querySelector("[data-lote-numero]")?.value?.trim();
        const estado = form.querySelector("[data-lote-estado]")?.value?.trim();
        const idCategoria = Number(form.querySelector("[data-lote-categoria]")?.value || 0);
        const idClienteRemitente = Number(form.querySelector("[data-lote-remitente]")?.value || 0);
        const descripcion = form.querySelector("[data-lote-descripcion]")?.value || "";
        const peso = num(form.querySelector("[data-lote-peso]")?.value);
        const valorDeclarado = num(form.querySelector("[data-lote-valor]")?.value);
        const tipoTramo = form.querySelector("[data-lote-tramo-inline]")?.value || "ida";
        const errores = [];

        if (!numero) errores.push("• Número de lote");
        if (!estado) errores.push("• Estado del lote");
        if (!idCategoria || idCategoria === 0) errores.push("• Categoría");
        if (!idClienteRemitente || idClienteRemitente === 0) errores.push("• Cliente remitente");

        if (errores.length > 0) {
            notify("warning", `Campos obligatorios pendientes:\n${errores.join("\n")}`, "Viajes");
            return;
        }

        try {
            const nuevoLote = await requestJson("/api/lotes", {
                method: "POST",
                headers: withCsrf({"Content-Type": "application/json"}),
                body: JSON.stringify({
                    numeroLote: numero,
                    estado,
                    idCategoria,
                    idClienteRemitente,
                    descripcion,
                    peso: peso || null,
                    valorDeclarado: valorDeclarado || null
                })
            });
            data.lotesDisponibles.unshift(nuevoLote);
            data.lotesSeleccionados.push({
                ...nuevoLote,
                tipoTramo,
                pagado: false
            });
            renderLotesAsociados();
            renderLotesModal();
            form.reset();
            form.style.display = "none";
            notify("success", "Lote creado y asociado con exito.", "Viajes");
        } catch (error) {
            console.error(error);
            notify("error", `Error al crear lote: ${error.message}`, "Viajes");
        }
    });

    // Initial load
    (async () => {
        await Promise.all([loadTiposGasto(), loadEstadosViaje(), loadPaises(), loadEstadosLote(), loadCategorias(), loadLotesDisponibles(), loadCategoriasIngresoExtra()]);
        if (viajeId) await cargarViajeDetalle(viajeId);
        else {
            if (formTitle) formTitle.textContent = "Agregar viaje";
            resetFormulario();
        }
        updateDuraciones();
        updateResumen();
    })();






 // parte del los clientes




    let clientePickerTarget = null;

    document.querySelectorAll("[data-cliente-picker]").forEach(btn => {
        btn.addEventListener("click", () => {
            clientePickerTarget = btn.dataset.clientePicker;
            bootstrap.Modal.getOrCreateInstance($("modalSeleccionCliente")).show();
            cargarClientePicker(clientePicker.page - 1);
        });
    });

    const clientePicker = {
        target: null,
        page: 0,
        size: 10,
        totalPages: 1,
        totalElements: 0,
        sort: "id,desc",
        q: ""
    };

    const clientePickerRefs = {
        q: document.getElementById("clientePickerQ"),
        size: document.getElementById("clientePickerSize"),
        body: document.getElementById("clientePickerBody"),
        prev: document.getElementById("clientePickerPrev"),
        next: document.getElementById("clientePickerNext"),
        info: document.getElementById("clientePickerInfo")
    };

    const renderClientePicker = (clientes) => {
        const body = clientePickerRefs.body;
        if (!body) return;
        if (!clientes.length) {
            body.innerHTML = '<tr><td colspan="6" class="text-center">No hay clientes</td></tr>';
            return;
        }
        body.innerHTML = clientes.map(c => `
        <tr>
            <td><button type="button" class="btn btn-sm btn-primary btn-select-cliente"
                data-id="${c.id}" data-nombre="${esc(c.nombre || "")}">Seleccionar</button></td>
            <td>${esc(c.nombre || "-")}</td>
            <td>${esc(c.telefono || "-")}</td>
            <td>${esc(c.correo || "-")}</td>
            <td>${esc(c.direccion || "-")}</td>
            <td>${c.id}</td>
        </tr>
    `).join("");
    };

    const actualizarClientePickerFooter = () => {
        if (clientePickerRefs.info)
            clientePickerRefs.info.textContent = `Pagina ${clientePicker.page + 1} de ${clientePicker.totalPages}`;
        if (clientePickerRefs.prev) clientePickerRefs.prev.disabled = clientePicker.page <= 0;
        if (clientePickerRefs.next) clientePickerRefs.next.disabled = clientePicker.page >= clientePicker.totalPages - 1;
    };

    const cargarClientePicker = async (page = 0) => {
        const body = clientePickerRefs.body;
        if (!body) return;
        body.innerHTML = '<tr><td colspan="6" class="text-center">Cargando clientes...</td></tr>';
        try {
            const query = new URLSearchParams({
                page: String(Math.max(0, page)),
                size: String(clientePicker.size),
                sort: clientePicker.sort
            });
            if (clientePicker.q) query.set("q", clientePicker.q);
            const res = await fetch(`/api/clientes?${query}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("Error al cargar clientes");
            const data = await res.json();
            clientePicker.page = Number(data?.number ?? page);
            clientePicker.totalPages = Math.max(1, Number(data?.totalPages ?? 1));
            clientePicker.totalElements = Number(data?.totalElements ?? 0);
            renderClientePicker(Array.isArray(data?.content) ? data.content : []);
            actualizarClientePickerFooter();
        } catch (e) {
            console.error(e);
            body.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar clientes</td></tr>';
        }
    };

// Eventos del picker
    clientePickerRefs.body?.addEventListener("click", ev => {
        const btn = ev.target.closest(".btn-select-cliente");
        if (!btn) return;
        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;
        if (clientePickerTarget === "remitente") {
            $("nuevoRemitenteId").value = id;
            $("nuevoRemitenteNombre").value = nombre;
        } else if (clientePickerTarget === "destinatario") {
            $("nuevoDestinatarioId").value = id;
            $("nuevoDestinatarioNombre").value = nombre;
        }
        bootstrap.Modal.getInstance($("modalSeleccionCliente"))?.hide();
    });

    $("btnClientePickerBuscar")?.addEventListener("click", () => {
        clientePicker.q = clientePickerRefs.q?.value.trim() || "";
        cargarClientePicker(0);
    });
    clientePickerRefs.prev?.addEventListener("click", () => cargarClientePicker(clientePicker.page - 1));
    clientePickerRefs.next?.addEventListener("click", () => cargarClientePicker(clientePicker.page + 1));







});
