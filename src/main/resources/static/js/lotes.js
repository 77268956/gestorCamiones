document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("tablaLotesBody");
    const total = document.getElementById("totalLotes");
    const btnNuevo = document.getElementById("btnNuevoLote");
    const modalNuevo = document.getElementById("modalNuevoLote");
    const modalSeleccionCliente = document.getElementById("modalSeleccionCliente");
    const formNuevo = document.getElementById("formNuevoLote");
    const estadoGuardar = document.getElementById("estadoGuardarLote");
    const btnGuardar = document.getElementById("btnGuardarLote");

    const filtros = {q: "", estado: ""};
    let cache = [];
    let debounce = null;
    let loteEditandoId = null;

    const escapeHtml = text => String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const formatMoney = value => {
        const n = Number(value);
        if (Number.isNaN(n)) return "-";
        return `$${n.toFixed(2)}`;
    };

    const render = () => {
        if (!tbody) return;
        if (!cache.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay lotes</td></tr>';
            if (total) total.textContent = "Mostrando 0 lotes";
            return;
        }

        tbody.innerHTML = cache.map(l => {
            const id = l?.idLote ?? l?.id ?? "-";
            const numero = l?.numeroLote ?? "-";
            const estado = l?.estado ?? "-";
            const categoria = l?.categoriaNombre ?? "-";
            const remitente = l?.remitenteNombre ?? "-";
            const destinatario = l?.destinatarioNombre ?? "-";
            const peso = l?.peso != null ? String(l.peso) : "-";
            const valor = l?.valorDeclarado != null ? formatMoney(l.valorDeclarado) : "-";
            const encargado = l?.nombreEncargado ?? "-";

            return `
                <tr>
                    <td>${escapeHtml(id)}</td>
                    <td>${escapeHtml(numero)}</td>
                    <td>${escapeHtml(String(estado).replaceAll("_", " "))}</td>
                    <td>${escapeHtml(categoria)}</td>
                    <td>${escapeHtml(remitente)}</td>
                    <td>${escapeHtml(destinatario)}</td>
                    <td>${escapeHtml(peso)}</td>
                    <td>${escapeHtml(valor)}</td>
                    <td>${escapeHtml(encargado)}</td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn-edit" type="button" data-lote-id="${id}">Editar</button>
                            <button class="btn-del" type="button" data-lote-id="${id}">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (total) total.textContent = `Mostrando ${cache.length} lotes`;
    };

    const cargar = async () => {
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">Cargando lotes...</td></tr>';
        try {
            const qs = new URLSearchParams();
            if (filtros.q) qs.set("q", filtros.q);
            if (filtros.estado) qs.set("estado", filtros.estado);
            const res = await fetch(`/api/lotes?${qs.toString()}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar lotes");
            const data = await res.json();
            cache = Array.isArray(data) ? data : [];
            render();
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Error al cargar lotes</td></tr>';
            if (total) total.textContent = "Mostrando 0 lotes";
        }
    };

    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    const upsertSelectOption = (selectEl, id, label) => {
        if (!selectEl) return;
        const idStr = String(id);
        let opt = Array.from(selectEl.options).find(o => o.value === idStr);
        if (!opt) {
            opt = document.createElement("option");
            opt.value = idStr;
            selectEl.appendChild(opt);
        }
        opt.textContent = label || `Cliente #${idStr}`;
        selectEl.value = idStr;
    };

    const cargarEstadosLote = async () => {
        const select = document.getElementById("nuevoEstadoLote");
        if (!select) return;
        try {
            const res = await fetch("/api/lotes/estados", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar estados de lote");
            const data = await res.json();
            const current = select.value;
            select.innerHTML = '<option value="" selected>Seleccione</option>';
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

    const cargarCategorias = async () => {
        const select = document.getElementById("nuevoCategoria");
        if (!select) return;
        try {
            const res = await fetch("/api/categorias", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar categorias");
            const data = await res.json();
            const current = select.value;
            select.innerHTML = '<option value="" selected>Seleccione</option>';
            if (!Array.isArray(data) || !data.length) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.disabled = true;
                opt.textContent = "No hay categorias";
                select.appendChild(opt);
            }
            (Array.isArray(data) ? data : []).forEach(c => {
                const id = c?.idCategoria ?? c?.id;
                if (!id) return;
                const opt = document.createElement("option");
                opt.value = String(id);
                opt.textContent = c?.nombre || `Categoria #${id}`;
                select.appendChild(opt);
            });
            if (current) select.value = current;
        } catch (e) {
            console.error(e);
        }
    };

    // --- Picker de clientes (modal con tabla + paginacion) ---
    const clientePicker = {
        targetSelectId: null,
        targetQueryId: null,
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
        btnBuscar: document.getElementById("btnClientePickerBuscar"),
        body: document.getElementById("clientePickerBody"),
        prev: document.getElementById("clientePickerPrev"),
        next: document.getElementById("clientePickerNext"),
        info: document.getElementById("clientePickerInfo")
    };

    const renderClientePicker = (clientes) => {
        const body = clientePickerRefs.body;
        if (!body) return;
        if (!Array.isArray(clientes) || clientes.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="text-center">No hay clientes</td></tr>';
            return;
        }

        body.innerHTML = clientes.map(c => {
            const id = c?.id;
            const nombre = c?.nombre || "-";
            const tel = c?.telefono || "-";
            const correo = c?.correo || "-";
            const dir = c?.direccion || "-";
            const disabled = !id ? "disabled" : "";
            return `
                <tr>
                    <td>
                        <button type="button" class="btn btn-sm btn-primary btn-select-cliente" data-id="${escapeHtml(id)}" ${disabled}>Seleccionar</button>
                    </td>
                    <td>${escapeHtml(nombre)}</td>
                    <td>${escapeHtml(tel)}</td>
                    <td>${escapeHtml(correo)}</td>
                    <td>${escapeHtml(dir)}</td>
                    <td>${escapeHtml(id ?? "-")}</td>
                </tr>
            `;
        }).join("");
    };

    const actualizarClientePickerFooter = () => {
        const info = clientePickerRefs.info;
        const prev = clientePickerRefs.prev;
        const next = clientePickerRefs.next;
        if (info) {
            info.textContent = `Pagina ${clientePicker.page + 1} de ${clientePicker.totalPages} (${clientePicker.totalElements} clientes)`;
        }
        if (prev) prev.disabled = clientePicker.page <= 0;
        if (next) next.disabled = clientePicker.page >= (clientePicker.totalPages - 1);
    };

    const cargarClientePicker = async (page = clientePicker.page) => {
        const body = clientePickerRefs.body;
        if (!body) return;
        body.innerHTML = '<tr><td colspan="6" class="text-center">Cargando clientes...</td></tr>';

        const pageSeguro = Math.max(0, Number(page) || 0);
        const sizeSeguro = Math.max(1, Number(clientePicker.size) || 10);

        try {
            const query = new URLSearchParams({
                page: String(pageSeguro),
                size: String(sizeSeguro),
                sort: clientePicker.sort
            });
            if (clientePicker.q) query.set("q", clientePicker.q);
            const res = await fetch(`/api/clientes?${query.toString()}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar clientes");
            const pageData = await res.json();

            clientePicker.page = Number(pageData?.number ?? pageSeguro);
            clientePicker.size = Number(pageData?.size ?? sizeSeguro);
            clientePicker.totalPages = Math.max(1, Number(pageData?.totalPages ?? 1));
            clientePicker.totalElements = Math.max(0, Number(pageData?.totalElements ?? 0));

            // Si quedo fuera de rango (por filtros/tamano), volver a la ultima pagina valida.
            if (clientePicker.page >= clientePicker.totalPages && clientePicker.totalPages > 0) {
                await cargarClientePicker(clientePicker.totalPages - 1);
                return;
            }

            const list = Array.isArray(pageData?.content) ? pageData.content : [];
            renderClientePicker(list);
            actualizarClientePickerFooter();
        } catch (e) {
            console.error(e);
            clientePicker.totalPages = 1;
            clientePicker.totalElements = 0;
            body.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar clientes</td></tr>';
            actualizarClientePickerFooter();
        }
    };

    const abrirClientePicker = async ({targetSelectId, targetQueryId, qInicial}) => {
        if (!modalSeleccionCliente) return;
        clientePicker.targetSelectId = targetSelectId;
        clientePicker.targetQueryId = targetQueryId;
        clientePicker.page = 0;
        clientePicker.totalPages = 1;
        clientePicker.totalElements = 0;
        clientePicker.q = (qInicial || "").trim();

        if (clientePickerRefs.q) clientePickerRefs.q.value = clientePicker.q;
        if (clientePickerRefs.size) clientePicker.size = Number(clientePickerRefs.size.value) || clientePicker.size;

        bootstrap.Modal.getOrCreateInstance(modalSeleccionCliente).show();
        await cargarClientePicker(0);
    };

    // Eventos del modal picker
    clientePickerRefs.btnBuscar?.addEventListener("click", async () => {
        clientePicker.q = clientePickerRefs.q?.value.trim() || "";
        await cargarClientePicker(0);
    });
    clientePickerRefs.q?.addEventListener("keydown", async (ev) => {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        clientePicker.q = clientePickerRefs.q?.value.trim() || "";
        await cargarClientePicker(0);
    });
    clientePickerRefs.size?.addEventListener("change", async () => {
        const size = Number(clientePickerRefs.size.value);
        if (!Number.isFinite(size) || size <= 0) return;
        clientePicker.size = size;
        await cargarClientePicker(0);
    });
    clientePickerRefs.prev?.addEventListener("click", async () => {
        if (clientePicker.page <= 0) return;
        await cargarClientePicker(clientePicker.page - 1);
    });
    clientePickerRefs.next?.addEventListener("click", async () => {
        if (clientePicker.page >= (clientePicker.totalPages - 1)) return;
        await cargarClientePicker(clientePicker.page + 1);
    });
    clientePickerRefs.body?.addEventListener("click", (ev) => {
        const btn = ev.target?.closest?.(".btn-select-cliente");
        if (!btn) return;
        const id = Number(btn.getAttribute("data-id"));
        if (!Number.isFinite(id) || id <= 0) return;

        const row = btn.closest("tr");
        const nombre = row?.children?.[1]?.textContent?.trim() || `Cliente #${id}`;

        const select = clientePicker.targetSelectId ? document.getElementById(clientePicker.targetSelectId) : null;
        upsertSelectOption(select, id, `${nombre} (#${id})`);

        const qInput = clientePicker.targetQueryId ? document.getElementById(clientePicker.targetQueryId) : null;
        if (qInput) qInput.value = nombre;

        bootstrap.Modal.getInstance(modalSeleccionCliente)?.hide();
    });

    const prepararModalAgregar = async () => {
        loteEditandoId = null;
        const tituloModal = document.getElementById("modalNuevoLoteLabel");
        const botonSubmit = document.getElementById("btnGuardarLote");
        if (tituloModal) tituloModal.textContent = "Nuevo lote";
        if (botonSubmit) botonSubmit.textContent = "Guardar";
        formNuevo?.reset();
        const hiddenId = document.getElementById("nuevoLoteId");
        if (hiddenId) hiddenId.value = "";
        if (estadoGuardar) estadoGuardar.textContent = "";

        // Reset selects
        const remitenteSelect = document.getElementById("nuevoRemitente");
        if (remitenteSelect) remitenteSelect.innerHTML = '<option value="" selected>Seleccione</option>';
        const destinatarioSelect = document.getElementById("nuevoDestinatario");
        if (destinatarioSelect) destinatarioSelect.innerHTML = '<option value="" selected>Seleccione</option>';

        await cargarEstadosLote();
        await cargarCategorias();
    };

    const prepararModalEdicion = async (id) => {
        const tituloModal = document.getElementById("modalNuevoLoteLabel");
        const botonSubmit = document.getElementById("btnGuardarLote");
        if (tituloModal) tituloModal.textContent = "Editar lote";
        if (botonSubmit) botonSubmit.textContent = "Guardar cambios";
        if (estadoGuardar) estadoGuardar.textContent = "Cargando datos...";

        loteEditandoId = id;
        const hiddenId = document.getElementById("nuevoLoteId");
        if (hiddenId) hiddenId.value = String(id);

        try {
            await cargarEstadosLote();
            await cargarCategorias();

            const res = await fetch(`/api/lotes/${id}`, {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudo cargar la información del lote");
            const lote = await res.json();

            const loteResumen = cache.find(l => (l.idLote ?? l.id) === id);

            document.getElementById("nuevoNumeroLote").value = lote.numeroLote ?? "";
            document.getElementById("nuevoEstadoLote").value = lote.estado ?? "";
            document.getElementById("nuevoCategoria").value = lote.idCategoria ?? "";
            document.getElementById("nuevoEncargado").value = lote.nombreEncargado ?? "";
            document.getElementById("nuevoPeso").value = lote.peso ?? "";
            document.getElementById("nuevoValor").value = lote.valorDeclarado ?? "";
            document.getElementById("nuevoDescripcion").value = lote.descripcion ?? "";

            // Cargar remitente
            if (lote.idClienteRemitente) {
                const remitenteNombre = loteResumen?.remitenteNombre || `Cliente #${lote.idClienteRemitente}`;
                upsertSelectOption(document.getElementById("nuevoRemitente"), lote.idClienteRemitente, `${remitenteNombre} (#${lote.idClienteRemitente})`);
                document.getElementById("nuevoRemitenteQ").value = loteResumen?.remitenteNombre || "";
            } else {
                document.getElementById("nuevoRemitente").value = "";
                document.getElementById("nuevoRemitenteQ").value = "";
            }

            // Cargar destinatario
            if (lote.idClienteDestinatario) {
                const destinatarioNombre = loteResumen?.destinatarioNombre || `Cliente #${lote.idClienteDestinatario}`;
                upsertSelectOption(document.getElementById("nuevoDestinatario"), lote.idClienteDestinatario, `${destinatarioNombre} (#${lote.idClienteDestinatario})`);
                document.getElementById("nuevoDestinatarioQ").value = loteResumen?.destinatarioNombre || "";
            } else {
                document.getElementById("nuevoDestinatario").value = "";
                document.getElementById("nuevoDestinatarioQ").value = "";
            }

            if (estadoGuardar) estadoGuardar.textContent = "";
            bootstrap.Modal.getOrCreateInstance(modalNuevo).show();
        } catch (e) {
            console.error(e);
            alert(e.message || "Error al cargar datos del lote");
            if (estadoGuardar) estadoGuardar.textContent = "Error al cargar datos";
        }
    };

    const eliminarLote = async (id) => {
        const loteResumen = cache.find(l => (l.idLote ?? l.id) === id);
        const numLote = loteResumen?.numeroLote || `#${id}`;
        const confirmar = window.confirm(`¿Está seguro de eliminar el lote ${numLote}?`);
        if (!confirmar) return;

        try {
            const headers = {};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;
            const res = await fetch(`/api/lotes/${id}`, {
                method: "DELETE",
                headers,
                credentials: "same-origin"
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "No se pudo eliminar el lote");
            }
            alert("Lote eliminado correctamente");
            await cargar();
        } catch (e) {
            console.error(e);
            alert("Error al eliminar lote: " + e.message);
        }
    };

    const manejarAccionesTabla = async (event) => {
        const botonEditar = event.target.closest(".btn-edit");
        if (botonEditar) {
            const id = Number(botonEditar.getAttribute("data-lote-id"));
            if (!Number.isInteger(id)) return;
            await prepararModalEdicion(id);
            return;
        }

        const botonEliminar = event.target.closest(".btn-del");
        if (botonEliminar) {
            const id = Number(botonEliminar.getAttribute("data-lote-id"));
            if (!Number.isInteger(id)) return;
            await eliminarLote(id);
            return;
        }
    };

    tbody?.addEventListener("click", manejarAccionesTabla);

    btnNuevo?.addEventListener("click", async () => {
        if (!modalNuevo) return;
        await prepararModalAgregar();
        bootstrap.Modal.getOrCreateInstance(modalNuevo).show();
    });

    document.getElementById("btnBuscarRemitente")?.addEventListener("click", () => {
        const q = document.getElementById("nuevoRemitenteQ")?.value.trim() || "";
        abrirClientePicker({targetSelectId: "nuevoRemitente", targetQueryId: "nuevoRemitenteQ", qInicial: q});
    });
    document.getElementById("btnBuscarDestinatario")?.addEventListener("click", () => {
        const q = document.getElementById("nuevoDestinatarioQ")?.value.trim() || "";
        abrirClientePicker({targetSelectId: "nuevoDestinatario", targetQueryId: "nuevoDestinatarioQ", qInicial: q});
    });
    document.getElementById("btnIrClientesRemitente")?.addEventListener("click", () => {
        const q = document.getElementById("nuevoRemitenteQ")?.value.trim() || "";
        abrirClientePicker({targetSelectId: "nuevoRemitente", targetQueryId: "nuevoRemitenteQ", qInicial: q});
    });
    document.getElementById("btnIrClientesDestinatario")?.addEventListener("click", () => {
        const q = document.getElementById("nuevoDestinatarioQ")?.value.trim() || "";
        abrirClientePicker({targetSelectId: "nuevoDestinatario", targetQueryId: "nuevoDestinatarioQ", qInicial: q});
    });

    document.getElementById("btnNuevaCategoria")?.addEventListener("click", async () => {
        const nombre = prompt("Nombre de la categoria:");
        if (!nombre) return;
        try {
            const headers = {"Content-Type": "application/json"};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;
            const res = await fetch("/api/categorias", {
                method: "POST",
                headers,
                credentials: "same-origin",
                body: JSON.stringify({nombre})
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "No se pudo crear categoria");
            }
            await cargarCategorias();
        } catch (e) {
            alert(e.message || "Error");
        }
    });

    formNuevo?.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        if (btnGuardar) btnGuardar.disabled = true;
        if (estadoGuardar) estadoGuardar.textContent = "Guardando...";
        try {
            const payload = {
                numeroLote: document.getElementById("nuevoNumeroLote")?.value.trim() || "",
                estado: document.getElementById("nuevoEstadoLote")?.value || "",
                idCategoria: Number(document.getElementById("nuevoCategoria")?.value) || null,
                idClienteRemitente: Number(document.getElementById("nuevoRemitente")?.value) || null,
                idClienteDestinatario: Number(document.getElementById("nuevoDestinatario")?.value) || null,
                nombreEncargado: document.getElementById("nuevoEncargado")?.value || "",
                peso: document.getElementById("nuevoPeso")?.value ? Number(document.getElementById("nuevoPeso").value) : null,
                valorDeclarado: document.getElementById("nuevoValor")?.value ? Number(document.getElementById("nuevoValor").value) : null,
                descripcion: document.getElementById("nuevoDescripcion")?.value || ""
            };

            const headers = {"Content-Type": "application/json"};
            if (csrfToken && csrfHeader) headers[csrfHeader] = csrfToken;
            
            const enEdicion = loteEditandoId !== null;
            const url = enEdicion ? `/api/lotes/${loteEditandoId}` : "/api/lotes";
            const method = enEdicion ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers,
                credentials: "same-origin",
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "No se pudo guardar el lote");
            }
            if (estadoGuardar) estadoGuardar.textContent = "Guardado";
            bootstrap.Modal.getInstance(modalNuevo)?.hide();
            await cargar();
            alert(enEdicion ? "Lote actualizado correctamente" : "Lote registrado correctamente");
        } catch (e) {
            console.error(e);
            if (estadoGuardar) estadoGuardar.textContent = e.message || "Error al guardar";
            alert(e.message || "Error al guardar");
        } finally {
            if (btnGuardar) btnGuardar.disabled = false;
        }
    });

    document.getElementById("filtroBusquedaLotes")?.addEventListener("input", (event) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            filtros.q = event.target.value.trim();
        }, 250);
    });

    document.getElementById("btnAplicarFiltrosLotes")?.addEventListener("click", () => {
        filtros.q = document.getElementById("filtroBusquedaLotes")?.value.trim() || "";
        filtros.estado = document.getElementById("filtroEstadoLotes")?.value || "";
        cargar();
    });

    document.getElementById("btnLimpiarFiltrosLotes")?.addEventListener("click", () => {
        filtros.q = "";
        filtros.estado = "";
        const q = document.getElementById("filtroBusquedaLotes");
        const e = document.getElementById("filtroEstadoLotes");
        if (q) q.value = "";
        if (e) e.value = "";
        cargar();
    });

    cargar();
});
