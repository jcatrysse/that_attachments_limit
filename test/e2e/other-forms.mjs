// Function: the limit applies to every form that uses the core attachments partial.
import { e2e } from '../../.codex/e2e/lib.mjs';
import { P, files, collectDialogs, limit, rows, waitUploaded } from '../e2e-lib/helper.mjs';

const t = await e2e('other-forms');
const expect = (cond, msg) => { if (!cond) t.problems.push(msg); };
await t.login('manager');
const dialogs = collectDialogs(t.page);

const forms = [
  ['wiki', `/projects/${P}/wiki/Wiki/edit`],
  ['news', `/projects/${P}/news/new`],
  ['document', `/projects/${P}/documents/new`],
  ['files', `/projects/${P}/files/new`],
  ['issue-edit', '/issues/1/edit'],
];
for (const [name, url] of forms) {
  dialogs.length = 0;
  await t.go(url);
  expect(await limit(t.page) === 3, `${name}: window.maxFileUploads is ${await limit(t.page)}`);
  await t.page.locator('input.file_selector').first().setInputFiles(files(4, name));
  await waitUploaded(t.page, 3);
  await t.page.waitForTimeout(500);
  const r = await rows(t.page);
  expect(r.rows === 3 && !r.addVisible && dialogs.length === 1, `${name}: ${JSON.stringify(r)}, alerts ${dialogs.length}`);
  await t.shot(name, `${name}: 4 files picked, 3 kept, alert shown, add button gone`);
}
await t.done();
