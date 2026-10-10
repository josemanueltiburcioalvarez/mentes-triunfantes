// Convierte las imagenes del mapa (JPG con fondo negro, generadas con IA) en WebP con transparencia.
//
//   node scripts/procesar-arte.mjs "E:\ruta\a\las\imagenes"
//
// El disco de la medalla se queda opaco (el centro oscuro no se vuelve transparente) y el brillo de afuera se
// pasa a transparencia usando su luminosidad, asi se ve bien sobre fondo oscuro y claro. Los archivos salen en
// public/arte/ y son los que usa el mapa (src/components/mapa/mapa-niveles.tsx).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const origen = process.argv[2];
if (!origen) {
  console.error('Uso: node scripts/procesar-arte.mjs "carpeta con los JPG"');
  process.exit(1);
}

const DESTINO = path.resolve("public/arte");
const SALIDA = 320; // px: se muestran a unos 70-100 px, esto deja margen para pantallas de alta densidad

// archivo de origen -> archivo de salida
const ARCHIVOS = {
  "Medalla Disponible.jpg": "medalla-disponible.webp",
  "Medalla Bloqueada.jpg": "medalla-bloqueada.webp",
  "Medalla dominada.jpg": "medalla-dominada.webp",
  "Portal de evaluación.jpg": "portal-listo.webp",
};

// radio (en fracciones del lado) hasta donde el disco es opaco y donde termina el desvanecido hacia el brillo
const R_OPACO = 0.428;
const R_FIN = 0.44;

const suave = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

fs.mkdirSync(DESTINO, { recursive: true });

for (const [entrada, salida] of Object.entries(ARCHIVOS)) {
  const ruta = path.join(origen, entrada);
  if (!fs.existsSync(ruta)) {
    console.warn(`(falta ${entrada}, se omite)`);
    continue;
  }
  const { data, info } = await sharp(ruta).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const lado = Math.min(w, h);
  const salidaRgba = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const o = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = Math.hypot(x - cx, y - cy) / lado;

      // brillo de afuera: sobre negro, el color se reparte entre "color" y "opacidad" (la luminosidad)
      const maximo = Math.max(r, g, b);
      const alfaBrillo = Math.min(1, (maximo / 255) * 1.35);
      const k = alfaBrillo > 0 ? 255 / Math.max(maximo, 1) : 0;
      const rb = Math.min(255, r * k);
      const gb = Math.min(255, g * k);
      const bb = Math.min(255, b * k);

      const t = suave(R_OPACO, R_FIN, dist); // 0 dentro del disco, 1 en el brillo
      salidaRgba[o] = r * (1 - t) + rb * t;
      salidaRgba[o + 1] = g * (1 - t) + gb * t;
      salidaRgba[o + 2] = b * (1 - t) + bb * t;
      salidaRgba[o + 3] = Math.round(255 * ((1 - t) + alfaBrillo * t));
    }
  }

  const destino = path.join(DESTINO, salida);
  await sharp(salidaRgba, { raw: { width: w, height: h, channels: 4 } })
    .resize({ width: SALIDA, height: SALIDA, kernel: "lanczos3" })
    .webp({ quality: 88, alphaQuality: 100, effort: 5 })
    .toFile(destino);
  console.log(`${salida}: ${(fs.statSync(destino).size / 1024).toFixed(0)} KB`);
}
