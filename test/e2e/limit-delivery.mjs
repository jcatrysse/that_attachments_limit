// Function: the limit script reaches every attachments form through a view hook (no render_parent):
// limit 2 on the issue form, the issue note form and the wiki; unset (10); a single-file input.
import { e2e } from '../../.codex/e2e/lib.mjs';
import { P, files, collectDialogs, limit, rows, waitUploaded } from '../e2e-lib/helper.mjs';

const t = await e2e('limit-delivery');
const expect = (cond, msg) => { if (!cond) t.problems.push(msg); };
const SETTINGS = '/settings/plugin/that_attachments_limit';

async function setLimit(value) {
  await t.login('admin');
  await t.go(SETTINGS);
  await t.page.fill('#settings_attachments_limit', value);
  await t.page.click('#settings-form input[type=submit], form input[name=commit]');
  await t.sudo();
  await t.settle();
  t.check(`save ${value}`);
}
// The plugin's addFile replaced core's: it reads window.maxFileUploads instead of a hardcoded 10.
const pluginWins = () => t.page.evaluate(() => String(window.addFile).includes('maxFileUploads') &&
  String(window.uploadAndAttachFiles).includes('maxFileUploads'));

async function pickThree(name, url, before) {
  dialogs.length = 0;
  await t.go(url);
  if (before) await before();
  expect(await limit(t.page) === 2, `${name}: window.maxFileUploads is ${await limit(t.page)}, expected 2`);
  expect(await pluginWins(), `${name}: core addFile/uploadAndAttachFiles are in use, not the plugin's`);
  await t.page.locator('input.file_selector').first().setInputFiles(files(3, name));
  await waitUploaded(t.page, 2);
  await t.page.waitForTimeout(500);
  const r = await rows(t.page);
  expect(r.rows === 2 && !r.addVisible, `${name}: ${JSON.stringify(r)}`);
  expect(dialogs.length === 1 && /\(2\)/.test(dialogs[0]), `${name}: alerts ${JSON.stringify(dialogs)}`);
  await t.shot(`${name}-limit-2`, `${name}: limit 2, 3 files picked, the third refused with "${dialogs[0]}", add button gone`);
}

// 1. Limit 2.
await setLimit('2');
await t.login('manager');
const dialogs = collectDialogs(t.page);
await pickThree('issue-new', `/projects/${P}/issues/new`);
await pickThree('issue-note', '/issues/1', async () => {
  await t.page.locator('#content .contextual a.icon-edit').first().click();
  await t.page.waitForSelector('#update', { state: 'visible' });
});
await pickThree('wiki', `/projects/${P}/wiki/Wiki/edit`);

// 2. Limit unset: core's 10.
await setLimit('');
await t.login('manager');
const dialogs10 = collectDialogs(t.page);
await t.go(`/projects/${P}/issues/new`);
expect(await limit(t.page) === 10, `unset: window.maxFileUploads is ${await limit(t.page)}, expected 10`);
await t.page.locator('input.file_selector').first().setInputFiles(files(11, 'ten'));
await waitUploaded(t.page, 10);
await t.page.waitForTimeout(500);
let r = await rows(t.page);
expect(r.rows === 10 && !r.addVisible, `unset: ${JSON.stringify(r)}`);
expect(dialogs10.length === 1 && /\(10\)/.test(dialogs10[0]), `unset: alerts ${JSON.stringify(dialogs10)}`);
await t.shot('unset-limit-10', `Limit unset: 11 files picked, 10 kept, alert "${dialogs10[0]}"`);

// 3. Single-file input (attachment custom field): stays 1, also through uploadAndAttachFiles.
dialogs10.length = 0;
await t.go('/projects/e2e-private/issues/new');
const single = t.page.locator('input.file_selector.custom-field-filedrop');
expect(await single.count() === 1 && await single.getAttribute('multiple') === null, 'no single-file custom field input');
await t.page.evaluate(() => {
  const dt = new DataTransfer();
  ['s1', 's2'].forEach(n => dt.items.add(new File(['x'], `${n}.txt`, { type: 'text/plain' })));
  uploadAndAttachFiles(dt.files, $('input.file_selector.custom-field-filedrop').first());
});
await t.page.waitForFunction(() => $('input.custom-field-filedrop').closest('.attachments_form').find('input.token').filter((i, e) => e.value).length >= 1, null, { timeout: 15000 });
await t.page.waitForTimeout(500);
const s = await t.page.evaluate(() => {
  const form = $('input.custom-field-filedrop').closest('.attachments_form');
  return { rows: form.find('.attachments_fields > span').length, addVisible: form.find('.add_attachment').is(':visible') };
});
expect(s.rows === 1 && !s.addVisible, `single file: ${JSON.stringify(s)}`);
expect(dialogs10.length === 1 && /\(1\)/.test(dialogs10[0]), `single file: alerts ${JSON.stringify(dialogs10)}`);
await t.shot('single-file', `Single-file custom field: 2 files dropped, 1 kept, alert "${dialogs10[0]}"`);

// Back to the seeded 3 for the other scenarios.
await setLimit('3');
await t.done();
