// SVG'dan barcha PWA ikonkalarini yaratadi: npm run icons
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

/** rounded: yumaloq burchak (any/favicon); scale: maskable uchun xavfsiz zona */
function svg({ rounded, scale = 1 }) {
  const rx = rounded ? 112 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc766"/><stop offset="1" stop-color="#f97316"/></linearGradient>
    <linearGradient id="moon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d5bd0"/><stop offset="1" stop-color="#2a1f6b"/></linearGradient>
    <clipPath id="disc"><circle cx="256" cy="256" r="190"/></clipPath>
    <mask id="crescent"><rect width="512" height="512" fill="#fff"/><circle cx="352" cy="322" r="30" fill="#000"/></mask>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="#1b1533"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <g clip-path="url(#disc)">
      <polygon points="0,0 512,0 0,512" fill="url(#sun)"/>
      <polygon points="512,0 512,512 0,512" fill="url(#moon)"/>
    </g>
    <circle cx="256" cy="256" r="190" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="6"/>
    <g fill="#fff7e0" stroke="#fff7e0" stroke-width="8" stroke-linecap="round">
      <circle cx="188" cy="188" r="24" stroke="none"/>
      <path d="M188 142v-14M188 234v14M142 188h-14M234 188h14M155 155l-10-10M221 221l10 10M155 221l-10 10M221 155l10-10"/>
    </g>
    <g mask="url(#crescent)"><circle cx="336" cy="336" r="32" fill="#e0e7ff"/></g>
    <circle cx="372" cy="290" r="6" fill="#e0e7ff"/><circle cx="290" cy="372" r="5" fill="#e0e7ff"/>
    <polyline points="198,262 242,306 318,222" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`
}

const png = (s, size) => sharp(Buffer.from(s)).resize(size, size).png().toBuffer()

writeFileSync(join(pub, 'favicon.svg'), svg({ rounded: true }))
const rounded = svg({ rounded: true })
const square = svg({ rounded: false })
const maskable = svg({ rounded: false, scale: 0.86 })

writeFileSync(join(pub, 'pwa-192x192.png'), await png(rounded, 192))
writeFileSync(join(pub, 'pwa-512x512.png'), await png(rounded, 512))
writeFileSync(join(pub, 'maskable-512x512.png'), await png(maskable, 512))
writeFileSync(join(pub, 'apple-touch-icon.png'), await png(square, 180))

// favicon.ico: ichiga PNG joylangan (16, 32, 48)
const sizes = [16, 32, 48]
const imgs = await Promise.all(sizes.map((n) => png(rounded, n)))
const head = Buffer.alloc(6)
head.writeUInt16LE(1, 2)
head.writeUInt16LE(sizes.length, 4)
let offset = 6 + 16 * sizes.length
const dirs = imgs.map((img, i) => {
  const d = Buffer.alloc(16)
  d.writeUInt8(sizes[i], 0)
  d.writeUInt8(sizes[i], 1)
  d.writeUInt16LE(1, 4)
  d.writeUInt16LE(32, 6)
  d.writeUInt32LE(img.length, 8)
  d.writeUInt32LE(offset, 12)
  offset += img.length
  return d
})
writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([head, ...dirs, ...imgs]))
console.log('Ikonkalar tayyor: public/')
