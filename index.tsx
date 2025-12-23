import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const startApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("No se encontró el elemento root");
      return;
    }

    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error crítico de React:", error);
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="padding: 40px; text-align: center; font-family: system-ui;">
          <h1 style="color: #ef4444;">Error de Inicio</h1>
          <p style="color: #64748b;">La aplicación no pudo arrancar debido a un conflicto técnico.</p>
          <button onclick="window.location.reload()" style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px;">
            Recargar Aplicación
          </button>
        </div>
      `;
    }
  }
};

// Asegurar que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
