(() => {
    "use strict";

    const getCsrfHeaders = () => {
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
        const headers = {};
        if (csrfHeader && csrfToken) headers[csrfHeader] = csrfToken;
        return headers;
    };

    const byId = id => document.getElementById(id);

    // ── Helpers de fecha ────────────────────────────────────────────────────
    const toISODate = d => d.toISOString().split('T')[0];

    /** Devuelve { inicio, fin } para el mes de la fecha dada. */
    const rangoMesActual = (fecha = new Date()) => {
        const y = fecha.getFullYear();
        const m = fecha.getMonth();          // 0-based
        const inicio = new Date(y, m, 1);
        const fin    = new Date(y, m + 1, 0); // día 0 del mes siguiente = último día del mes
        return { inicio: toISODate(inicio), fin: toISODate(fin) };
    };
    // Tabla y filtros
    const tbodyGastos = byId("idaGastosBody");
    const totalBox = document.querySelector(".total-box");
    const tbodyCategorias = byId("idaGastosCategoria");
    const inputFiltroInicio = byId("filtroFechaInicioViajes");
    const inputFiltroFin = byId("filtroFechaFinViajes");
    const selectFiltroTipo = byId("filtroTiposGastos");
    const btnBuscar = byId("btnAplicarFiltrosViajes");
    const btnLimpiar = byId("btnLimpiarFiltrosViajes");

    // Modal
    const btnAgregarGasto = byId("btnAgregarGasto");
    const modalGastoEl = byId("gastoModal");
    const selectTipoGasto = byId("gastoTipo");
    const inputId = byId("gastoId");
    const inputMonto = byId("gastoMonto");
    const inputFecha = byId("gastoFecha");
    const inputDescripcion = byId("gastoDescripcion");
    const inputEvidencia = byId("gastoEvidencia");
    const btnGuardarGasto = byId("btnGuardarGasto");
    const alertEl = byId("gastoAlert");

    // Previsualizacion de evidencia
    const evidenciaPreview = document.createElement("img");
    evidenciaPreview.id = "evidenciaPreviewImg";
    evidenciaPreview.alt = "Vista previa";
    evidenciaPreview.style.cssText = "display:none;max-height:120px;max-width:100%;border-radius:8px;margin-top:8px;border:1px solid rgba(0,0,0,.1);object-fit:contain;";
    if (inputEvidencia) {
        inputEvidencia.insertAdjacentElement("afterend", evidenciaPreview);
        inputEvidencia.addEventListener("change", () => {
            const file = inputEvidencia.files?.[0];
            if (file && file.type.startsWith("image/")) {
                evidenciaPreview.src = URL.createObjectURL(file);
                evidenciaPreview.style.display = "block";
            } else {
                evidenciaPreview.src = "";
                evidenciaPreview.style.display = "none";
            }
        });
    }

    if (!tbodyGastos) return;

    let gastoModal = null;
    let cacheGastos = [];
    let cacheTipos = [];
    
    // Paginación
    const paginacion = {
        page: 0,
        size: 10,
        totalPages: 1,
        totalElements: 0
    };

    const btnPrevPage = byId("btnPrevPage");
    const btnNextPage = byId("btnNextPage");
    const pageInfo = byId("pageInfo");
    const totalGastosText = byId("totalGastosText");

    const setAlert = (msg) => {
        if (!alertEl) return;
        if (!msg) {
            alertEl.classList.add("d-none");
            alertEl.textContent = "";
            return;
        }
        alertEl.textContent = msg;
        alertEl.classList.remove("d-none");
    };

    const formatearMoneda = (valor) => {
        const num = Number(valor) || 0;
        return "$" + num.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
    };

    const cargarTiposGasto = async () => {
        try {
            const res = await fetch("/api/tipogasto", {credentials: "same-origin"});
            if (res.ok) {
                cacheTipos = await res.json();
                renderSelectTiposGasto();
            }
        } catch (e) {
            console.error("Error cargando tipos", e);
        }
    };

    const renderSelectTiposGasto = () => {
        if (!selectTipoGasto) return;
        selectTipoGasto.innerHTML = '<option value="">Seleccione un tipo</option>';
        cacheTipos.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.tipoGasto;
            selectTipoGasto.appendChild(opt);
        });
    };

    // Tiempo real: cuando se crea/edita/elimina un tipo de gasto desde tipoGasto.js,
    // refrescar el select del modal de "Nuevo gasto" sin recargar la pagina.
    window.addEventListener("tiposgasto:updated", (ev) => {
        const tipos = ev?.detail?.tipos;
        if (!Array.isArray(tipos)) return;
        cacheTipos = tipos;
        renderSelectTiposGasto();
    });

    const renderGastos = (gastos) => {
        if (!gastos || !gastos.length) {
            tbodyGastos.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay gastos en este periodo.</td></tr>`;
            if (totalBox) totalBox.textContent = formatearMoneda(0);
            if (tbodyCategorias) tbodyCategorias.innerHTML = "";
            return;
        }

        let total = 0;
        const porCategoria = {};

        tbodyGastos.innerHTML = gastos.map(g => {
            const monto = Number(g.monto) || 0;
            total += monto;

            const cat = g.nombreTipoGasto || "Sin categoría";
            porCategoria[cat] = (porCategoria[cat] || 0) + monto;

            const fotoHtml = g.evidenciaUrl
                ? (g.evidenciaUrl.match(/\.(png|jpe?g|gif|webp|bmp)$/i)
                    ? `<a href="${g.evidenciaUrl}" target="_blank" rel="noopener"><img src="${g.evidenciaUrl}" alt="Evidencia" style="height:36px;width:52px;object-fit:cover;border-radius:6px;border:1px solid rgba(0,0,0,.1)"></a>`
                    : `<a href="${g.evidenciaUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-info" title="Ver archivo">📎 Ver</a>`)
                : `<span class="text-muted">-</span>`;

            return `
                <tr data-id="${g.idGastosGenerales}">
                    <td>${cat}</td>
                    <td>${g.descripcion || ""}</td>
                    <td>${formatearMoneda(monto)}</td>
                    <td>${g.fechaGasto || ""}</td>
                    <td>${fotoHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-edit" title="Editar">✏️</button>
                        <button class="btn btn-sm btn-outline-danger btn-delete" title="Eliminar">🗑</button>
                    </td>
                </tr>
            `;
        }).join("");

        if (totalBox) totalBox.textContent = formatearMoneda(total);
        if (tbodyCategorias) {
            const categoriasArr = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
            tbodyCategorias.innerHTML = categoriasArr.map(([cat, monto]) => `
                <tr>
                    <td>${cat}</td>
                    <td>${formatearMoneda(monto)}</td>
                </tr>
            `).join("");
        }
    };

    const renderErrorTabla = (msg) => {
        const texto = (msg && String(msg).trim()) ? String(msg).trim() : "No se pudieron cargar los gastos.";
        tbodyGastos.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${texto}</td></tr>`;
        if (totalBox) totalBox.textContent = formatearMoneda(0);
        if (tbodyCategorias) tbodyCategorias.innerHTML = "";
    };

    const cargarGastos = async (pageNumber = paginacion.page) => {
        const fechaInicio = inputFiltroInicio?.value || "";
        const fechaFin = inputFiltroFin?.value || "";
        const tipoFiltro = selectFiltroTipo?.value || "";

        let url = "/api/gastos-generales";
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        params.append("page", pageNumber);
        params.append("size", paginacion.size);
        
        if (params.toString()) {
            url += "?" + params.toString();
        }

        try {
            const res = await fetch(url, {
                credentials: "same-origin",
                headers: {"Accept": "application/json"}
            });

            // Si Spring Security redirige a /login, fetch suele terminar con HTML (200) y el .json() revienta.
            const contentType = (res.headers.get("content-type") || "").toLowerCase();
            if (!res.ok) {
                throw new Error(`Error cargando gastos (HTTP ${res.status})`);
            }
            if (!contentType.includes("application/json")) {
                const text = await res.text();
                const snippet = String(text || "").slice(0, 160).replace(/\s+/g, " ").trim();
                throw new Error(`Respuesta no-JSON desde el servidor. Posible sesi\u00f3n expirada o bloqueo de acceso. ${snippet ? "Detalle: " + snippet : ""}`);
            }

            const pageData = await res.json();
            
            cacheGastos = Array.isArray(pageData?.content) ? pageData.content : [];
            paginacion.page = Number(pageData?.number ?? pageNumber);
            paginacion.totalPages = Math.max(Number(pageData?.totalPages ?? 1), 1);
            paginacion.totalElements = Number(pageData?.totalElements ?? 0);
            
            actualizarPaginacionUI();
            
            // Filtro local adicional por tipo y búsqueda
            const q = (byId("filtroBusquedaViajes")?.value || "").toLowerCase();
            const gastosFiltrados = cacheGastos.filter(g => {
                if (tipoFiltro && String(g.idTipoGasto) !== String(tipoFiltro)) return false;
                if (q && !(g.descripcion || "").toLowerCase().includes(q) && !(g.nombreAdmin || "").toLowerCase().includes(q)) return false;
                return true;
            });

            renderGastos(gastosFiltrados);
        } catch (e) {
            console.error(e);
            renderErrorTabla(e?.message || "Error cargando gastos");
        }
    };
    
    const actualizarPaginacionUI = () => {
        if (pageInfo) pageInfo.textContent = `Página ${paginacion.page + 1} de ${paginacion.totalPages}`;
        if (totalGastosText) totalGastosText.textContent = `Mostrando ${paginacion.totalElements} gastos en total`;
        
        if (btnPrevPage) btnPrevPage.disabled = paginacion.page <= 0;
        if (btnNextPage) btnNextPage.disabled = paginacion.page >= paginacion.totalPages - 1;
    };
    
    if (btnPrevPage) btnPrevPage.addEventListener("click", () => {
        if (paginacion.page > 0) cargarGastos(paginacion.page - 1);
    });
    
    if (btnNextPage) btnNextPage.addEventListener("click", () => {
        if (paginacion.page < paginacion.totalPages - 1) cargarGastos(paginacion.page + 1);
    });

    if (btnBuscar) btnBuscar.addEventListener("click", () => cargarGastos(0));
    if (btnLimpiar) btnLimpiar.addEventListener("click", () => {
        // No dejar fechas en blanco: al limpiar, volver a poner el mes actual.
        const { inicio, fin } = rangoMesActual();
        if (inputFiltroInicio) inputFiltroInicio.value = inicio;
        if (inputFiltroFin) inputFiltroFin.value = fin;
        if (selectFiltroTipo) selectFiltroTipo.value = "";
        if (byId("filtroBusquedaViajes")) byId("filtroBusquedaViajes").value = "";
        cargarGastos(0);
    });

    if (btnAgregarGasto) {
        btnAgregarGasto.addEventListener("click", () => {
            if (!gastoModal) gastoModal = new bootstrap.Modal(modalGastoEl);
            setAlert("");
            inputId.value = "";
            selectTipoGasto.value = "";
            inputMonto.value = "";
            inputFecha.value = new Date().toISOString().split('T')[0];
            inputDescripcion.value = "";
            inputEvidencia.value = "";
            // Limpiar preview
            evidenciaPreview.src = "";
            evidenciaPreview.style.display = "none";
            byId("gastoModalLabel").textContent = "Nuevo gasto";
            gastoModal.show();
        });
    }

    tbodyGastos.addEventListener("click", async (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        
        const row = btn.closest("tr");
        const id = row.dataset.id;
        if (!id) return;

        const gasto = cacheGastos.find(g => String(g.idGastosGenerales) === String(id));
        if (!gasto) return;

        if (btn.classList.contains("btn-edit")) {
            if (!gastoModal) gastoModal = new bootstrap.Modal(modalGastoEl);
            setAlert("");
            inputId.value = gasto.idGastosGenerales;
            selectTipoGasto.value = gasto.idTipoGasto;
            inputMonto.value = gasto.monto;
            inputFecha.value = gasto.fechaGasto || "";
            inputDescripcion.value = gasto.descripcion || "";
            inputEvidencia.value = "";
            // Mostrar preview de evidencia existente si es imagen
            if (gasto.evidenciaUrl && gasto.evidenciaUrl.match(/\.(png|jpe?g|gif|webp|bmp)$/i)) {
                evidenciaPreview.src = gasto.evidenciaUrl;
                evidenciaPreview.style.display = "block";
            } else {
                evidenciaPreview.src = "";
                evidenciaPreview.style.display = "none";
            }
            byId("gastoModalLabel").textContent = "Editar gasto";
            gastoModal.show();
        }

        if (btn.classList.contains("btn-delete")) {
            if (!confirm(`¿Eliminar gasto de $${gasto.monto}?`)) return;
            try {
                const res = await fetch(`/api/gastos-generales/${id}`, {
                    method: "DELETE",
                    headers: getCsrfHeaders(),
                    credentials: "same-origin"
                });
                if (!res.ok) throw new Error("Error eliminando gasto");
                cargarGastos();
            } catch (e) {
                console.error(e);
                alert("No se pudo eliminar el gasto.");
            }
        }
    });

    if (btnGuardarGasto) {
        btnGuardarGasto.addEventListener("click", async () => {
            setAlert("");
            const id = inputId.value;
            const isEdit = !!id;

            const idTipo = selectTipoGasto.value;
            const monto = inputMonto.value;
            
            if (!idTipo || !monto) {
                setAlert("Tipo de gasto y monto son requeridos.");
                return;
            }

            const formData = new FormData();
            formData.append("idTipoGasto", idTipo);
            formData.append("monto", monto);
            if (inputDescripcion.value) formData.append("descripcion", inputDescripcion.value);
            if (inputFecha.value) formData.append("fechaGasto", inputFecha.value);
            if (inputEvidencia.files[0]) formData.append("evidencia", inputEvidencia.files[0]);

            const url = isEdit ? `/api/gastos-generales/${id}` : "/api/gastos-generales";
            const method = isEdit ? "PUT" : "POST";

            try {
                // If there's an evidence file or if we want to use the form-data endpoint
                // Actually the API endpoint expects multipart/form-data for both POST and PUT if evidence is provided,
                // but since our controller mapping `/api/gastos-generales` has a POST with JSON and a POST with multipart,
                // we should always use multipart for simplicity or conditionally.
                // Our Controller: @PostMapping(consumes = "multipart/form-data") vs @PostMapping (JSON)
                // Let's use multipart/form-data. Fetch does this automatically when body is FormData.
                const headers = getCsrfHeaders();
                // do not set Content-Type for FormData

                const res = await fetch(url, {
                    method,
                    headers,
                    body: formData,
                    credentials: "same-origin"
                });

                if (!res.ok) {
                    throw new Error("Error guardando el gasto");
                }
                
                if (gastoModal) gastoModal.hide();
                
                // Después de guardar, recargar sin borrar las fechas del filtro.
                cargarGastos(0);
            } catch (e) {
                console.error(e);
                setAlert(e.message || "Error al guardar el gasto");
            }
        });
    }

    // Initialize
    cargarTiposGasto();

    // Pre-cargar filtros con el mes actual y cargar la tabla
    const { inicio, fin } = rangoMesActual();
    if (inputFiltroInicio) inputFiltroInicio.value = inicio;
    if (inputFiltroFin)    inputFiltroFin.value    = fin;
    cargarGastos(0);

})();
