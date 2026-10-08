const QRCode = require('/tmp/gameshop24-card-build.xOXaXD/node_modules/qrcode');
const { execFileSync } = require('child_process');
const path = require('path');

(async () => {
  const root = '/Users/vladislavolejnik/Desktop/Nintendo';
  const base = '/Users/vladislavolejnik/.codex/generated_images/01a1019b-04a3-7811-b6b6-84e2fc4e8edf/exec-f6547aa1-2287-475c-b6a2-0e3fd7bea9f4.png';
  const avito = path.join(root, 'qr-avito-bottom.png');
  const site = path.join(root, 'qr-site-bottom.png');
  const telegram = path.join(root, 'qr-telegram-bottom.png');
  const one = path.join(root, 'gameshop24-bottom-step1.png');
  const two = path.join(root, 'gameshop24-bottom-step2.png');
  const final = path.join(root, 'gameshop24-card-bottom-qr-final.png');
  const opts = { width: 105, margin: 1, errorCorrectionLevel: 'H' };
  await QRCode.toFile(avito, 'https://www.avito.ru/brands/10402122fe5f9d4acebe66457899043d/all/igry_pristavki_i_programmy?gdlkerfdnwq=101&page_from=from_item_card_icon&iid=8346249715&sellerId=10402122fe5f9d4acebe66457899043d', opts);
  await QRCode.toFile(site, 'https://gameshop24.ru/', opts);
  await QRCode.toFile(telegram, 'https://web.telegram.org/k/#@GameShopHelp', opts);
  execFileSync('/opt/homebrew/bin/magick', [base, avito, '-geometry', '+976+528', '-composite', one]);
  execFileSync('/opt/homebrew/bin/magick', [one, site, '-geometry', '+1142+528', '-composite', two]);
  execFileSync('/opt/homebrew/bin/magick', [two, telegram, '-geometry', '+1308+528', '-composite', final]);
  console.log(final);
})();
