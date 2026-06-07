document.addEventListener("DOMContentLoaded", () => {
    const viajeForm = document.getElementById("viajeForm");
    const usarMismosDatos = document.getElementById("usarMismosDatos");
    const estadoGuardado = document.getElementById("estadoGuardado");
    const btnGuardarViaje = document.getElementById("btnGuardarViaje");
    const btnEliminarViaje = document.getElementById("btnEliminarViaje");
    const formTitle = document.getElementById("formTitle");

    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

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

    const state = {
        ida: {detalleId: 0, gastos: [], editIndex: null},
        vuelta: {detalleId: 0, gastos: [], editIndex: null}
    };

    // Lotes state
    let lotesDisponibles = [];
    let lotesSeleccionados = [];
    let loteIdsPendientes = [];
    let lotesPendientesConDatos = []; // stores {id, tipoTramo, pagado}
    let loteIdsIniciales = new Set();
    let paisesCargados = false;
    let lotesCargados = false;
    let editLoteCurrentData = null;

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

    const formatDateTimeLocal = value => {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const pad = num => String(num).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

    const normalizeDateTime = value => {
        if (!value) return null;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
    };

    // --- Tab management ---
    const tabs = document.querySelectorAll(".tab-button");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(btn => btn.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add("active");
        });
    });

    // --- Available Lots Search Modal (modalBusquedaLotes) ---
    let modalBusquedaLotesInstancia = null;

    const renderTablaBusquedaLotes = (filtro = "") => {
        const tbody = document.getElementById("tablaModalBusquedaLotes");
        if (!tbody) return;
        tbody.innerHTML = "";

        const selectedIds = new Set(lotesSeleccionados.map(getLoteId).filter(Boolean));
        const disponibles = Array.isArray(lotesDisponibles) ? lotesDisponibles : [];

        const opts = disponibles
            .filter(l => !selectedIds.has(getLoteId(l)))
            .filter(l => !l.asignado || loteIdsIniciales.has(getLoteId(l)))
            .filter(l => {
                if (!filtro) return true;
                const f = filtro.toLowerCase();
                const num = (l.numeroLote || "").toLowerCase();
                const enc = (l.nombreEncargado || "").toLowerCase();
                return num.includes(f) || enc.includes(f);
            });

        if (!opts.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay lotes disponibles que coincidan.</td></tr>';
            return;
        }

        opts.forEach(lote => {
            const id = getLoteId(lote);
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${lote.numeroLote || '-'}</td>
                <td><span class="badge bg-secondary">${String(lote.estado || "").replaceAll("_", " ")}</span></td>
                <td>${lote.nombreEncargado || '-'}</td>
                <td>$${Number(lote.valorDeclarado || 0).toFixed(2)}</td>
                <td>
                    <div class="form-check form-switch mb-0">
                        <input class="form-check-input" type="checkbox" id="pagadoModal_${id}" data-pagado-modal="${id}">
                        <label class="form-check-label" for="pagadoModal_${id}">Si</label>
                    </div>
                </td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-success btn-seleccionar-lote" data-id="${id}">Seleccionar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-seleccionar-lote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                const lote = lotesDisponibles.find(l => getLoteId(l) === id);
                if (lote) {
                    const lid = getLoteId(lote);
                    if (lotesSeleccionados.some(l => getLoteId(l) === lid)) {
                        notify("warning", "Ese lote ya está agregado al viaje.", "Viajes");
                        return;
                    }
                    // Get tramo from select in modal
                    const tramoSelect = document.getElementById("tramoSeleccionModalLotes");
                    const tramoElegido = tramoSelect?.value || "ida";
                    // Get pagado from row checkbox
                    const pagadoCheck = document.querySelector(`[data-pagado-modal="${lid}"]`);
                    const pagadoElegido = pagadoCheck ? pagadoCheck.checked : false;
                    lotesSeleccionados.push({
                        ...lote,
                        tipoTramo: tramoElegido,
                        pagado: pagadoElegido
                    });
                    renderLotesAsociados();
                    modalBusquedaLotesInstancia?.hide();
                }
            });
        });
    };

    document.getElementById("btnAbrirModalBusquedaLotes")?.addEventListener("click", () => {
        const modalEl = document.getElementById("modalBusquedaLotes");
        if (!modalEl) return;
        if (!modalBusquedaLotesInstancia) {
            modalBusquedaLotesInstancia = new bootstrap.Modal(modalEl);
        }
        document.getElementById("filtroModalLotes").value = "";
        renderTablaBusquedaLotes("");
        modalBusquedaLotesInstancia.show();
    });

    document.getElementById("filtroModalLotes")?.addEventListener("input", (e) => {
        renderTablaBusquedaLotes(e.target.value);
    });


    // --- Associated Lots Display & Actions ---
    const renderLotesAsociados = () => {
        const cont = document.getElementById("lotesAsociados");
        if (!cont) return;

        cont.innerHTML = "";
        if (!lotesSeleccionados.length) {
            cont.innerHTML = '<div class="text-muted text-center py-3">No hay contenedores asociados.</div>';
            actualizarResumen();
            return;
        }

        lotesSeleccionados.forEach((lote, idx) => {
            const id = getLoteId(lote);
            const tramo = lote.tipoTramo || "ida";
            const pagado = Boolean(lote.pagado);
            const card = document.createElement("div");

            const tramoBgStyle = tramo === "vuelta" ? "background:#7c3aed;color:white" : "background:#2563eb;color:white";
            const tramoLabel = tramo === "vuelta" ? "↩ Vuelta" : "🚛 Ida";

            card.className = "card border-start border-3 p-3";
            card.style.borderLeftColor = tramo === "vuelta" ? "#7c3aed" : "#2563eb";
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-bold text-dark">${escapeHtml(lote.numeroLote || `Lote #${id}`)}</div>
                        <div class="small text-muted mb-2">Encargado: ${escapeHtml(lote.nombreEncargado || "-")} | Valor: ${formatMoney(lote.valorDeclarado)}</div>
                    </div>
                    <div class="d-flex gap-1">
                        <button type="button" class="btn btn-outline-secondary btn-sm px-2 py-1" data-edit-lote="${id}" title="Editar Info Lote">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm px-2 py-1" data-remove-lote="${idx}" title="Desasociar Lote">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="row g-2 align-items-center mt-1">
                    <div class="col-sm-6">
                        <div class="input-group input-group-sm">
                            <label class="input-group-text" style="font-size:0.75rem;">Tramo</label>
                            <select class="form-select form-select-sm" data-lote-tramo="${idx}" style="font-size:0.75rem;">
                                <option value="ida" ${tramo === 'ida' ? 'selected' : ''}>🚛 Ida</option>
                                <option value="vuelta" ${tramo === 'vuelta' ? 'selected' : ''}>↩ Vuelta</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input" type="checkbox" id="lotePagado_${idx}" data-lote-pagado-check="${idx}" ${pagado ? 'checked' : ''}>
                            <label class="form-check-label small fw-semibold" for="lotePagado_${idx}">Lote Pagado</label>
                        </div>
                    </div>
                </div>
            `;
            cont.appendChild(card);
        });

        // Listeners for tramo change
        cont.querySelectorAll('[data-lote-tramo]').forEach(sel => {
            sel.addEventListener('change', () => {
                const idx = Number(sel.dataset.loteTramo);
                if (lotesSeleccionados[idx]) {
                    lotesSeleccionados[idx].tipoTramo = sel.value;
                    renderLotesAsociados();
                }
            });
        });

        // Listeners for pagado check
        cont.querySelectorAll('[data-lote-pagado-check]').forEach(check => {
            check.addEventListener('change', () => {
                const idx = Number(check.dataset.lotePagadoCheck);
                if (lotesSeleccionados[idx]) {
                    lotesSeleccionados[idx].pagado = check.checked;
                    actualizarResumen();
                }
            });
        });

        // Remove lot handler
        cont.querySelectorAll('[data-remove-lote]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.removeLote);
                lotesSeleccionados.splice(idx, 1);
                renderLotesAsociados();
            });
        });

        // Edit lot details handler
        cont.querySelectorAll('[data-edit-lote]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.editLote);
                abrirFormEdicionLote(id);
            });
        });

        actualizarResumen();
    };

    // --- Inline Lote Details Editor ---
    const abrirFormEdicionLote = async idLote => {
        try {
            const res = await fetch(`/api/lotes/${idLote}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudo cargar el lote para editar");
            editLoteCurrentData = await res.json();

            document.getElementById("editLoteId").value = idLote;
            document.getElementById("editLoteNumero").value = editLoteCurrentData.numeroLote || "";
            document.getElementById("editLotePeso").value = editLoteCurrentData.peso || 0;
            document.getElementById("editLoteValor").value = editLoteCurrentData.valorDeclarado || 0;
            document.getElementById("editLoteEncargado").value = editLoteCurrentData.nombreEncargado || "";
            document.getElementById("editLoteDescripcion").value = editLoteCurrentData.descripcion || "";

            const estadoSelect = document.getElementById("editLoteEstado");
            if (estadoSelect) {
                // Load states if empty
                if (!estadoSelect.children.length) {
                    try {
                        const resEst = await fetch("/api/lotes/estados");
                        if (resEst.ok) {
                            const estados = await resEst.json();
                            estadoSelect.innerHTML = "";
                            estados.forEach(e => {
                                const option = document.createElement("option");
                                option.value = e;
                                option.textContent = String(e).replaceAll("_", " ");
                                estadoSelect.appendChild(option);
                            });
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
                estadoSelect.value = editLoteCurrentData.estado || "";
            }

            document.getElementById("loteEditFormContainer").style.display = "block";
            document.getElementById("loteEditFormContainer").scrollIntoView({behavior: "smooth"});
        } catch (error) {
            console.error(error);
            notify("error", "Error al cargar la información del lote para editar.", "Viajes");
        }
    };

    document.getElementById("btnCerrarLoteEdit")?.addEventListener("click", () => {
        document.getElementById("loteEditFormContainer").style.display = "none";
        editLoteCurrentData = null;
    });

    document.getElementById("btnGuardarLoteEdit")?.addEventListener("click", async () => {
        if (!editLoteCurrentData) return;
        const idLote = document.getElementById("editLoteId").value;
        const btn = document.getElementById("btnGuardarLoteEdit");
        btn.disabled = true;
        try {
            editLoteCurrentData.estado = document.getElementById("editLoteEstado").value;
            editLoteCurrentData.peso = parseFloat(document.getElementById("editLotePeso").value) || 0;
            editLoteCurrentData.valorDeclarado = parseFloat(document.getElementById("editLoteValor").value) || 0;
            editLoteCurrentData.nombreEncargado = document.getElementById("editLoteEncargado").value;
            editLoteCurrentData.descripcion = document.getElementById("editLoteDescripcion").value;

            const headers = {"Content-Type": "application/json"};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;

            const res = await fetch(`/api/lotes/${idLote}`, {
                method: "PUT",
                headers,
                credentials: "same-origin",
                body: JSON.stringify(editLoteCurrentData)
            });
            if (!res.ok) throw new Error("Error al guardar cambios de lote");
            const updated = await res.json();

            // Sync in local arrays
            lotesDisponibles = lotesDisponibles.map(l => getLoteId(l) === Number(idLote) ? {...l, ...updated} : l);
            lotesSeleccionados = lotesSeleccionados.map(l => getLoteId(l) === Number(idLote) ? {...l, ...updated} : l);

            renderLotesAsociados();
            document.getElementById("loteEditFormContainer").style.display = "none";
            editLoteCurrentData = null;
            notify("success", "Contenedor actualizado correctamente.", "Viajes");
        } catch (error) {
            console.error(error);
            notify("error", `Error al actualizar lote: ${error.message}`, "Viajes");
        } finally {
            btn.disabled = false;
        }
    });


    // --- Sync / Loading Lots ---
    const syncLotesPendientes = () => {
        if (!loteIdsPendientes.length) return;
        const ids = new Set(loteIdsPendientes.map(Number).filter(Boolean));
        lotesSeleccionados = (Array.isArray(lotesDisponibles) ? lotesDisponibles : [])
            .filter(l => ids.has(getLoteId(l)))
            .map(l => {
                const id = getLoteId(l);
                const extra = lotesPendientesConDatos.find(x => Number(x.id) === id);
                return {
                    ...l,
                    tipoTramo: extra?.tipoTramo || "ida",
                    pagado: extra ? Boolean(extra.pagado) : false
                };
            });
        ids.forEach(id => {
            if (lotesSeleccionados.some(l => getLoteId(l) === id)) return;
            const extra = lotesPendientesConDatos.find(x => Number(x.id) === id);
            lotesSeleccionados.push({
                idLote: id,
                numeroLote: `Lote #${id}`,
                tipoTramo: extra?.tipoTramo || "ida",
                pagado: extra ? Boolean(extra.pagado) : false
            });
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
                throw new Error("Respuesta invalida (sesion expirada o endpoint bloqueado)");
            }
            const data = await res.json();
            lotesDisponibles = Array.isArray(data) ? data : [];
            lotesCargados = true;
            syncLotesPendientes();
        } catch (error) {
            console.error(error);
        }
    };


    // --- Support list loading (Estados, Paises, Tipos Gasto) ---
    const cargarEstadosViaje = async () => {
        const selectIda = document.getElementById("idaEstado");
        const selectVuelta = document.getElementById("vueltaEstado");
        if (!selectIda && !selectVuelta) return;
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
            estadosViajeCargados = true;
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

    const cargarTiposGasto = async () => {
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
    };

    const resolveTipoLabel = idTipo => {
        if (!idTipo) return "-";
        const match = tiposGastoCache.find(t => Number(t.id) === Number(idTipo));
        return match?.tipoGasto || `Tipo #${idTipo}`;
    };


    // --- GASTOS (Expenses) Actions ---
    const renderGastos = tramo => {
        const tbody = document.getElementById(`${tramo}GastosBody`);
        if (!tbody) return;
        tbody.innerHTML = "";

        state[tramo].gastos.forEach((gasto, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${escapeHtml(gasto.tipoLabel)}</td>
                <td>${escapeHtml(gasto.descripcion || "-")}</td>
                <td class="text-end fw-semibold text-danger">${formatMoney(gasto.monto)}</td>
                <td>${escapeHtml(gasto.fecha || "-")}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-edit="${tramo}" data-index="${index}">Editar</button>
                        <button type="button" class="btn btn-danger btn-sm text-white" data-delete="${tramo}" data-index="${index}">Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
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
            const tramo = btn.dataset.gastoCancelar;
            resetGastoForm(tramo);
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

            if (!tipoId) {
                tipoSelect.classList.add("is-invalid");
                return;
            } else {
                tipoSelect.classList.remove("is-invalid");
            }
            const montoInput = form.querySelector("[data-gasto-monto]");
            if (monto <= 0) {
                montoInput.classList.add("is-invalid");
                return;
            } else {
                montoInput.classList.remove("is-invalid");
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

    // Handle Edit/Delete clicks in table
    document.querySelectorAll("[id$='GastosBody']").forEach(tbody => {
        tbody.addEventListener("click", event => {
            const editBtn = event.target.closest("[data-edit]");
            if (editBtn) {
                const tramo = editBtn.dataset.edit;
                const index = Number(editBtn.dataset.index);
                const gasto = state[tramo].gastos[index];
                const form = document.getElementById(`${tramo}GastoForm`);
                if (!form || !gasto) return;
                form.querySelector("[data-gasto-tipo]").value = gasto.tipoRaw;
                form.querySelector("[data-gasto-desc]").value = gasto.descripcion;
                form.querySelector("[data-gasto-monto]").value = gasto.monto;
                form.querySelector("[data-gasto-fecha]").value = gasto.fecha;
                state[tramo].editIndex = index;
                form.classList.add("is-open");
                return;
            }

            const deleteBtn = event.target.closest("[data-delete]");
            if (deleteBtn) {
                const tramo = deleteBtn.dataset.delete;
                const index = Number(deleteBtn.dataset.index);
                state[tramo].gastos.splice(index, 1);
                renderGastos(tramo);
            }
        });
    });


    // --- LOOKUP MODALS (Truck, Driver, Lots) ---
    const seleccion = {camionTramo: "ida", choferTramo: "ida"};
    let focusReturnTarget = null;

    const modalBuscarCamion = document.getElementById("modalBuscarCamionViaje");
    const modalBuscarChofer = document.getElementById("modalBuscarChoferViaje");
    const modalBuscarLote = document.getElementById("modalBuscarLoteViaje");

    const filtrosCamionesModal = {q: "", estado: ""};
    const paginacionCamionesModal = {page: 0, size: 10, totalPages: 1, totalElements: 0, sort: "idCamion,desc"};
    let camionesModalCache = [];
    let debounceCamionesModal = null;

    const filtrosChoferesModal = {q: "", estado: ""};
    const paginacionChoferesModal = {page: 0, size: 10, totalPages: 1, totalElements: 0, sort: "id,desc"};
    let choferesModalCache = [];
    let debounceChoferesModal = null;

    const filtrosLotesModal = {q: "", estado: ""};
    const paginacionLotesModal = {page: 0, size: 10, totalPages: 1, totalElements: 0, sort: "idLote,desc"};
    let lotesModalCache = [];
    let debounceLotesModal = null;

    const abrirModalCamion = tramo => {
        seleccion.camionTramo = tramo;
        if (!modalBuscarCamion) return;
        focusReturnTarget = document.activeElement;
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarCamion);
        modalInstance.show();
    };

    const abrirModalChofer = tramo => {
        seleccion.choferTramo = tramo;
        if (!modalBuscarChofer) return;
        focusReturnTarget = document.activeElement;
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarChofer);
        modalInstance.show();
    };

    const abrirModalLotes = async () => {
        if (!modalBuscarLote) return;
        focusReturnTarget = document.activeElement;
        await cargarCategoriasLoteModal();
        await cargarEstadosLoteModal();
        bootstrap.Modal.getOrCreateInstance(modalBuscarLote).show();
    };

    document.getElementById("btnBuscarCamionIda")?.addEventListener("click", () => abrirModalCamion("ida"));
    document.getElementById("btnBuscarCamionVuelta")?.addEventListener("click", () => abrirModalCamion("vuelta"));
    document.getElementById("btnBuscarChoferIda")?.addEventListener("click", () => abrirModalChofer("ida"));
    document.getElementById("btnBuscarChoferVuelta")?.addEventListener("click", () => abrirModalChofer("vuelta"));
    document.getElementById("btnAbrirModalBusquedaLotes")?.addEventListener("click", abrirModalLotes); // Override inline search button to use the search-modal instead

    // Close Lookup Modals blur targets
    [modalBuscarCamion, modalBuscarChofer, modalBuscarLote].forEach(modalEl => {
        if (!modalEl) return;
        modalEl.addEventListener("hide.bs.modal", () => {
            const active = document.activeElement;
            if (active && modalEl.contains(active)) active.blur();
        });
        modalEl.addEventListener("hidden.bs.modal", () => {
            if (focusReturnTarget) {
                focusReturnTarget.focus();
                focusReturnTarget = null;
            }
        });
    });

    // Populate Lookups
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

    // Camiones fetch & render
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
            query.set("excluirAsignados", "true");
            if (viajeId) query.set("viajeIdActual", viajeId);

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
                <td>${camion.id}</td>
                <td><span class="badge bg-secondary font-monospace">${escapeHtml(camion.placa || "-")}</span></td>
                <td>${escapeHtml(camion.modelo || "-")}</td>
                <td>${escapeHtml(camion.marca || "-")}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(camion.estadoCamion || "-")}</span></td>
                <td class="text-end">
                    <button type="button" class="btn btn-primary btn-sm px-3" data-select-camion="${camion.id}">
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

    // Choferes fetch & render
    const getRolText = usuario => {
        if (!usuario || usuario.rol == null) return "";
        if (typeof usuario.rol === "string") return usuario.rol;
        if (typeof usuario.rol === "object") return usuario.rol.nombre ?? usuario.rol.name ?? usuario.rol.rol ?? "";
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
            query.set("excluirAsignados", "true");
            if (viajeId) query.set("viajeIdActual", viajeId);

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
                <td>${usuario.id}</td>
                <td><strong>${escapeHtml(`${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || "-")}</strong></td>
                <td>${escapeHtml(usuario.email || "-")}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(usuario.estado || "-")}</span></td>
                <td class="text-end">
                    <button type="button" class="btn btn-primary btn-sm px-3" data-select-chofer="${usuario.id}">
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

    // Modal listeners & search debounce
    modalBuscarCamion?.addEventListener("shown.bs.modal", () => {
        cargarEstadosCamionModal();
        cargarCamionesViajeModal();
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

    // Selecting rows handlers
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


    // --- LOTS SELECTION MODAL (modalBuscarLoteViaje) ---
    async function cargarEstadosLoteModal() {
        const selectEstado = document.getElementById("filtroEstadoLotesViajeModal");
        if (!selectEstado) return;
        try {
            const res = await fetch("/api/lotes/estados");
            if (!res.ok) throw new Error("No se pudieron cargar estados de lote");
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

    async function cargarCategoriasLoteModal() {
        const selectCat = document.querySelector("#nuevoLoteInlineForm [data-lote-categoria]");
        if (!selectCat) return;
        if (selectCat.children.length > 1) return; // already loaded
        try {
            const res = await fetch("/api/categorias");
            if (!res.ok) throw new Error("No se pudieron cargar categorias de lote");
            const categorias = await res.json();
            selectCat.innerHTML = '<option value="">Seleccione categoria</option>';
            (Array.isArray(categorias) ? categorias : []).forEach(cat => {
                const option = document.createElement("option");
                option.value = String(cat.id);
                option.textContent = cat.nombre || `Cat #${cat.id}`;
                selectCat.appendChild(option);
            });
        } catch (error) {
            console.error(error);
        }
    }

    async function cargarLotesViajeModal() {
        const tbody = document.getElementById("tablaLotesViaje");
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Cargando lotes...</td></tr>';
        try {
            // Re-fetch available lots
            const res = await fetch("/api/lotes", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar lotes");
            const data = await res.json();
            lotesDisponibles = Array.isArray(data) ? data : [];
            renderLotesViajeModal();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error al cargar lotes</td></tr>';
        }
    }

    const getLotesFiltradosModal = () => {
        const query = filtrosLotesModal.q.toLowerCase();
        const estado = filtrosLotesModal.estado;
        const selectedIds = new Set(lotesSeleccionados.map(getLoteId).filter(Boolean));
        return (Array.isArray(lotesDisponibles) ? lotesDisponibles : [])
            .filter(l => !selectedIds.has(getLoteId(l)))
            .filter(l => !l.asignado || loteIdsIniciales.has(getLoteId(l)))
            .filter(l => {
                if (estado && l.estado !== estado) return false;
                if (!query) return true;
                const num = (l.numeroLote || "").toLowerCase();
                const enc = (l.nombreEncargado || "").toLowerCase();
                const desc = (l.descripcion || "").toLowerCase();
                return num.includes(query) || enc.includes(query) || desc.includes(query);
            });
    };

    function renderLotesViajeModal() {
        const tbody = document.getElementById("tablaLotesViaje");
        if (!tbody) return;
        const list = getLotesFiltradosModal();
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay lotes disponibles</td></tr>';
            return;
        }
        const tramoDefault = document.getElementById("tramoDefaultLoteViaje")?.value || "ida";
        tbody.innerHTML = list.map(l => {
            const id = getLoteId(l);
            const numero = l?.numeroLote || `Lote #${id}`;
            const est = String(l?.estado || "").replaceAll("_", " ");
            const cat = l?.categoriaNombre || l?.idCategoria || "-";
            const rem = l?.clienteRemitenteNombre || "-";
            const dest = l?.clienteDestinatarioNombre || "-";

            const btn = `<button type="button" class="btn btn-success btn-sm btn-seleccionar-lote-modal" data-id="${id}">Asociar</button>`;
            return `
                <tr>
                    <td>${id}</td>
                    <td><strong>${escapeHtml(numero)}</strong></td>
                    <td><span class="badge bg-secondary">${escapeHtml(est)}</span></td>
                    <td>${escapeHtml(cat)}</td>
                    <td>${escapeHtml(rem)}</td>
                    <td>${escapeHtml(dest)}</td>
                    <td style="min-width:100px;">
                        <select class="form-select form-select-sm" data-tramo-row="${escapeHtml(String(id))}">
                            <option value="ida" ${tramoDefault === 'ida' ? 'selected' : ''}>Ida</option>
                            <option value="vuelta" ${tramoDefault === 'vuelta' ? 'selected' : ''}>Vuelta</option>
                        </select>
                    </td>
                    <td>
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input" type="checkbox" id="pagadoRow_${escapeHtml(String(id))}" data-pagado-row="${escapeHtml(String(id))}">
                        </div>
                    </td>
                    <td class="text-end">${btn}</td>
                </tr>
            `;
        }).join("");
    }

    // Modal show trigger
    modalBuscarLote?.addEventListener("shown.bs.modal", () => {
        filtrosLotesModal.q = "";
        filtrosLotesModal.estado = "";
        document.getElementById("filtroBusquedaLotesViajeModal").value = "";
        document.getElementById("filtroEstadoLotesViajeModal").value = "";
        document.getElementById("nuevoLoteInlineForm").style.display = "none";
        cargarLotesViajeModal();
    });

    document.getElementById("filtroBusquedaLotesViajeModal")?.addEventListener("input", event => {
        clearTimeout(debounceLotesModal);
        debounceLotesModal = setTimeout(() => {
            filtrosLotesModal.q = event.target.value.trim();
            renderLotesViajeModal();
        }, 300);
    });

    document.getElementById("filtroEstadoLotesViajeModal")?.addEventListener("change", event => {
        filtrosLotesModal.estado = event.target.value || "";
        renderLotesViajeModal();
    });

    document.getElementById("tramoDefaultLoteViaje")?.addEventListener("change", () => {
        renderLotesViajeModal();
    });

    // Selecting rows lookups
    document.getElementById("tablaLotesViaje")?.addEventListener("click", event => {
        const btn = event.target.closest(".btn-seleccionar-lote-modal");
        if (!btn) return;
        const id = Number(btn.dataset.id);
        if (!id) return;
        if (lotesSeleccionados.some(l => getLoteId(l) === id)) return;
        const match = lotesDisponibles.find(l => getLoteId(l) === id);

        const tramoSel = document.querySelector(`[data-tramo-row="${id}"]`);
        const pagadoSel = document.querySelector(`[data-pagado-row="${id}"]`);
        const tramoElegido = tramoSel?.value || document.getElementById("tramoDefaultLoteViaje")?.value || "ida";
        const pagadoElegido = pagadoSel ? pagadoSel.checked : false;

        lotesSeleccionados.push({
            ...(match || {idLote: id, numeroLote: `Lote #${id}`}),
            tipoTramo: tramoElegido,
            pagado: pagadoElegido
        });
        renderLotesAsociados();
        renderLotesViajeModal();
    });

    // Inline lot creation within Lookup Modal
    document.getElementById("btnNuevoLoteDesdeViaje")?.addEventListener("click", async () => {
        const form = document.getElementById("nuevoLoteInlineForm");
        if (!form) return;
        if (form.style.display === "none") {
            form.style.display = "block";
            // Populate states & categories dropdowns
            const selectEstado = form.querySelector("[data-lote-estado]");
            if (selectEstado && selectEstado.children.length <= 1) {
                try {
                    const resEst = await fetch("/api/lotes/estados");
                    if (resEst.ok) {
                        const estados = await resEst.json();
                        selectEstado.innerHTML = '<option value="">Seleccione estado</option>';
                        estados.forEach(e => {
                            const option = document.createElement("option");
                            option.value = e;
                            option.textContent = String(e).replaceAll("_", " ");
                            selectEstado.appendChild(option);
                        });
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        } else {
            form.style.display = "none";
        }
    });

    document.getElementById("btnCancelarLoteInline")?.addEventListener("click", () => {
        document.getElementById("nuevoLoteInlineForm").style.display = "none";
    });

    document.getElementById("btnGuardarLoteInline")?.addEventListener("click", async () => {
        const container = document.getElementById("nuevoLoteInlineForm");
        if (!container) return;

        const numero = container.querySelector("[data-lote-numero]")?.value?.trim();
        const estado = container.querySelector("[data-lote-estado]")?.value;
        const idCategoria = Number(container.querySelector("[data-lote-categoria]")?.value) || 0;
        const idClienteRemitente = Number(container.querySelector("[data-lote-remitente]")?.value) || 0;
        const descripcion = container.querySelector("[data-lote-descripcion]")?.value || "";
        const peso = container.querySelector("[data-lote-peso]")?.value || null;
        const valorDeclarado = container.querySelector("[data-lote-valor]")?.value || null;
        const tipoTramoInline = container.querySelector("[data-lote-tramo-inline]")?.value || "ida";
        const pagadoInline = container.querySelector("[data-lote-pagado-inline]")?.checked ?? false;

        let valid = true;
        const checkField = (selector, condition) => {
            const el = container.querySelector(selector);
            if (!el) return;
            if (condition) {
                el.classList.add("is-invalid");
                valid = false;
            } else {
                el.classList.remove("is-invalid");
            }
        };

        checkField("[data-lote-numero]", !numero);
        checkField("[data-lote-estado]", !estado);
        checkField("[data-lote-categoria]", !idCategoria);
        checkField("[data-lote-remitente]", !idClienteRemitente);

        if (!valid) return;

        const payload = {
            numeroLote: numero,
            estado,
            idCategoria,
            idClienteRemitente,
            descripcion,
            peso: peso ? parseFloat(peso) : null,
            valorDeclarado: valorDeclarado ? parseFloat(valorDeclarado) : null
        };

        try {
            const headers = {"Content-Type": "application/json"};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;

            const res = await fetch("/api/lotes", {
                method: "POST",
                headers,
                credentials: "same-origin",
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Error al crear el lote");
            const nuevoLote = await res.json();

            lotesDisponibles.unshift(nuevoLote);
            lotesSeleccionados.push({
                ...nuevoLote,
                tipoTramo: tipoTramoInline,
                pagado: pagadoInline
            });

            renderLotesAsociados();
            renderLotesViajeModal();

            // Clear inline form
            container.querySelector("[data-lote-numero]").value = "";
            container.querySelector("[data-lote-estado]").value = "";
            container.querySelector("[data-lote-categoria]").value = "";
            container.querySelector("[data-lote-remitente]").value = "";
            container.querySelector("[data-lote-descripcion]").value = "";
            container.querySelector("[data-lote-peso]").value = "";
            container.querySelector("[data-lote-valor]").value = "";
            container.querySelector("[data-lote-tramo-inline]").value = "ida";
            container.querySelector("[data-lote-pagado-inline]").checked = false;
            container.style.display = "none";

            notify("success", "Lote creado y asociado con éxito.", "Viajes");
        } catch (error) {
            console.error(error);
            notify("error", `Error al crear lote inline: ${error.message}`, "Viajes");
        }
    });


    // --- FINANCIAL SUMMARY & CALCULATIONS ---
    const actualizarResumen = () => {
        let valorLotes = 0;
        lotesSeleccionados.forEach(l => {
            if (l.pagado) { // sum declared value only if marked as paid
                valorLotes += parseFloat(l.valorDeclarado || l.valor_declarado) || 0;
            }
        });

        const gastosIda = state.ida.gastos.reduce((acc, g) => acc + parseNumber(g.monto), 0);
        const gastosVuelta = state.vuelta.gastos.reduce((acc, g) => acc + parseNumber(g.monto), 0);
        const totalGastos = gastosIda + gastosVuelta;

        const ivaActivo = document.getElementById("ivaActivoResumen")?.checked ?? false;
        const ivaPorcentaje = parseNumber(document.getElementById("ivaPorcentaje")?.value || 13);
        const totalIva = ivaActivo ? (valorLotes * (ivaPorcentaje / 100)) : 0;
        const gananciaNeta = valorLotes - totalGastos - totalIva;

        document.getElementById("idaTotalGastos") ? document.getElementById("idaTotalGastos").textContent = formatMoney(gastosIda) : null;
        document.getElementById("vueltaTotalGastos") ? document.getElementById("vueltaTotalGastos").textContent = formatMoney(gastosVuelta) : null;

        document.getElementById("resumenValorLotes") ? document.getElementById("resumenValorLotes").textContent = formatMoney(valorLotes) : null;
        document.getElementById("resumenGastosIda") ? document.getElementById("resumenGastosIda").textContent = formatMoney(gastosIda) : null;
        document.getElementById("resumenGastosVuelta") ? document.getElementById("resumenGastosVuelta").textContent = formatMoney(gastosVuelta) : null;
        document.getElementById("totalGastado") ? document.getElementById("totalGastado").textContent = formatMoney(totalGastos) : null;
        document.getElementById("resumenIVA") ? document.getElementById("resumenIVA").textContent = formatMoney(totalIva) : null;
        document.getElementById("resumenGanancia") ? document.getElementById("resumenGanancia").textContent = formatMoney(gananciaNeta) : null;
        document.getElementById("resumenLotes") ? document.getElementById("resumenLotes").textContent = String(lotesSeleccionados.length) : null;
    };

    document.getElementById("ivaActivoResumen")?.addEventListener("change", event => {
        const active = event.target.checked;
        const ivaPorcentajeInput = document.getElementById("ivaPorcentaje");
        if (ivaPorcentajeInput) {
            ivaPorcentajeInput.disabled = !active;
        }
        actualizarResumen();
    });

    document.getElementById("ivaPorcentaje")?.addEventListener("input", () => {
        actualizarResumen();
    });


    // --- DURATIONS CALCULATION ---
    const actualizarDuraciones = () => {
        const calcularParaTramo = tramo => {
            const salidaVal = document.getElementById(`${tramo}Salida`)?.value;
            const llegadaVal = document.getElementById(`${tramo}Llegada`)?.value;
            const el = document.getElementById(`${tramo}Duracion`);
            if (el) el.textContent = formatDurationHuman(salidaVal, llegadaVal);
        };
        calcularParaTramo("ida");
        calcularParaTramo("vuelta");
    };

    document.getElementById("idaSalida")?.addEventListener("input", actualizarDuraciones);
    document.getElementById("idaLlegada")?.addEventListener("input", actualizarDuraciones);
    document.getElementById("vueltaSalida")?.addEventListener("input", actualizarDuraciones);
    document.getElementById("vueltaLlegada")?.addEventListener("input", actualizarDuraciones);


    // --- USAR MISMOS DATOS Toggle ---
    usarMismosDatos?.addEventListener("change", () => {
        const disabled = usarMismosDatos.checked;
        const camposVuelta = document.querySelectorAll("#tab-vuelta input, #tab-vuelta select, #tab-vuelta button, #tab-vuelta textarea");
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

            document.getElementById("vueltaPaisSalida").value = document.getElementById("idaPaisSalida").value;
            document.getElementById("vueltaPaisDestino").value = document.getElementById("idaPaisDestino").value;
            document.getElementById("vueltaDireccionSalida").value = document.getElementById("idaDireccionSalida").value;
            document.getElementById("vueltaDireccionDestino").value = document.getElementById("idaDireccionDestino").value;
            document.getElementById("vueltaObservaciones").value = document.getElementById("idaObservaciones").value;
            document.getElementById("vueltaEstado").value = document.getElementById("idaEstado").value;
            document.getElementById("vueltaPagado").checked = document.getElementById("idaPagado").checked;

            state.vuelta.gastos = state.ida.gastos.map(g => ({...g}));
            renderGastos("vuelta");
            actualizarDuraciones();
        }
    });


    // --- RESET FORM ---
    const resetFormulario = () => {
        viajeForm?.reset();
        delete viajeForm.dataset.viajeId;
        document.getElementById("idaCamionId").value = "";
        document.getElementById("idaChoferId").value = "";
        document.getElementById("vueltaCamionId").value = "";
        document.getElementById("vueltaChoferId").value = "";
        state.ida.detalleId = 0;
        state.vuelta.detalleId = 0;
        state.ida.gastos = [];
        state.vuelta.gastos = [];
        lotesSeleccionados = [];
        lotesPendientesConDatos = [];
        renderLotesAsociados();
        renderGastos("ida");
        renderGastos("vuelta");
        actualizarDuraciones();
        if (btnEliminarViaje) btnEliminarViaje.style.display = "none";
        if (usarMismosDatos) {
            usarMismosDatos.checked = false;
            const camposVuelta = document.querySelectorAll("#tab-vuelta input, #tab-vuelta select, #tab-vuelta button, #tab-vuelta textarea");
            camposVuelta.forEach(el => {
                if (!el.classList.contains("tab-button")) el.disabled = false;
            });
        }
    };


    // --- FORM VALIDATION ---
    const validarFormulario = () => {
        let valido = true;
        const errores = [];
        const requeridos = [
            {id: "nombreViaje", label: "Nombre del viaje"},
            {id: "idaCamionInput", label: "Camion (ida)"},
            {id: "idaChoferInput", label: "Chofer (ida)"},
            {id: "idaSalida", label: "Fecha salida (ida)"},
            {id: "idaLlegada", label: "Fecha llegada (ida)"}
        ];
        requeridos.forEach(({id, label}) => {
            const input = document.getElementById(id);
            if (!input) return;
            if (!input.value || !input.value.trim()) {
                input.classList.add("is-invalid");
                errores.push(label);
                valido = false;
            } else {
                input.classList.remove("is-invalid");
            }
        });

        const nombreViaje = document.getElementById("nombreViaje");
        if (nombreViaje && nombreViaje.value.trim()) {
            if (nombreViaje.value.trim().length < 3) {
                nombreViaje.classList.add("is-invalid");
                errores.push("El nombre del viaje debe tener al menos 3 caracteres");
                valido = false;
            } else if (nombreViaje.value.trim().length > 100) {
                nombreViaje.classList.add("is-invalid");
                errores.push("El nombre del viaje no puede exceder 100 caracteres");
                valido = false;
            }
        }

        const idaCamion = document.getElementById("idaCamionId")?.value;
        const idaChofer = document.getElementById("idaChoferId")?.value;
        if (!idaCamion) {
            document.getElementById("idaCamionInput")?.classList.add("is-invalid");
            if (!errores.includes("Camion (ida)")) errores.push("Selecciona un camion para ida");
            valido = false;
        }
        if (!idaChofer) {
            document.getElementById("idaChoferInput")?.classList.add("is-invalid");
            if (!errores.includes("Chofer (ida)")) errores.push("Selecciona un chofer para ida");
            valido = false;
        }

        const idaSalida = document.getElementById("idaSalida")?.value;
        const idaLlegada = document.getElementById("idaLlegada")?.value;
        if (idaSalida && idaLlegada) {
            const dSalida = new Date(idaSalida);
            const dLlegada = new Date(idaLlegada);
            if (dSalida >= dLlegada) {
                document.getElementById("idaSalida")?.classList.add("is-invalid");
                document.getElementById("idaLlegada")?.classList.add("is-invalid");
                errores.push("La fecha de salida (ida) debe ser anterior a la de llegada");
                valido = false;
            }
        }

        const idaEstado = document.getElementById("idaEstado");
        if (idaEstado && !idaEstado.value) {
            idaEstado.classList.add("is-invalid");
            errores.push("Selecciona un estado para el tramo de ida");
            valido = false;
        } else if (idaEstado) {
            idaEstado.classList.remove("is-invalid");
        }

        // Validate vuelta tramo if it has data
        const vueltaInputs = ["vueltaCamionId", "vueltaChoferId", "vueltaSalida", "vueltaLlegada"];
        const vueltaTieneDatos = vueltaInputs.some(id => {
            const el = document.getElementById(id);
            return Boolean(el?.value);
        }) || state.vuelta.gastos.length > 0;

        if (vueltaTieneDatos) {
            const vueltaSalida = document.getElementById("vueltaSalida")?.value;
            const vueltaLlegada = document.getElementById("vueltaLlegada")?.value;
            if (vueltaSalida && vueltaLlegada) {
                const dSalida = new Date(vueltaSalida);
                const dLlegada = new Date(vueltaLlegada);
                if (dSalida >= dLlegada) {
                    document.getElementById("vueltaSalida")?.classList.add("is-invalid");
                    document.getElementById("vueltaLlegada")?.classList.add("is-invalid");
                    errores.push("La fecha de salida (vuelta) debe ser anterior a la de llegada");
                    valido = false;
                }
            }

            const vueltaEstado = document.getElementById("vueltaEstado");
            if (vueltaEstado && !vueltaEstado.value) {
                vueltaEstado.classList.add("is-invalid");
                errores.push("Selecciona un estado para el tramo de vuelta");
                valido = false;
            } else if (vueltaEstado) {
                vueltaEstado.classList.remove("is-invalid");
            }

            const vueltaCamion = document.getElementById("vueltaCamionId")?.value;
            const vueltaChofer = document.getElementById("vueltaChoferId")?.value;
            if (!vueltaCamion) {
                document.getElementById("vueltaCamionInput")?.classList.add("is-invalid");
                errores.push("Selecciona un camion para vuelta");
                valido = false;
            }
            if (!vueltaChofer) {
                document.getElementById("vueltaChoferInput")?.classList.add("is-invalid");
                errores.push("Selecciona un chofer para vuelta");
                valido = false;
            }
        } else {
            const vueltaEstado = document.getElementById("vueltaEstado");
            if (vueltaEstado) vueltaEstado.classList.remove("is-invalid");
        }

        if (!valido && estadoGuardado) {
            estadoGuardado.textContent = errores.length <= 2
                ? errores.join(". ")
                : `${errores.length} campos con errores. Revisa el formulario.`;
            estadoGuardado.className = "estado-guardado text-danger";
        }
        return valido;
    };


    // --- BUILD JSON PAYLOAD ---
    const buildPayload = () => {
        const estadoIda = document.getElementById("idaEstado")?.value || null;
        const estadoVuelta = document.getElementById("vueltaEstado")?.value || null;
        const iva = document.getElementById("ivaActivoResumen")?.checked ?? false;

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
            const pagado = document.getElementById(`${tramo}Pagado`)?.checked ?? false;

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
                tipoTramo: String(tramo).toLowerCase(),
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
        if (tramoIda) tramos.push(tramoIda);
        const tramoVuelta = buildTramo("vuelta");
        if (tramoVuelta) tramos.push(tramoVuelta);

        return {
            id_vieje: Number(viajeId) || 0,
            nombreViaje: document.getElementById("nombreViaje")?.value || "",
            loteIds: lotesSeleccionados.map(getLoteId).filter(Boolean),
            lotes: lotesSeleccionados.map(l => ({
                id: getLoteId(l),
                tipoTramo: l.tipoTramo || "ida",
                pagado: Boolean(l.pagado)
            })),
            tramos
        };
    };


    // --- LOAD TRIP DETAILS ---
    async function cargarViajeDetalle(idViaje) {
        if (!viajeForm) return;
        if (estadoGuardado) {
            estadoGuardado.textContent = "Cargando...";
            estadoGuardado.className = "estado-guardado text-secondary";
        }
        if (btnGuardarViaje) btnGuardarViaje.disabled = true;
        try {
            await ensureTiposGastoCache();
            if (!estadosViajeCargados) await cargarEstadosViaje();
            if (!paisesCargados) await cargarPaises();
            await cargarLotesDisponibles();

            const res = await fetch(`/api/viajes/${idViaje}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudo cargar el viaje");
            const data = await res.json();

            resetFormulario();

            viajeForm.dataset.viajeId = idViaje;
            document.getElementById("nombreViaje").value = data.nombreViaje || "";

            // Lotes
            loteIdsPendientes = Array.isArray(data.loteIds) ? data.loteIds.map(Number).filter(Boolean) : [];
            lotesPendientesConDatos = Array.isArray(data.lotes)
                ? data.lotes.map(l => ({
                    id: Number(l.id || l.idLote),
                    tipoTramo: l.tipoTramo || "ida",
                    pagado: Boolean(l.pagado)
                  }))
                : loteIdsPendientes.map(id => ({id, tipoTramo: "ida", pagado: false}));
            loteIdsIniciales = new Set(loteIdsPendientes);

            syncLotesPendientes();

            const tramos = Array.isArray(data.tramos) ? data.tramos : [];
            const tramoIda = tramos.find(t => String(t.tipoTramo).toLowerCase() === "ida");
            const tramoVuelta = tramos.find(t => String(t.tipoTramo).toLowerCase() === "vuelta");

            const tramoBase = tramoIda || tramoVuelta;
            if (tramoBase) {
                const ivaCheckbox = document.getElementById("ivaActivoResumen");
                if (ivaCheckbox) {
                    ivaCheckbox.checked = Boolean(tramoBase.iva);
                    const ivaPorcentajeElement = document.getElementById("ivaPorcentaje");
                    if (ivaPorcentajeElement) ivaPorcentajeElement.disabled = !tramoBase.iva;
                }
            }

            if (tramoIda) {
                state.ida.detalleId = Number(tramoIda.id) || 0;
                document.getElementById("idaEstado").value = tramoIda.estadoViaje || "";
                document.getElementById("idaCamionId").value = tramoIda.idCamion || "";
                document.getElementById("idaCamionInput").value = tramoIda.camionPlaca ? `${tramoIda.camionNombre || ""} (${tramoIda.camionPlaca})` : "";
                document.getElementById("idaChoferId").value = tramoIda.idConductor || "";
                document.getElementById("idaChoferInput").value = tramoIda.conductorNombre || "";
                document.getElementById("idaSalida").value = formatDateTimeLocal(tramoIda.fechaSalida);
                document.getElementById("idaLlegada").value = formatDateTimeLocal(tramoIda.fechaEntrada);
                document.getElementById("idaPaisSalida").value = tramoIda.paisSalida || "";
                document.getElementById("idaPaisDestino").value = tramoIda.paisDestino || "";
                document.getElementById("idaDireccionSalida").value = tramoIda.direccionSalida || "";
                document.getElementById("idaDireccionDestino").value = tramoIda.direccionDestino || "";
                document.getElementById("idaObservaciones").value = tramoIda.observaciones || "";
                document.getElementById("idaPagado").checked = Boolean(tramoIda.pagado);

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
                document.getElementById("vueltaCamionInput").value = tramoVuelta.camionPlaca ? `${tramoVuelta.camionNombre || ""} (${tramoVuelta.camionPlaca})` : "";
                document.getElementById("vueltaChoferId").value = tramoVuelta.idConductor || "";
                document.getElementById("vueltaChoferInput").value = tramoVuelta.conductorNombre || "";
                document.getElementById("vueltaSalida").value = formatDateTimeLocal(tramoVuelta.fechaSalida);
                document.getElementById("vueltaLlegada").value = formatDateTimeLocal(tramoVuelta.fechaEntrada);
                document.getElementById("vueltaPaisSalida").value = tramoVuelta.paisSalida || "";
                document.getElementById("vueltaPaisDestino").value = tramoVuelta.paisDestino || "";
                document.getElementById("vueltaDireccionSalida").value = tramoVuelta.direccionSalida || "";
                document.getElementById("vueltaDireccionDestino").value = tramoVuelta.direccionDestino || "";
                document.getElementById("vueltaObservaciones").value = tramoVuelta.observaciones || "";
                document.getElementById("vueltaPagado").checked = Boolean(tramoVuelta.pagado);

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
            if (btnEliminarViaje) btnEliminarViaje.style.display = "inline-block";
            if (estadoGuardado) {
                estadoGuardado.textContent = "";
            }
        } catch (error) {
            console.error(error);
            if (estadoGuardado) {
                estadoGuardado.textContent = "Error al cargar el viaje.";
                estadoGuardado.className = "estado-guardado text-danger";
            }
        } finally {
            if (btnGuardarViaje) btnGuardarViaje.disabled = false;
        }
    }

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


    // --- SAVE / UPDATE ---
    viajeForm?.addEventListener("submit", async event => {
        event.preventDefault();
        if (estadoGuardado) estadoGuardado.textContent = "";
        viajeForm.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));

        if (!validarFormulario()) return;

        if (estadoGuardado) {
            estadoGuardado.textContent = "Guardando...";
            estadoGuardado.className = "estado-guardado text-secondary";
        }
        if (btnGuardarViaje) btnGuardarViaje.disabled = true;

        const payload = buildPayload();
        const url = viajeId ? `/api/viajes/${viajeId}` : "/api/viajes";
        const method = viajeId ? "PUT" : "POST";

        try {
            const headers = {"Content-Type": "application/json"};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;

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
                    throw new Error(err?.message || err?.error || "Error al guardar");
                } else {
                    const errorText = await res.text().catch(() => "");
                    throw new Error(errorText || "Error al guardar");
                }
            }

            if (estadoGuardado) {
                estadoGuardado.textContent = "Guardado correctamente";
                estadoGuardado.className = "estado-guardado text-success ok";
            }
            notify("success", "Viaje guardado correctamente.", "Viajes");
            // Redirect back to list
            setTimeout(() => {
                window.location.href = "/viajes";
            }, 800);
        } catch (error) {
            console.error(error);
            const msg = error.message || "Verifica los datos e intenta de nuevo";
            if (estadoGuardado) {
                estadoGuardado.textContent = msg;
                estadoGuardado.className = "estado-guardado text-danger error";
            }
            notify("error", msg, "Viajes");
        } finally {
            if (btnGuardarViaje) btnGuardarViaje.disabled = false;
        }
    });


    // --- DELETE ---
    btnEliminarViaje?.addEventListener("click", async () => {
        if (!viajeId) return;
        if (!confirm("¿Está seguro de eliminar este viaje? Esta acción no se puede deshacer.")) return;
        btnEliminarViaje.disabled = true;
        try {
            const headers = {};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;

            const res = await fetch(`/api/viajes/${viajeId}`, {
                method: "DELETE",
                headers,
                credentials: "same-origin"
            });
            if (!res.ok) throw new Error("Error al eliminar el viaje");

            notify("success", "Viaje eliminado correctamente", "Viajes");
            setTimeout(() => {
                window.location.href = "/viajes";
            }, 800);
        } catch (error) {
            console.error(error);
            alert(`Error al eliminar: ${error.message}`);
            btnEliminarViaje.disabled = false;
        }
    });


    // --- INITIALIZATION ON LOAD ---
    const urlParams = new URLSearchParams(window.location.search);
    const viajeId = urlParams.get('id');

    const initPage = async () => {
        if (!estadosViajeCargados) await cargarEstadosViaje();
        if (!paisesCargados) await cargarPaises();
        if (!tiposGastoCargados) await cargarTiposGasto();
        await cargarLotesDisponibles();

        if (viajeId) {
            formTitle.textContent = "Editar viaje";
            await cargarViajeDetalle(viajeId);
        } else {
            formTitle.textContent = "Agregar viaje";
            resetFormulario();
        }
    };

    initPage();
});
