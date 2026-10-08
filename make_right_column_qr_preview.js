const QRCode = require('/tmp/gameshop24-card-build.xOXaXD/node_modules/qrcode');
const { execFileSync } = require('child_process');
const path = require('path');

(async () => {
  const root = '/Users/vladislavolejnik/Desktop/Nintendo';
  const base = '/Users/vladislavolejnik/.codex/generated_images/01a1019b-04a3-7811-b6b6-84e2fc4e8edf/exec-84e43f2a-2635-4e5e-aaa4-8577eba72942.png';
  const site = path.join(root, 'qr-site-column.png');
  const telegram = path.join(root, 'qr-telegram-column.png');
  const intermediate = path.join(root, 'gameshop24-column-step.png');
  const final = path.join(root, 'gameshop24-card-right-column-final.png');
  const opts = { width: 112, margin: 1, errorCorrectionLevel: 'H' };
  await QRCode.toFile(site, 'https://gameshop24.ru/', opts);
  await QRCode.toFile(telegram, 'https://web.telegram.org/k/#@GameShopHelp', opts);
  execFileSync('/opt/homebrew/bin/magick', [base, site, '-geometry', '+1432+300', '-composite', intermediate]);
  execFileSync('/opt/homebrew/bin/magick', [intermediate, telegram, '-geometry', '+1432+488', '-composite', final]);
  console.log(final);
})();
