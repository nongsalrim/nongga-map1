const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const FILES = [
  { html: '협약서_멘토링_신길호.html', prefix: '협약서_멘토링_신길호' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const { html, prefix } of FILES) {
    const filePath = 'file:///' + path.join(__dirname, html).replace(/\\/g, '/');
    const page = await browser.newPage();

    // A4 너비 기준 고해상도 (2x scale)
    await page.setViewport({ width: 900, height: 1400, deviceScaleFactor: 2 });
    await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 30000 });

    // 구글 폰트 로드 대기
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 1500));

    // 각 .page div를 개별 캡처
    const pageEls = await page.$$('.page');
    console.log(`[${html}] .page 요소 ${pageEls.length}개 발견`);

    for (let i = 0; i < pageEls.length; i++) {
      const el = pageEls[i];
      const outFile = path.join(__dirname, `${prefix}_p${i + 1}.jpg`);
      await el.screenshot({
        path: outFile,
        type: 'jpeg',
        quality: 95,
      });
      console.log(`  → 저장: ${outFile}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\n완료!');
})();
