#!/usr/bin/env node
/**
 * Genera íconos PNG para la PWA usando sharp (si está disponible) o SVG fallback.
 * Ejecutar: node scripts/generate-icons.js
 */

const fs   = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT   = path.join(__dirname, '../public/icons');

// SVG base del ícono El Jale (letra J con color brand)
const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#FF6B00"/>
  <text x="256" y="340" font-family="Arial Black, sans-serif" font-size="320" font-weight="900" fill="white" text-anchor="middle">J</text>
</svg>`;

fs.mkdirSync(OUT, { recursive: true });

// Intentar usar sharp para PNG
try {
  const sharp = require('sharp');

  Promise.all(SIZES.map(size =>
    sharp(Buffer.from(svgTemplate(size)))
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`))
      .then(() => console.log(`✓ icon-${size}.png`))
  )).then(() => console.log('\n✅ Íconos PNG generados en public/icons/'));

} catch (e) {
  // Sin sharp: guardar como SVG (funciona como fallback)
  console.warn('⚠️  sharp no está instalado. Guardando SVGs como fallback...');
  console.warn('   Para PNG reales: npm install sharp && node scripts/generate-icons.js\n');

  SIZES.forEach(size => {
    fs.writeFileSync(path.join(OUT, `icon-${size}.png`), svgTemplate(size));
    console.log(`✓ icon-${size}.png (SVG)`);
  });
  console.log('\n✅ Íconos SVG guardados como .png en public/icons/');
}
