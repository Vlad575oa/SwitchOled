const fs = require('fs');
const QRCode = require('/tmp/gameshop24-card-build.xOXaXD/node_modules/qrcode');

(async () => {

const out = '/Users/vladislavolejnik/Desktop/Nintendo/gameshop24-business-card.svg';
const qr = await QRCode.toDataURL('https://gameshop24.ru/', { margin: 0, width: 420, errorCorrectionLevel: 'H' });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const W = 2080, H = 760, cardW = 1000, cardH = 588, y = 86;
const common = `font-family="Arial, Helvetica, sans-serif"`;
const bg = '#29292f', red = '#e30620', white = '#f8f8f8', muted = '#8b8b93';

const front = `
<g transform="translate(0 ${y})">
  <rect width="${cardW}" height="${cardH}" rx="30" fill="${bg}"/>
  <circle cx="900" cy="92" r="8" fill="${red}" opacity=".9"/><circle cx="930" cy="92" r="8" fill="#f5c400" opacity=".9"/><circle cx="960" cy="92" r="8" fill="#23a7db" opacity=".9"/>
  <rect x="80" y="164" width="158" height="158" rx="42" fill="${red}"/>
  <text x="159" y="278" text-anchor="middle" fill="white" font-size="104" font-weight="800" ${common}>G</text>
  <text x="292" y="204" fill="${muted}" font-size="28" letter-spacing="10" font-weight="700" ${common}>PREMIUM STORE</text>
  <text x="292" y="290" fill="${white}" font-size="70" font-weight="800" letter-spacing="-2" ${common}>GAMESHOP<tspan fill="${red}">24</tspan></text>
  <text x="82" y="420" fill="${white}" font-size="29" font-weight="700" ${common}>NINTENDO SWITCH</text>
  <text x="82" y="470" fill="${muted}" font-size="24" ${common}>ПРОДАЖА  •  ПРОШИВКА  •  НАСТРОЙКА</text>
  <path d="M82 518 H918" stroke="${red}" stroke-width="5"/>
  <text x="82" y="550" fill="${muted}" font-size="18" letter-spacing="3" ${common}>gameshop24.ru</text>
</g>`;

const back = `
<g transform="translate(${cardW + 80} ${y})">
  <rect width="${cardW}" height="${cardH}" rx="30" fill="${bg}"/>
  <path d="M0 0 H1000 V588 H0 Z" fill="url(#redGlow)" opacity=".16"/>
  <text x="80" y="84" fill="${white}" font-size="25" font-weight="700" letter-spacing="4" ${common}>КОНСОЛИ И СЕРВИС</text>
  <text x="80" y="142" fill="${white}" font-size="40" font-weight="800" ${common}>GAMESHOP<tspan fill="${red}">24</tspan></text>
  <rect x="80" y="190" width="300" height="300" rx="16" fill="white"/>
  <image href="${qr}" x="105" y="215" width="250" height="250" preserveAspectRatio="none"/>
  <text x="230" y="530" text-anchor="middle" fill="${muted}" font-size="20" ${common}>QR НА САЙТ</text>
  <g transform="translate(470 205)">
    <text x="0" y="0" fill="${red}" font-size="24" font-weight="800" ${common}>СВЯЗАТЬСЯ</text>
    <text x="0" y="62" fill="${white}" font-size="30" font-weight="700" ${common}>+7 926 676 34 88</text>
    <text x="0" y="122" fill="${white}" font-size="25" ${common}>Telegram: @GameShopHelp</text>
    <text x="0" y="195" fill="${red}" font-size="24" font-weight="800" ${common}>АДРЕС</text>
    <text x="0" y="245" fill="${white}" font-size="24" ${common}>Москва, Митинская 10,</text>
    <text x="0" y="282" fill="${white}" font-size="24" ${common}>корп. 1</text>
    <path d="M0 330 H430" stroke="${red}" stroke-width="4"/>
    <text x="0" y="375" fill="${muted}" font-size="20" ${common}>gameshop24.ru</text>
  </g>
</g>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2080" height="760" viewBox="0 0 2080 760">
  <defs><linearGradient id="redGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${red}"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs>
  <rect width="2080" height="760" fill="#111114"/>
  ${front}${back}
</svg>`;
fs.writeFileSync(out, svg);
console.log(out);
})();
