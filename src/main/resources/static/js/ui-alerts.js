document.addEventListener("DOMContentLoaded", () => {
    if (window.__mpAlertsReady) return;
    window.__mpAlertsReady = true;

    const host = document.createElement("div");
    host.id = "mpAlertHost";
    host.className = "mp-alert-host";
    document.body.appendChild(host);

    const ensureContainer = () => host;

    const show = (type, message, title = "") => {
        const container = ensureContainer();
        const item = document.createElement("div");
        item.className = `mp-alert mp-alert-${type}`;
        item.innerHTML = `
            <div class="mp-alert-content">
                ${title ? `<strong>${title}</strong>` : ""}
                <div>${String(message ?? "")}</div>
            </div>
            <button type="button" class="mp-alert-close" aria-label="Cerrar">×</button>
        `;
        const close = () => {
            item.classList.add("is-hiding");
            setTimeout(() => item.remove(), 180);
        };
        item.querySelector(".mp-alert-close")?.addEventListener("click", close);
        container.appendChild(item);
        requestAnimationFrame(() => item.classList.add("is-visible"));
        setTimeout(close, type === "error" ? 6000 : 3500);
    };

    window.mpAlert = {
        success(message, title = "Operacion exitosa") {
            show("success", message, title);
        },
        error(message, title = "Error") {
            show("error", message, title);
        },
        warning(message, title = "Atencion") {
            show("warning", message, title);
        },
        info(message, title = "Info") {
            show("info", message, title);
        }
    };

    window.alert = function (message) {
        window.mpAlert?.info(message, "Aviso");
    };
});
