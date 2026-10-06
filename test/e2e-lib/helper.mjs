// Shared by the scenarios of this plugin.
export const P = 'e2e-project';

export function files(n, prefix = 'file', size = 20) {
  return Array.from({ length: n }, (_, i) => ({
    name: `${prefix}-${i + 1}.txt`, mimeType: 'text/plain', buffer: Buffer.alloc(size, 'x'),
  }));
}

// Collects (and accepts) the alerts the page raises.
export function collectDialogs(page) {
  const messages = [];
  page.on('dialog', d => { messages.push(d.message()); d.accept().catch(() => {}); });
  return messages;
}

export async function limit(page) {
  return page.evaluate(() => window.maxFileUploads);
}

// Number of rows in the attachments list and how many of them finished uploading (token set).
export async function rows(page) {
  return page.evaluate(() => ({
    rows: document.querySelectorAll('.attachments_fields > span').length,
    tokens: [...document.querySelectorAll('.attachments_fields input.token')].filter(i => i.value).length,
    addVisible: [...document.querySelectorAll('.add_attachment')].some(e => e.offsetParent !== null),
  }));
}

export async function waitUploaded(page, count) {
  await page.waitForFunction(
    n => [...document.querySelectorAll('.attachments_fields input.token')].filter(i => i.value).length >= n,
    count, { timeout: 15000 });
}
