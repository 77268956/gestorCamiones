(() => {
    "use strict";

    const getCsrfHeaders = () => {
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
        const headers = {"Content-Type": "application/json"};
        if (csrfHeader && csrfToken) headers[csrfHeader] = csrfToken;
        return headers;
    };

    const byId = id => document.getElementById(id);

    const btnAbrir = byId("btnAgregarTipoGasto");
    const modalEl = byId("tipoGastoModal");
    const listEl = byId("tipoGastoList");
    const alertEl = byId("tipoGastoAlert");

    const formEl = byId("tipoGastoForm");
    const inputNombre = byId("tipoGastoNombre");
    const inputEditId = byId("tipoGastoIdEdit");
    const btnSubmit = byId("tipoGastoSubmit");
    const btnCancel = byId("tipoGastoCancel");

    const selectFiltro = byId("filtroTiposGastos");

    if (!btnAbrir || !modalEl || !listEl || !formEl || !inputNombre || !inputEditId || !btnSubmit || !btnCancel) {
        return;
    }

    let modal = null;
    let cacheTipos = [];

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

    const setEditMode = (id, nombre) => {
        inputEditId.value = id ? String(id) : "";
        inputNombre.value = nombre ? String(nombre) : "";
        btnSubmit.textContent = id ? "Guardar" : "Agregar";
        btnCancel.classList.toggle("d-none", !id);
        inputNombre.focus();
        inputNombre.select();
    };

    const renderTipos = (tipos) => {
        if (!Array.isArray(tipos) || !tipos.length) {
            listEl.innerHTML = `
                <div class="mp-types-row">
                    <div class="mp-types-name">No hay tipos de gasto.</div>
                </div>`;
            return;
        }

        listEl.innerHTML = tipos.map(t => {
            const id = Number(t?.id);
            const nombre = String(t?.tipoGasto ?? "").trim();
            const safeNombre = nombre.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            return `
                <div class="mp-types-row" data-id="${id}">
                    <div class="mp-types-name" title="${safeNombre}">${safeNombre}</div>
                    <div class="mp-types-actions">
                        <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" title="Editar">✏️</button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" title="Eliminar">🗑</button>
                    </div>
                </div>
            `;
        }).join("");
    };

    const renderSelectFiltro = (tipos) => {
        if (!selectFiltro) return;
        const current = selectFiltro.value;
        selectFiltro.innerHTML = `<option value="" selected>Todos</option>`;
        (Array.isArray(tipos) ? tipos : []).forEach(t => {
            const id = String(t?.id ?? "");
            const nombre = String(t?.tipoGasto ?? "").trim();
            if (!id || !nombre) return;
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = nombre;
            selectFiltro.appendChild(opt);
        });
        if (current) selectFiltro.value = current;
    };

    const cargarTipos = async () => {
        setAlert("");
        try {
            const res = await fetch("/api/tipogasto", {credentials: "same-origin"});
            if (!res.ok) throw new Error("No se pudieron cargar los tipos de gasto");
            const data = await res.json();
            cacheTipos = Array.isArray(data) ? data : [];
            renderTipos(cacheTipos);
            renderSelectFiltro(cacheTipos);
        } catch (e) {
            console.error(e);
            setAlert(e?.message || "Error cargando tipos de gasto");
            renderTipos([]);
        }
    };

    listEl.addEventListener("click", async (ev) => {
        const btn = ev.target?.closest?.("button[data-action]");
        if (!btn) return;
        const row = btn.closest(".mp-types-row");
        const id = row?.dataset?.id;
        if (!id) return;

        const action = btn.dataset.action;
        const tipo = cacheTipos.find(t => String(t?.id) === String(id)) || null;
        const nombre = tipo?.tipoGasto ?? "";

        if (action === "edit") {
            setEditMode(id, nombre);
            return;
        }

        if (action === "delete") {
            const ok = window.confirm(`Eliminar el tipo de gasto "${nombre}"?`);
            if (!ok) return;
            setAlert("");
            try {
                const res = await fetch(`/api/tipogasto/${id}`, {
                    method: "DELETE",
                    headers: getCsrfHeaders(),
                    credentials: "same-origin"
                });
                if (!res.ok) throw new Error("No se pudo eliminar el tipo de gasto");
                if (String(inputEditId.value) === String(id)) setEditMode(null, "");
                await cargarTipos();
            } catch (e) {
                console.error(e);
                setAlert(e?.message || "Error eliminando tipo de gasto");
            }
        }
    });

    btnCancel.addEventListener("click", () => setEditMode(null, ""));

    formEl.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        setAlert("");

        const nombre = String(inputNombre.value ?? "").trim();
        if (!nombre) {
            setAlert("Escribí el nombre del tipo de gasto.");
            inputNombre.focus();
            return;
        }

        const id = String(inputEditId.value ?? "").trim();
        const isEdit = Boolean(id);
        const url = isEdit ? `/api/tipogasto/${encodeURIComponent(id)}` : "/api/tipogasto";
        const method = isEdit ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: getCsrfHeaders(),
                credentials: "same-origin",
                body: JSON.stringify({id: isEdit ? Number(id) : 0, tipoGasto: nombre})
            });
            if (!res.ok) throw new Error(isEdit ? "No se pudo actualizar el tipo de gasto" : "No se pudo crear el tipo de gasto");
            setEditMode(null, "");
            await cargarTipos();
        } catch (e) {
            console.error(e);
            setAlert(e?.message || "Error guardando tipo de gasto");
        }
    });

    btnAbrir.addEventListener("click", async () => {
        if (!modal) modal = new bootstrap.Modal(modalEl);
        modal.show();
        await cargarTipos();
    });

    // Carga inicial para el filtro, aunque no se abra el modal.
    void cargarTipos();
})();
