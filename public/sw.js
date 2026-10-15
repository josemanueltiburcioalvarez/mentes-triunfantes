// Service worker minimo: solo sirve una pagina de "sin conexion" cuando no hay internet.
// No guarda paginas ni datos de la cuenta (todo es en vivo), asi nunca muestra informacion vieja.
const CACHE = "mt-sin-conexion-v1";
const PAGINA_SIN_CONEXION = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([PAGINA_SIN_CONEXION, "/logo-emblema-blanco.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.mode !== "navigate") return;
  evento.respondWith(fetch(peticion).catch(() => caches.match(PAGINA_SIN_CONEXION)));
});
