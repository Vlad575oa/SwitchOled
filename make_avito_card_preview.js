const QRCode = require('/tmp/gameshop24-card-build.xOXaXD/node_modules/qrcode');
const { execFileSync } = require('child_process');
const path = require('path');

(async () => {
  const root = '/Users/vladislavolejnik/Desktop/Nintendo';
  const base = '/Users/vladislavolejnik/.codex/generated_images/01a1019b-04a3-7811-b6b6-84e2fc4e8edf/exec-784fc089-d261-48c4-a9a7-434d44149293.png';
  const site = path.join(root, 'qr-site-final.png');
  const telegram = path.join(root, 'qr-telegram-final.png');
  const avito = path.join(root, 'qr-avito-final.png');
  const step1 = path.join(root, 'gameshop24-avito-step1.png');
  const step2 = path.join(root, 'gameshop24-avito-step2.png');
  const final = path.join(root, 'gameshop24-card-avito-final.png');
  const opts = { width: 111, margin: 1, errorCorrectionLevel: 'H' };
  await QRCode.toFile(avito, 'https://www.avito.ru/brands/10402122fe5f9d4acebe66457899043d/all/igry_pristavki_i_programmy?gdlkerfdnwq=101&page_from=from_item_card_icon&iid=8346249715&sellerId=10402122fe5f9d4acebe66457899043d', opts);
  await QRCode.toFile(site, 'https://gameshop24.ru/', opts);
  await QRCode.toFile(telegram, 'https://web.telegram.org/k/#@GameShopHelp', opts);
  execFileSync('/opt/homebrew/bin/magick', [base, avito, '-geometry', '+1190+382', '-composite', step1]);
  execFileSync('/opt/homebrew/bin/magick', [step1, site, '-geometry', '+1324+382', '-composite', step2]);
  execFileSync('/opt/homebrew/bin/magick', [step2, telegram, '-geometry', '+1458+382', '-composite', final]);
  console.log(final);
})();
