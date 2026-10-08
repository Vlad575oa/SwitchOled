const QRCode = require('/tmp/gameshop24-card-build.xOXaXD/node_modules/qrcode');
const { execFileSync } = require('child_process');
const path = require('path');

(async () => {
  const root = '/Users/vladislavolejnik/Desktop/Nintendo';
  const base = '/Users/vladislavolejnik/.codex/generated_images/01a1019b-04a3-7811-b6b6-84e2fc4e8edf/exec-b9688fe4-8f88-4c01-a3df-c5f1491da554.png';
  const siteQr = path.join(root, 'qr-site.png');
  const telegramQr = path.join(root, 'qr-telegram.png');
  const intermediate = path.join(root, 'gameshop24-card-intermediate.png');
  const final = path.join(root, 'gameshop24-card-final-preview.png');
  await QRCode.toFile(siteQr, 'https://gameshop24.ru/', { width: 122, margin: 1, errorCorrectionLevel: 'H' });
  await QRCode.toFile(telegramQr, 'https://web.telegram.org/k/#@GameShopHelp', { width: 122, margin: 1, errorCorrectionLevel: 'H' });
  execFileSync('/opt/homebrew/bin/magick', [base, siteQr, '-geometry', '+1290+384', '-composite', intermediate]);
  execFileSync('/opt/homebrew/bin/magick', [intermediate, telegramQr, '-geometry', '+1440+384', '-composite', final]);
  console.log(final);
})();
