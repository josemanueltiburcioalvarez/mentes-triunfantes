"use client";

import { useEffect } from "react";

// Registra el service worker (public/sw.js), que solo sirve la pagina de "sin conexion". En desarrollo no se
// registra para no mezclarse con el recargado en caliente.
export default function RegistrarSw() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // sin service worker la web funciona igual; solo falta la pagina de "sin conexion"
    });
  }, []);
  return null;
}
