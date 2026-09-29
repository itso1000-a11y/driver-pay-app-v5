import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


if ("serviceWorker" in navigator) {
  let refreshing = false;

  function showUpdatePrompt(registration: ServiceWorkerRegistration) {
    if (document.getElementById("driver-pay-update-banner")) return;

    const banner = document.createElement("div");
    banner.id = "driver-pay-update-banner";
    banner.style.position = "fixed";
    banner.style.left = "12px";
    banner.style.right = "12px";
    banner.style.bottom = "12px";
    banner.style.zIndex = "99999";
    banner.style.padding = "12px";
    banner.style.borderRadius = "16px";
    banner.style.background = "#0f172a";
    banner.style.color = "white";
    banner.style.boxShadow = "0 14px 34px rgba(15,23,42,.28)";
    banner.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr auto";
    row.style.gap = "10px";
    row.style.alignItems = "center";

    const text = document.createElement("div");
    text.textContent = "New version available";
    text.style.fontSize = "14px";
    text.style.fontWeight = "800";

    const button = document.createElement("button");
    button.textContent = "Update";
    button.style.border = "0";
    button.style.borderRadius = "12px";
    button.style.padding = "9px 12px";
    button.style.fontWeight = "900";
    button.style.background = "white";
    button.style.color = "#0f172a";

    button.onclick = () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      } else {
        window.location.reload();
      }
    };

    row.appendChild(text);
    row.appendChild(button);
    banner.appendChild(row);
    document.body.appendChild(banner);
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdatePrompt(registration);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdatePrompt(registration);
          }
        });
      });

      // Check occasionally while the app is open. This helps same-version v5 clean rebuilds.
      setInterval(() => {
        registration.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    }).catch(() => undefined);
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
