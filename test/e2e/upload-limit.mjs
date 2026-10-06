// Function: the number of files that can be uploaded at once is the configured one (3 in the
// seed) instead of core's hardcoded 10: picking files, dropping/pasting (uploadAndAttachFiles),
// the alert above the limit, the add button disappearing, saving, too-big files, refusals.
import { e2e } from '../../.codex/e2e/lib.mjs';
import { P, files, collectDialogs, limit, rows, waitUploaded } from '../e2e-lib/helper.mjs';

const t = await e2e('upload-limit');
const expect = (cond, msg) => { if (!cond) t.problems.push(msg); };

await t.login('manager');
const dialogs = collectDialogs(t.page);

// 1. Files one by one up to the limit, then save.
await t.go(`/projects/${P}/issues/new`);
expect(await limit(t.page) === 3, `window.maxFileUploads is ${await limit(t.page)}, expected 3`);
await t.page.fill('#issue_subject', `Limit scenario ${Date.now()}`);
await t.page.locator('input.file_selector').setInputFiles(files(2, 'a'));
await waitUploaded(t.page, 2);
let r = await rows(t.page);
expect(r.rows === 2 && r.addVisible, `after 2 files: ${JSON.stringify(r)}`);
await t.shot('two-of-three', 'Two files uploaded, the add button is still there (limit 3)');
await t.page.locator('input.file_selector').setInputFiles(files(1, 'b'));
await waitUploaded(t.page, 3);
r = await rows(t.page);
expect(r.rows === 3 && !r.addVisible, `after 3 files: ${JSON.stringify(r)}`);
expect(dialogs.length === 0, `alert raised at the limit: ${dialogs}`);
await t.shot('three-of-three', 'Three files uploaded, the add button is gone, no alert');
await t.page.click('#issue-form input[name=commit]');
await t.settle();
t.check('save with 3 files');
expect(await t.page.locator('.attachments .icon-attachment, .attachments a.icon-attachment, div.attachments p').count() >= 3 ||
       await t.page.locator('.attachments a[href*="/attachments/"]').count() >= 3, 'the saved issue does not show 3 attachments');
const links = await t.page.locator('.attachments a[href*="/attachments/"][href*="/a-"], .attachments a[href*="/attachments/"][href*="/b-"]').count();
expect(links >= 3, `the saved issue lists ${links} of 3 attachments`);
await t.shot('saved-with-three', 'The issue is saved with all three attachments');

// 2. More files than the limit in one go: alert, only 3 are kept.
dialogs.length = 0;
await t.go(`/projects/${P}/issues/new`);
await t.page.locator('input.file_selector').setInputFiles(files(5, 'c'));
await waitUploaded(t.page, 3);
await t.page.waitForTimeout(500);
r = await rows(t.page);
expect(r.rows === 3 && !r.addVisible, `after 5 files at once: ${JSON.stringify(r)}`);
expect(dialogs.length === 1, `expected one alert, got ${dialogs.length}`);
await t.shot('five-at-once', `Five files at once: only 3 are kept; alert text: "${dialogs[0]}"`);
expect(/\(3\)/.test(dialogs[0]) && !/\(10\)/.test(dialogs[0]), `the alert names the wrong limit: ${dialogs[0]}`);

// 3. Drop/paste path (uploadAndAttachFiles) with one file already present.
dialogs.length = 0;
await t.go(`/projects/${P}/issues/new`);
await t.page.locator('input.file_selector').setInputFiles(files(1, 'd'));
await waitUploaded(t.page, 1);
await t.page.evaluate(() => {
  const dt = new DataTransfer();
  ['e', 'f', 'g'].forEach(n => dt.items.add(new File(['x'], `${n}.txt`, { type: 'text/plain' })));
  uploadAndAttachFiles(dt.files, $('input.file_selector').first());
});
await waitUploaded(t.page, 3);
await t.page.waitForTimeout(500);
r = await rows(t.page);
expect(r.rows === 3 && !r.addVisible, `after drop of 3 on 1: ${JSON.stringify(r)}`);
expect(dialogs.length === 1, `drop above the limit: expected one alert, got ${dialogs.length}`);
await t.shot('drop-above-limit', '1 file present, 3 dropped: the list stops at 3 and the alert is shown');

// 4. A file above the size limit is refused with the core alert.
dialogs.length = 0;
await t.go(`/projects/${P}/issues/new`);
await t.page.locator('input.file_selector').setInputFiles([{ name: 'big.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(6 * 1024 * 1024) }]);
await t.page.waitForTimeout(500);
r = await rows(t.page);
expect(dialogs.length === 1 && /5/.test(dialogs[0]) && r.rows === 0, `oversize: alerts ${dialogs}, ${JSON.stringify(r)}`);
await t.shot('too-big', `A 6 MB file is refused; alert "${dialogs[0]}"`);

// 5. Without any plugin permission (there are none): a reporter gets the same limit.
await t.login('reporter');
const dialogsR = collectDialogs(t.page);
await t.go(`/projects/${P}/issues/new`);
expect(await limit(t.page) === 3, 'reporter: limit is not 3');
await t.page.locator('input.file_selector').setInputFiles(files(4, 'r'));
await waitUploaded(t.page, 3);
await t.page.waitForTimeout(500);
r = await rows(t.page);
expect(r.rows === 3 && dialogsR.length === 1, `reporter: ${JSON.stringify(r)}, alerts ${dialogsR.length}`);
await t.shot('reporter-limit', 'A member without special permissions is held to the same limit');

// 6. No access: outsider on a private project; anonymous (redirected to the login).
await t.login('outsider');
await t.go('/projects/e2e-private/issues/new', { status: 403 });
await t.shot('outsider-refused', 'An outsider cannot reach the upload form of a private project');
await t.anonymous();
await t.go(`/projects/${P}/issues/new`);
expect(t.page.url().includes('/login'), 'anonymous is not sent to the login');
await t.shot('anonymous-login', 'Anonymous cannot reach the upload form: redirected to the login');

await t.done();
