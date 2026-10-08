const fs = require('fs');
const QRCode = require('/tmp/gameshop24-card-build.xOXaXD/node_modules/qrcode');

(async () => {
  const root = '/Users/vladislavolejnik/Desktop/Nintendo';
  const out = `${root}/gameshop24-editable.svg`;
  const site = await QRCode.toDataURL('https://gameshop24.ru/', { margin: 1, width: 240, errorCorrectionLevel: 'H' });
  const telegram = await QRCode.toDataURL('https://web.telegram.org/k/#@GameShopHelp', { margin: 1, width: 240, errorCorrectionLevel: 'H' });
  const red = '#ed1026', cyan = '#11bce9', white = '#f5f5f7', muted = '#a8a9b0', dark = '#1e2025', black = '#101216';
  const text = (x, y, value, size, fill = white, weight = 500, anchor = 'start', extra = '') => `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" ${extra}>${value}</text>`;
  const icon = (x, y, symbol) => `<g id="icon-${symbol}" transform="translate(${x} ${y})"><circle r="27" fill="none" stroke="${white}" stroke-width="5"/><text y="10" text-anchor="middle" fill="${white}" font-family="Arial" font-size="27">${symbol}</text></g>`;
  const card = (x, side) => `<g id="${side}-card" transform="translate(${x} 86)">
    <rect id="${side}-background" width="1000" height="588" rx="30" fill="${dark}"/>
    <rect id="${side}-cyan-controller" x="0" y="0" width="180" height="588" rx="30" fill="${cyan}"/>
    <path id="${side}-cyan-cut" d="M180 0H235L180 588H0V520Z" fill="${cyan}"/>
    <path id="${side}-red-controller" d="M765 0H1000V588H765L820 0Z" fill="${red}"/>
    <g id="${side}-buttons" fill="#111318" stroke="#282b31" stroke-width="5">
      <circle cx="70" cy="175" r="38"/><circle cx="66" cy="260" r="17"/><circle cx="32" cy="300" r="17"/><circle cx="100" cy="300" r="17"/><circle cx="66" cy="340" r="17"/>
      <circle cx="900" cy="190" r="25"/><circle cx="950" cy="235" r="25"/><circle cx="900" cy="280" r="25"/><circle cx="850" cy="235" r="25"/><circle cx="900" cy="420" r="42"/>
    </g>
    ${side === 'front' ? `<g id="front-brand">
      ${text(260, 190, 'GAMESHOP', 65, white, 800)}${text(720, 190, '24', 65, red, 800)}${text(820, 190, '.RU', 65, white, 800)}
      <path d="M260 222H920" stroke="${cyan}" stroke-width="5"/><path d="M590 222H920" stroke="${red}" stroke-width="5"/>
      ${text(500, 270, 'NINTENDO SWITCH', 27, muted, 500, 'middle', 'letter-spacing="8"')}
      ${text(260, 348, 'ПРОДАЖА', 22, white, 700)}${text(420, 348, '•', 22, cyan, 700)}${text(450, 348, 'НАСТРОЙКА', 22, white, 700)}${text(650, 348, '•', 22, cyan, 700)}${text(680, 348, 'ПРОШИВКА', 22, white, 700)}${text(870, 348, '•', 22, cyan, 700)}${text(900, 348, 'ИГРЫ', 22, white, 700)}
    </g>` : `<g id="back-info">
      ${icon(180, 110, '⚙')}${text(230, 118, 'ПРОШИВКА И НАСТРОЙКА', 24, white, 700)}<path d="M230 145H470" stroke="${cyan}" stroke-width="4"/><path d="M350 145H470" stroke="${red}" stroke-width="4"/>
      ${icon(180, 205, '☎')}${text(230, 214, '+7 926 676 34 88', 29, white, 500)}
      ${icon(180, 300, '⌖')}${text(230, 309, 'Москва, Митинская 10, корп. 1', 25, white, 500)}
      ${text(230, 350, 'метро Волоколамское', 24, white, 500)}
      <g id="site-qr"><rect x="650" y="62" width="185" height="185" rx="14" fill="#0f1115" stroke="${cyan}" stroke-width="4"/><image href="${site}" x="682" y="94" width="121" height="121"/><text x="742" y="275" fill="${white}" font-family="Arial" font-size="22" font-weight="700" text-anchor="middle">САЙТ</text></g>
      <g id="telegram-qr"><rect x="650" y="315" width="185" height="185" rx="14" fill="#0f1115" stroke="${red}" stroke-width="4"/><image href="${telegram}" x="682" y="347" width="121" height="121"/><text x="742" y="528" fill="${white}" font-family="Arial" font-size="22" font-weight="700" text-anchor="middle">TELEGRAM</text></g>
    </g>`}
  </g>`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2080" height="760" viewBox="0 0 2080 760">
  <rect id="presentation-background" width="2080" height="760" fill="#eef0f4"/>
  ${card(0, 'front')}${card(1080, 'back')}
</svg>`;
  fs.writeFileSync(out, svg);
  console.log(out);
})();
