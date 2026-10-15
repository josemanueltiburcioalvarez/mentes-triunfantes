// Genera los iconos de la app instalable (PWA / APK) a partir del emblema M·T.
//
//   node scripts/generar-iconos.mjs
//
// Salida: public/icons/icon-192.png, icon-512.png, icon-maskable-512.png y src/app/apple-icon.png (180 px).
// El icono "maskable" deja el emblema dentro del 60 % central porque Android recorta los bordes
// (circulo, cuadrado redondeado...) segun el telefono.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const FONDO = "#0a0a0a";
const EMBLEMA = path.resolve("public/logo-emblema-blanco.png");

fs.mkdirSync(path.resolve("public/icons"), { recursive: true });

async function icono(lado, proporcionEmblema, destino) {
  const anchoEmblema = Math.round(lado * proporcionEmblema);
  const emblema = await sharp(EMBLEMA).resize({ width: anchoEmblema }).toBuffer();
  const brillo = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}">
       <defs><radialGradient id="g" cx="50%" cy="50%" r="55%">
         <stop offset="0%" stop-color="#10b981" stop-opacity="0.28"/>
         <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
       </radialGradient></defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
     </svg>`
  );
  await sharp({ create: { width: lado, height: lado, channels: 4, background: FONDO } })
    .composite([
      { input: brillo, top: 0, left: 0 },
      { input: emblema, gravity: "center" },
    ])
    .png()
    .toFile(destino);
  console.log(`${path.relative(".", destino)} (${lado}x${lado})`);
}

await icono(192, 0.74, path.resolve("public/icons/icon-192.png"));
await icono(512, 0.74, path.resolve("public/icons/icon-512.png"));
await icono(512, 0.56, path.resolve("public/icons/icon-maskable-512.png"));
await icono(180, 0.74, path.resolve("src/app/apple-icon.png"));
