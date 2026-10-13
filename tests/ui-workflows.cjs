const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'google-apps-script/Script.html'), 'utf8');
const page = fs.readFileSync(path.join(root, 'google-apps-script/Index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'google-apps-script/Styles.html'), 'utf8');
const login = fs.readFileSync(path.join(root, 'google-apps-script/Login.html'), 'utf8');

function between(source, from, until) {
  const start = source.indexOf(from);
  assert.ok(start >= 0, 'Missing code: ' + from);
  const end = source.indexOf(until, start);
  assert.ok(end > start, 'Missing end marker: ' + until);
  return source.slice(start, end);
}

// Exercise the actual production helpers without invoking the surrounding UI.
const parseContext = { Date, URL };
vm.runInNewContext(
  'const todayYmd="2026-10-13";\n' +
  between(script, '  const validImportedDate = ', '  const readPdfText = ') +
  '\n globalThis.parse=parseImportedProfile; globalThis.iso=toIsoDate;',
  parseContext
);
assert.equal(parseContext.iso('31/12/2020'), '2020-12-31');
assert.equal(parseContext.iso('2020-12-31'), '2020-12-31');
assert.equal(parseContext.iso('31/02/2020'), '', 'Impossible dates must be rejected');
assert.equal(parseContext.iso('13/10/2026'), '', 'Current date is not historical');
const p = parseContext.parse('Họ và tên: Nguyễn Văn A\nGiới tính: Nam\nNgày sinh: 01/01/1990\nEmail: a@example.com\n');
assert.equal(p.person_name, 'Nguyễn Văn A');
assert.equal(p.person_gender, '1');
assert.equal(p.person_dob, '1990-01-01');
assert.equal(p.person_email, 'a@example.com');

const safeContext = { URL };
vm.runInNewContext(
  between(script, '  const safePublicationUrl = ', '  const renderPublicationResults = ') +
  '\n globalThis.safe=safePublicationUrl;',
  safeContext
);
assert.equal(safeContext.safe('javascript:alert(1)'), '');
assert.equal(safeContext.safe('data:text/html,bad'), '');
assert.equal(safeContext.safe('https://doi.org/10.1000/xyz'), 'https://doi.org/10.1000/xyz');

const pdfContext = {
  window: {
    pdfjsLib: {
      GlobalWorkerOptions: {},
      getDocument: () => ({ promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({items: [
            {str: 'Họ và tên:', transform: [1,0,0,1,20,800]},
            {str: 'Nguyễn Văn A', transform: [1,0,0,1,150,800], hasEOL: true},
            {str: 'Ngày sinh:', transform: [1,0,0,1,20,780]},
            {str: '01/01/1990', transform: [1,0,0,1,150,780], hasEOL: true},
            {str: 'Email:', transform: [1,0,0,1,20,760]},
            {str: 'a@example.com', transform: [1,0,0,1,150,760], hasEOL: true}
          ]})
        })
      })})
    }
  },
  Uint8Array
};
vm.runInNewContext(
  between(script, '  const readPdfText = ', '  const readDocxText = ') +
  '\n globalThis.readPdf=readPdfText;',
  pdfContext
);

(async () => {
  const pdfText = await pdfContext.readPdf({arrayBuffer:async()=>new Uint8Array([37,80,68,70]).buffer});
  assert.match(pdfText, /Họ và tên: Nguyễn Văn A\nNgày sinh: 01\/01\/1990\nEmail:/);
  const imported = parseContext.parse(pdfText);
  assert.equal(imported.person_name, 'Nguyễn Văn A');
  assert.equal(imported.person_dob, '1990-01-01');

  // Regression guards for the connected UI flows.
  assert.match(script, /showProfileView\('general'\)/);
  assert.match(script, /addEventListener\('hashchange'/);
  assert.match(styles, /\.full-screen-section\[hidden\][^\n]*display:none!important/);
  assert.match(script, /Hãy kiểm tra rồi bấm Save để lưu hồ sơ/);
  assert.doesNotMatch(
    between(script, '  supportForm?.addEventListener', '  const workCurrent = '),
    /\.saveGeneral\(extracted/,
    'Imported values must not silently overwrite saved profiles'
  );
  assert.match(script, /if\(!await buildExportPreview\(\)\)throw new Error/);
  assert.match(page, /id="downloadExportPdf"/);
  assert.match(page, /id="downloadExportDoc"/);
  assert.match(page, /id="supportFile"/);
  assert.doesNotMatch(login, /recentGoogleAccounts|recentAccountRow/, 'Do not restore the recent-account chooser');

  console.log('PASS: PDF line extraction, imported field parsing and dates, safe publication links, single-view navigation, reviewed import and export guards.');
})().catch(error => { console.error(error); process.exitCode = 1; });
