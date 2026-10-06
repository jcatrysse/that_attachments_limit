// Function: Administration > Plugins > Configure: set the limit; invalid values fall back to 10;
// only an administrator can reach it.
import { e2e } from '../../.codex/e2e/lib.mjs';
import { P, limit } from '../e2e-lib/helper.mjs';

const t = await e2e('settings');
const expect = (cond, msg) => { if (!cond) t.problems.push(msg); };
const SETTINGS = '/settings/plugin/that_attachments_limit';

async function save(value) {
  await t.go(SETTINGS);
  await t.page.fill('#settings_attachments_limit', value);
  await t.page.click('#settings-form input[type=submit], form input[name=commit]');
  await t.sudo();
  await t.settle();
  t.check(`save ${value}`);
}
async function formLimit() {
  await t.go(`/projects/${P}/issues/new`);
  return limit(t.page);
}

await t.login('admin');
await t.go('/admin/plugins');
await t.shot('plugin-list', 'The plugin is listed with a Configure link');
await t.go(SETTINGS);
expect(await t.page.inputValue('#settings_attachments_limit') === '3', 'the form does not show the stored 3');
await t.shot('settings-form', 'The settings form with the seeded value 3');

await save('7');
await t.go(SETTINGS);
expect(await t.page.inputValue('#settings_attachments_limit') === '7', 'the saved 7 is not shown');
await t.shot('saved-7', 'After saving 7 the form shows 7 (flash message gone after reload)');
expect(await formLimit() === 7, 'issue form does not use 7');

for (const bad of ['abc', '0', '-2', '']) {
  await save(bad);
  const got = await formLimit();
  expect(got === 10, `value "${bad}": issue form uses ${got}, expected the fallback 10`);
}
await t.shot('fallback-10', 'A blank/invalid setting makes the issue form use 10 (last tried: empty)');
await save('3');
expect(await formLimit() === 3, 'resetting to 3 did not work');

await t.login('manager');
await t.go(SETTINGS, { status: 403 });
await t.shot('manager-refused', 'A project manager (not an administrator) is refused (403)');
await t.login('reporter');
await t.go(SETTINGS, { status: 403 });
await t.shot('reporter-refused', 'A member without permissions is refused (403)');
await t.anonymous();
await t.go(SETTINGS);
expect(t.page.url().includes('/login'), 'anonymous is not sent to the login');
await t.shot('anonymous-login', 'Anonymous is redirected to the login page');
await t.done();
