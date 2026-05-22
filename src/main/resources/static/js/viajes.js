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
    let loteIdsIniciales = new Set();
    let paisesCargados = false;
    let lotesCargados = false;
    let editLoteCurrentData = null;

    const getLoteId = lote => Number(lote?.idLote ?? lote?.id_lote ?? lote?.id);

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
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay lotes disponibles que coincidan.</td></tr>';
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
                    <button class="btn btn-sm btn-success btn-seleccionar-lote" data-id="${id}">Seleccionar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-seleccionar-lote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                const lote = lotesDisponibles.find(l => getLoteId(l) === id);
                if (lote) {
                    lotesSeleccionados.push(lote);
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

    document.getElementById("btnCerrarModalBusquedaLotes")?.addEventListener("click", () => {
        modalBusquedaLotesInstancia?.hide();
    });

    document.getElementById("filtroModalLotes")?.addEventListener("input", (e) => {
        renderTablaBusquedaLotes(e.target.value);
    });

    const renderLotesAsociados = () => {
        const cont = document.getElementById("lotesAsociados");
        if (!cont) return;

        cont.innerHTML = "";
        if (!lotesSeleccionados.length) {
            actualizarResumen();
            return;
        }

        lotesSeleccionados.forEach(lote => {
            const id = getLoteId(lote);
            const numero = lote?.numeroLote || `Lote #${id || "-"}`;

            const wrapper = document.createElement("div");
            wrapper.className = "d-inline-flex flex-column gap-1";

            const chip = document.createElement("span");
            chip.className = "badge bg-primary d-inline-flex align-items-center gap-2";
            chip.style.cursor = "default";
            chip.textContent = numero;

            const btnEdit = document.createElement("button");
            btnEdit.type = "button";
            btnEdit.className = "btn btn-sm btn-info text-white p-0 px-1";
            btnEdit.style.fontSize = "10px";
            btnEdit.innerHTML = "&#9998;"; // Pencil icon
            btnEdit.title = "Editar Lote";
            btnEdit.addEventListener("click", () => {
                abrirFormularioLote(id);
            });

            const btnRemove = document.createElement("button");
            btnRemove.type = "button";
            btnRemove.className = "btn btn-sm btn-light p-0 px-1";
            btnRemove.style.fontSize = "10px";
            btnRemove.textContent = "x";
            btnRemove.setAttribute("aria-label", `Quitar ${numero}`);
            btnRemove.addEventListener("click", () => {
                lotesSeleccionados = lotesSeleccionados.filter(l => getLoteId(l) !== id);
                renderLotesAsociados();
            });

            chip.appendChild(btnEdit);
            chip.appendChild(btnRemove);
            wrapper.appendChild(chip);
            cont.appendChild(wrapper);
        });

        actualizarResumen();
    };

    const abrirFormularioLote = async (idLote) => {
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
                // Fetch states if empty
                if (estadoSelect.options.length <= 1) {
                    const estRes = await fetch("/api/lotes/estados");
                    if (estRes.ok) {
                        const estados = await estRes.json();
                        estadoSelect.innerHTML = '<option value="">Seleccione</option>';
                        estados.forEach(e => {
                            const opt = document.createElement("option");
                            opt.value = e;
                            opt.textContent = e.replaceAll("_", " ");
                            estadoSelect.appendChild(opt);
                        });
                    }
                }
                estadoSelect.value = editLoteCurrentData.estado || "";
            }

            document.getElementById("loteEditFormContainer").style.display = "block";
        } catch(error) {
            console.error(error);
            alert("Error al cargar la información del lote para editar.");
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
        btn.textContent = "Guardando...";

        try {
            editLoteCurrentData.estado = document.getElementById("editLoteEstado").value;
            editLoteCurrentData.peso = parseFloat(document.getElementById("editLotePeso").value) || 0;
            editLoteCurrentData.valorDeclarado = parseFloat(document.getElementById("editLoteValor").value) || 0;
            editLoteCurrentData.nombreEncargado = document.getElementById("editLoteEncargado").value;
            editLoteCurrentData.descripcion = document.getElementById("editLoteDescripcion").value;

            const res = await fetch(`/api/lotes/${idLote}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(csrfHeader && csrfToken ? {[csrfHeader]: csrfToken} : {})
                },
                body: JSON.stringify(editLoteCurrentData)
            });

            if (!res.ok) throw new Error("Error al guardar lote");

            const updatedLote = await res.json();

            // Update in lists
            const listIndex = lotesDisponibles.findIndex(l => getLoteId(l) === Number(idLote));
            if (listIndex >= 0) lotesDisponibles[listIndex] = updatedLote;

            const selIndex = lotesSeleccionados.findIndex(l => getLoteId(l) === Number(idLote));
            if (selIndex >= 0) {
                // Merge data
                lotesSeleccionados[selIndex] = {...lotesSeleccionados[selIndex], ...updatedLote};
            }

            document.getElementById("loteEditFormContainer").style.display = "none";
            editLoteCurrentData = null;
            renderLotesAsociados(); // This triggers actualizarResumen
            alert("Lote actualizado con éxito.");

        } catch(error) {
            console.error(error);
            alert("Ocurrió un error al guardar el lote.");
        } finally {
            btn.disabled = false;
            btn.textContent = "Guardar Lote";
        }
    });

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
        const ivaCheckbox = document.getElementById("ivaActivoResumen");
        if (ivaCheckbox) {
            ivaCheckbox.checked = true;
            ivaCheckbox.removeAttribute('data-init');
            const ivaPorcentajeElement = document.getElementById("ivaPorcentaje");
            if (ivaPorcentajeElement) ivaPorcentajeElement.disabled = false;
        }
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
        // Limpiar estados de validacion previos
        modal?.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        if (!tiposGastoCargados) cargarTiposGasto();
        if (!estadosViajeCargados) cargarEstadosViaje();
        if (!paisesCargados) cargarPaises();
        cargarLotesDisponibles();
        if (modalTitle) {
            modalTitle.textContent = viajeId ? "Editar viaje" : "Agregar viaje";
        }
        const btnEliminar = document.getElementById("btnEliminarViaje");
        if (viajeForm) {
            if (viajeId) {
                viajeForm.dataset.viajeId = viajeId;
                if (btnEliminar) btnEliminar.style.display = "inline-block";
                cargarViajeDetalle(viajeId);
            } else {
                delete viajeForm.dataset.viajeId;
                if (btnEliminar) btnEliminar.style.display = "none";
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

        let valorLotes = 0;
        lotesSeleccionados.forEach(lote => {
            const valor = parseFloat(lote.valorDeclarado || lote.valor_declarado) || 0;
            valorLotes += valor;
        });

        const ivaCheckbox = document.getElementById("ivaActivoResumen");
        // Force default to checked if not initialized
        if (ivaCheckbox && ivaCheckbox.getAttribute('data-init') !== 'true') {
            ivaCheckbox.checked = true;
            ivaCheckbox.setAttribute('data-init', 'true');
        }

        const ivaActivo = ivaCheckbox?.checked ?? true;
        const ivaPorcentajeElement = document.getElementById("ivaPorcentaje");
        if (ivaPorcentajeElement) ivaPorcentajeElement.disabled = !ivaActivo;

        const ivaPorcentaje = parseFloat(ivaPorcentajeElement?.value) || 13;

        const ivaMonto = ivaActivo ? (valorLotes * (ivaPorcentaje / 100)) : 0;
        const gananciaNeta = valorLotes - totalGastos - ivaMonto;

        const elGastosIda = document.getElementById("resumenGastosIda");
        const elGastosVuelta = document.getElementById("resumenGastosVuelta");
        const totalGastado = document.getElementById("totalGastado");
        const resumenLotes = document.getElementById("resumenLotes");
        const elValorLotes = document.getElementById("resumenValorLotes");
        const elIva = document.getElementById("resumenIVA");
        const elGanancia = document.getElementById("resumenGanancia");

        if (elGastosIda) elGastosIda.textContent = formatMoney(gastosIda);
        if (elGastosVuelta) elGastosVuelta.textContent = formatMoney(gastosVuelta);
        if (totalGastado) totalGastado.textContent = formatMoney(totalGastos);
        if (resumenLotes) resumenLotes.textContent = String(lotesSeleccionados.length);
        if (elValorLotes) elValorLotes.textContent = formatMoney(valorLotes);
        if (elIva) elIva.textContent = formatMoney(ivaMonto);
        if (elGanancia) elGanancia.textContent = formatMoney(gananciaNeta);

        const idaTotal = document.getElementById("idaTotalGastos");
        const vueltaTotal = document.getElementById("vueltaTotalGastos");
        if (idaTotal) idaTotal.textContent = formatMoney(gastosIda);
        if (vueltaTotal) vueltaTotal.textContent = formatMoney(gastosVuelta);
    };

    // Listeners para actualizar resumen cuando cambia el IVA
    document.getElementById("ivaActivoResumen")?.addEventListener("change", function() {
        const inputIva = document.getElementById("ivaPorcentaje");
        if (inputIva) inputIva.disabled = !this.checked;
        actualizarResumen();
    });

    document.getElementById("ivaPorcentaje")?.addEventListener("input", actualizarResumen);

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

    const paginacionClientesModal = {page: 0, size: 10, totalPages: 1, totalElements: 0};
    const filtrosClientesModal = {q: ""};
    let clientesModalCache = [];
    let debounceClientesModal = null;

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

            let valorTotalLotes = 0;
            lotes.forEach(l => {
                valorTotalLotes += parseFloat(l.valorDeclarado || l.valor_declarado) || 0;
            });
            const ivaCalculado = valorTotalLotes * 0.13; // default 13% for card view
            const gananciaCalculada = valorTotalLotes - gastoNumero - ivaCalculado;

            ingresosPagina += valorTotalLotes;
            gananciaPagina += gananciaCalculada;


            const hasIda = !!ida;
            const hasVuelta = !!vuelta;
            const ruta = [ida?.paisSalida, ida?.paisDestino, vuelta?.paisDestino].filter(Boolean).join(" → ") || "-";

            // Determine main status badge
            let mainStatusLabel = estadoIdaLabel;
            let mainStatusClass = estadoIdaKey ? `status-${escapeHtml(estadoIdaKey)}` : "";
            if (estadoIdaKey === "completado" && hasVuelta) {
                mainStatusLabel = estadoVueltaLabel;
                mainStatusClass = estadoVueltaKey ? `status-${escapeHtml(estadoVueltaKey)}` : "";
            }

            return `
    <tr class="align-middle" data-viaje-id="${escapeHtml(idViaje)}">
        <td class="px-3">
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
        <td class="px-3 text-center">
            <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-light border trip-card-action-btn" title="Editar Viaje"
                    data-viaje-action="edit" data-viaje-id="${escapeHtml(idViaje)}">
                    <i class="fas fa-edit text-primary"></i>
                </button>
                <button type="button" class="btn btn-light border trip-card-action-btn" title="Ver Detalles"
                    data-viaje-action="view" data-viaje-id="${escapeHtml(idViaje)}">
                    <i class="fas fa-eye text-secondary"></i>
                </button>
            </div>
        </td>
    </tr>
`;
        }).join("");

        if (viajesCache.length === 0) {
            listaViajes.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron viajes.</td></tr>`;
        }

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
        // Ocultar el formulario inline si estaba abierto
        const inlineForm = document.getElementById("nuevoLoteInlineForm");
        if (inlineForm) inlineForm.style.display = "none";
        bootstrap.Modal.getOrCreateInstance(modalBuscarLote).show();
    };

    // Crear lote inline desde el modal de lotes (sin salir del viaje)
    let categoriasLoteCache = [];
    let categoriasLoteCargadas = false;

    const cargarCategoriasLote = async () => {
        if (categoriasLoteCargadas) return;
        try {
            const res = await fetch("/api/categorias", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar categorias");
            categoriasLoteCache = await res.json();
            categoriasLoteCargadas = true;
        } catch (e) { console.error(e); }
    };

    const abrirFormularioNuevoLote = async () => {
        await cargarCategoriasLote();
        await cargarEstadosLoteModal();
        const container = document.getElementById("nuevoLoteInlineForm");
        if (!container) return;

        // Cargar categorias en el select
        const catSelect = container.querySelector("[data-lote-categoria]");
        if (catSelect && categoriasLoteCache.length) {
            catSelect.innerHTML = '<option value="">Seleccione categoria</option>';
            categoriasLoteCache.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id || c.idCategoria;
                opt.textContent = c.nombre;
                catSelect.appendChild(opt);
            });
        }

        // Cargar estados de lote
        const estadoSelect = container.querySelector("[data-lote-estado]");
        if (estadoSelect) {
            try {
                const res = await fetch("/api/lotes/estados", {credentials: "same-origin"});
                if (res.ok) {
                    const estados = await res.json();
                    estadoSelect.innerHTML = '<option value="">Seleccione estado</option>';
                    (Array.isArray(estados) ? estados : []).forEach(e => {
                        const opt = document.createElement("option");
                        opt.value = e;
                        opt.textContent = String(e).replaceAll("_", " ");
                        estadoSelect.appendChild(opt);
                    });
                }
            } catch (e) { console.error(e); }
        }

        container.style.display = "block";
        container.querySelector("[data-lote-numero]")?.focus();
    };

    // Handler para guardar lote inline
    document.getElementById("btnGuardarLoteInline")?.addEventListener("click", async () => {
        const container = document.getElementById("nuevoLoteInlineForm");
        if (!container) return;

        const numero = container.querySelector("[data-lote-numero]")?.value?.trim();
        const estado = container.querySelector("[data-lote-estado]")?.value;
        const idCategoria = container.querySelector("[data-lote-categoria]")?.value;
        const idClienteRemitente = container.querySelector("[data-lote-remitente]")?.value;
        const descripcion = container.querySelector("[data-lote-descripcion]")?.value || "";
        const peso = container.querySelector("[data-lote-peso]")?.value || null;
        const valorDeclarado = container.querySelector("[data-lote-valor]")?.value || null;

        // Validar campos obligatorios
        let valid = true;
        if (!numero) { container.querySelector("[data-lote-numero]")?.classList.add("is-invalid"); valid = false; }
        else { container.querySelector("[data-lote-numero]")?.classList.remove("is-invalid"); }
        if (!estado) { container.querySelector("[data-lote-estado]")?.classList.add("is-invalid"); valid = false; }
        else { container.querySelector("[data-lote-estado]")?.classList.remove("is-invalid"); }
        if (!idCategoria) { container.querySelector("[data-lote-categoria]")?.classList.add("is-invalid"); valid = false; }
        else { container.querySelector("[data-lote-categoria]")?.classList.remove("is-invalid"); }
        if (!idClienteRemitente) { container.querySelector("[data-lote-remitente]")?.classList.add("is-invalid"); valid = false; }
        else { container.querySelector("[data-lote-remitente]")?.classList.remove("is-invalid"); }
        if (!valid) return;

        try {
            const headers = {"Content-Type": "application/json"};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;
            const body = {
                numeroLote: numero,
                estado,
                idCategoria: Number(idCategoria),
                idClienteRemitente: Number(idClienteRemitente),
                descripcion,
                peso: peso ? Number(peso) : null,
                valorDeclarado: valorDeclarado ? Number(valorDeclarado) : null
            };
            const res = await fetch("/api/lotes", {
                method: "POST", headers, credentials: "same-origin",
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "Error al crear lote");
            }
            const nuevoLote = await res.json();
            // Agregar el nuevo lote a la lista y seleccionarlo automaticamente
            lotesDisponibles.unshift(nuevoLote);
            lotesSeleccionados.push(nuevoLote);
            renderLotesAsociados();
            renderLotesViajeModal();
            // Limpiar y cerrar formulario inline
            container.style.display = "none";
            container.querySelectorAll("input, select, textarea").forEach(el => {
                if (el.tagName === "SELECT") el.selectedIndex = 0;
                else el.value = "";
                el.classList.remove("is-invalid");
            });
            alert("Lote creado y asociado al viaje");
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        }
    });

    document.getElementById("btnCancelarLoteInline")?.addEventListener("click", () => {
        const container = document.getElementById("nuevoLoteInlineForm");
        if (container) container.style.display = "none";
    });

    // El usuario espera que el boton "+ Agregar" abra el modal de lotes.
    document.getElementById("btnAgregarLote")?.addEventListener("click", abrirModalLotes);
    document.getElementById("btnNuevoLoteDesdeViaje")?.addEventListener("click", () => {
        abrirFormularioNuevoLote();
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
            loteIdsIniciales = new Set(loteIdsPendientes);
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
                const ivaCheckbox = document.getElementById("ivaActivoResumen");
                if (ivaCheckbox) {
                    ivaCheckbox.checked = Boolean(tramoBase.iva);
                    ivaCheckbox.setAttribute('data-init', 'true');
                    const ivaPorcentajeElement = document.getElementById("ivaPorcentaje");
                    if (ivaPorcentajeElement) ivaPorcentajeElement.disabled = !tramoBase.iva;
                }
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

            query.set("excluirAsignados", "true");
            const viajeForm = document.getElementById("viajeForm");
            const viajeId = viajeForm?.dataset.viajeId;
            if (viajeId) {
                query.set("viajeIdActual", viajeId);
            }

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

            query.set("excluirAsignados", "true");
            const viajeForm = document.getElementById("viajeForm");
            const viajeId = viajeForm?.dataset.viajeId;
            if (viajeId) {
                query.set("viajeIdActual", viajeId);
            }

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

        // Validar nombre de viaje longitud
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

        // Validar fechas: salida debe ser antes de llegada
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

        // Validar vuelta si tiene datos
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

        if (vueltaTieneDatos) {
            // Validar fechas vuelta
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

            // Validar camion/chofer vuelta si hay datos parciales
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

        // Mostrar resumen de errores
        if (!valido && estadoGuardado) {
            estadoGuardado.textContent = errores.length <= 2
                ? errores.join(". ")
                : `${errores.length} campos con errores. Revisa el formulario.`;
            estadoGuardado.className = "estado-guardado error";
        }
        return valido;
    };

    const buildPayload = () => {
        const estadoIda = document.getElementById("idaEstado")?.value || null;
        const estadoVuelta = document.getElementById("vueltaEstado")?.value || null;
        const pagado = document.getElementById("pagadoGeneral")?.checked ?? false;
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

        const viajeId = viajeForm?.dataset.viajeId;
        return {
            id_vieje: Number(viajeId) || 0,
            nombreViaje: document.getElementById("nombreViaje")?.value || "",
            loteIds: lotesSeleccionados.map(getLoteId).filter(Boolean),
            tramos
        };
    };

    // Eliminar viaje handler
    document.getElementById("btnEliminarViaje")?.addEventListener("click", async () => {
        const viajeId = viajeForm?.dataset.viajeId;
        if (!viajeId) return;
        if (!confirm("¿Estas seguro de eliminar este viaje? Esta accion no se puede deshacer.")) return;
        try {
            const headers = {};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;
            const res = await fetch(`/api/viajes/${viajeId}`, {
                method: "DELETE",
                headers,
                credentials: "same-origin"
            });
            if (!res.ok) throw new Error("Error al eliminar");
            cerrarModal();
            alert("Viaje eliminado correctamente");
            cargarViajes(paginacionViajes.page);
        } catch (error) {
            console.error(error);
            alert(`Error al eliminar: ${error.message}`);
        }
    });

    viajeForm?.addEventListener("submit", async event => {
        event.preventDefault();
        if (estadoGuardado) estadoGuardado.textContent = "";
        // Clear previous invalid states
        modal?.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        if (!validarFormulario()) {
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
            cargarViajes(paginacionViajes.page);
        } catch (error) {
            console.error(error);
            const msg = error.message || "Verifica los datos e intenta de nuevo";
            if (estadoGuardado) {
                estadoGuardado.textContent = msg;
                estadoGuardado.className = "estado-guardado error";
            }
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
