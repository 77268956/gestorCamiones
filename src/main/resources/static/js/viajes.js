document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("viajeModal");
    const btnNuevoViaje = document.getElementById("btnNuevoViaje");
    const btnCerrarViaje = document.getElementById("btnCerrarViaje");
    const viajeForm = document.getElementById("viajeForm");
    const usarMismosDatos = document.getElementById("usarMismosDatos");
    const estadoGuardado = document.getElementById("estadoGuardado");

    const state = {
        ida: { gastos: [], editIndex: null },
        vuelta: { gastos: [], editIndex: null }
    };

    const abrirModal = () => {
        modal?.classList.add("is-open");
        if (estadoGuardado) estadoGuardado.textContent = "";
    };

    const cerrarModal = () => {
        modal?.classList.remove("is-open");
    };

    btnNuevoViaje?.addEventListener("click", abrirModal);
    document.querySelectorAll(".trip-card-action").forEach(card => {
        card.addEventListener("click", abrirModal);
    });
    btnCerrarViaje?.addEventListener("click", cerrarModal);
    modal?.querySelector(".mp-modal-backdrop")?.addEventListener("click", cerrarModal);

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
        const ingresoIda = parseNumber(document.getElementById("idaIngreso")?.value);
        const ingresoVuelta = parseNumber(document.getElementById("vueltaIngreso")?.value);
        const totalIngresos = ingresoIda + ingresoVuelta;

        const totalGastos = state.ida.gastos.reduce((sum, g) => sum + g.monto, 0)
            + state.vuelta.gastos.reduce((sum, g) => sum + g.monto, 0);

        const totalGenerado = document.getElementById("totalGenerado");
        const totalGastado = document.getElementById("totalGastado");
        const totalGanancia = document.getElementById("totalGanancia");
        if (totalGenerado) totalGenerado.textContent = formatMoney(totalIngresos);
        if (totalGastado) totalGastado.textContent = formatMoney(totalGastos);
        if (totalGanancia) totalGanancia.textContent = formatMoney(totalIngresos - totalGastos);

        const idaTotal = document.getElementById("idaTotalGastos");
        const vueltaTotal = document.getElementById("vueltaTotalGastos");
        if (idaTotal) {
            idaTotal.textContent = formatMoney(
                state.ida.gastos.reduce((sum, g) => sum + g.monto, 0)
            );
        }
        if (vueltaTotal) {
            vueltaTotal.textContent = formatMoney(
                state.vuelta.gastos.reduce((sum, g) => sum + g.monto, 0)
            );
        }
    };

    ["idaIngreso", "vueltaIngreso"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", actualizarResumen);
    });

    const renderGastos = tramo => {
        const tbody = document.getElementById(`${tramo}GastosBody`);
        if (!tbody) return;
        tbody.innerHTML = "";
        state[tramo].gastos.forEach((gasto, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${gasto.tipo}</td>
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
            const tipo = form.querySelector("[data-gasto-tipo]").value;
            const descripcion = form.querySelector("[data-gasto-desc]").value;
            const monto = parseNumber(form.querySelector("[data-gasto-monto]").value);
            const fecha = form.querySelector("[data-gasto-fecha]").value;
            const evidenciaInput = form.querySelector("[data-gasto-evidencia]");
            const evidencia = evidenciaInput.files[0]?.name || "";

            if (!tipo || monto <= 0) {
                return;
            }

            const gasto = { tipo, descripcion, monto, fecha, evidencia };
            if (state[tramo].editIndex !== null) {
                state[tramo].gastos[state[tramo].editIndex] = gasto;
            } else {
                state[tramo].gastos.push(gasto);
            }
            renderGastos(tramo);
            resetGastoForm(tramo);
        });
    });

    document.addEventListener("click", event => {
        const editBtn = event.target.closest("[data-edit]");
        if (editBtn) {
            const tramo = editBtn.dataset.edit;
            const index = Number(editBtn.dataset.index);
            const gasto = state[tramo].gastos[index];
            const form = document.getElementById(`${tramo}GastoForm`);
            if (!form || !gasto) return;
            form.querySelector("[data-gasto-tipo]").value = gasto.tipo;
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

    const seleccion = { camionTramo: "ida", choferTramo: "ida" };
    const modalBuscarCamion = document.getElementById("modalBuscarCamionViaje");
    const modalBuscarCliente = document.getElementById("modalBuscarClienteViaje");
    const modalBuscarChofer = document.getElementById("modalBuscarChoferViaje");

    const paginacionCamionesModal = { page: 0, size: 10, totalPages: 1, totalElements: 0, sort: "idCamion,desc" };
    const filtrosCamionesModal = { q: "", estado: "" };
    let camionesModalCache = [];
    let debounceCamionesModal = null;

    const paginacionClientesModal = { page: 0, size: 10, totalPages: 1, totalElements: 0 };
    const filtrosClientesModal = { q: "" };
    let clientesModalCache = [];
    let debounceClientesModal = null;

    const paginacionChoferesModal = { page: 0, size: 10, totalPages: 1, totalElements: 0 };
    const filtrosChoferesModal = { q: "", estado: "" };
    let choferesModalCache = [];
    let debounceChoferesModal = null;

    const escapeHtml = text => String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const abrirModalCamion = tramo => {
        seleccion.camionTramo = tramo;
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarCamion);
        modalInstance.show();
    };

    const abrirModalCliente = () => {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarCliente);
        modalInstance.show();
    };

    document.getElementById("btnBuscarCamionIda")?.addEventListener("click", () => abrirModalCamion("ida"));
    document.getElementById("btnBuscarCamionVuelta")?.addEventListener("click", () => abrirModalCamion("vuelta"));
    document.getElementById("btnBuscarCliente")?.addEventListener("click", abrirModalCliente);

    const abrirModalChofer = tramo => {
        seleccion.choferTramo = tramo;
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalBuscarChofer);
        modalInstance.show();
    };

    document.getElementById("btnBuscarChoferIda")?.addEventListener("click", () => abrirModalChofer("ida"));
    document.getElementById("btnBuscarChoferVuelta")?.addEventListener("click", () => abrirModalChofer("vuelta"));

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
            document.getElementById("vueltaIngreso").value = document.getElementById("idaIngreso").value;
            state.vuelta.gastos = state.ida.gastos.map(g => ({ ...g }));
            renderGastos("vuelta");
            actualizarDuraciones();
        }
    });

    const validarFormulario = () => {
        let valido = true;
        const requeridos = [
            "nombreViaje",
            "clienteInput",
            "estadoViaje",
            "idaCamionInput",
            "idaChoferInput",
            "idaSalida",
            "idaLlegada"
        ];
        if (!usarMismosDatos?.checked) {
            requeridos.push("vueltaCamionInput", "vueltaChoferInput", "vueltaSalida", "vueltaLlegada");
        }
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
        return valido;
    };

    const buildPayload = () => {
        const getId = (hiddenId, inputId) => {
            const hidden = document.getElementById(hiddenId)?.value;
            if (hidden) return Number(hidden);
            const raw = document.getElementById(inputId)?.value;
            return Number.isNaN(Number(raw)) ? null : Number(raw);
        };

        const buildTramo = tramo => ({
            tipoTramo: tramo,
            idCamion: getId(`${tramo}CamionId`, `${tramo}CamionInput`),
            idConductor: getId(`${tramo}ChoferId`, `${tramo}ChoferInput`),
            fechaSalida: document.getElementById(`${tramo}Salida`)?.value || null,
            fechaEntrada: document.getElementById(`${tramo}Llegada`)?.value || null,
            gastos: state[tramo].gastos.map(g => ({
                tipoGasto: g.tipo,
                descripcion: g.descripcion,
                monto: g.monto,
                fecha: g.fecha,
                evidencia: g.evidencia
            }))
        });

        return {
            nombreViaje: document.getElementById("nombreViaje")?.value || "",
            idCliente: Number(document.getElementById("clienteId")?.value) || null,
            tramos: [buildTramo("ida"), buildTramo("vuelta")]
        };
    };

    viajeForm?.addEventListener("submit", event => {
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

        const payload = buildPayload();
        console.log("JSON viaje", payload);

        setTimeout(() => {
            if (!estadoGuardado) return;
            estadoGuardado.textContent = "Guardado correctamente";
            estadoGuardado.className = "estado-guardado ok";
        }, 700);
    });

    document.getElementById("btnGuardarBorrador")?.addEventListener("click", () => {
        if (estadoGuardado) {
            estadoGuardado.textContent = "Guardando borrador...";
            estadoGuardado.className = "estado-guardado";
        }
        setTimeout(() => {
            if (!estadoGuardado) return;
            estadoGuardado.textContent = "Borrador guardado";
            estadoGuardado.className = "estado-guardado ok";
        }, 500);
    });
});
