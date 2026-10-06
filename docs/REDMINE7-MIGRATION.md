# Redmine 7 migration: that_attachments_limit

Start a Claude Code (or Codex) session on this repository, branch `redmine70-migration`, with:

> Read CLAUDE.md and docs/REDMINE7-MIGRATION.md, then carry out the Redmine 7 migration of this
> plugin as described there, on branch redmine70-migration. That includes the plugin's tests on
> PostgreSQL and MariaDB, every function exercised end to end on a real running Redmine in a
> browser (with and without permissions, failure paths included) with screenshots you looked at,
> and an OpenAI review of the diff when OPENAI_API_KEY is set. Report to me in Dutch at the end.

This file is the plan and the memory of that work. Update it as you go: verdicts, results,
what is left. Written 2026-10-06 from a measured analysis (report at the bottom).

## Status

| | |
|---|---|
| Plugin id | `that_attachments_limit` |
| GEOxyz runs today | `master` |
| Upstream | ThatCompany/that_attachments_limit master @ 444a4ee (2019-12-13) |
| Runs on Redmine 7 as is | NEE (fixed on this branch, see "Result of the migration session") |
| Upstream sync | UPSTREAM DOOD |
| After sync | n.v.t. |
| Complexity (1 trivial .. 5 rewrite) | 2 |
| Measured on | Redmine 7.0.1 (7.0-stable-GEOxyz + latest 7.0-stable), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16 and MariaDB 10.11 |
| Branch head when this file was written | `c621077` |

## Already on this branch

- `871f032` Bring addFile in line with Redmine 6+ SVG icons

## Result of the migration session (2026-10-06)

Measured on Redmine 7.0.1 (7.0-stable-GEOxyz), Ruby 3.3.6, PostgreSQL 16.15 and MariaDB 10.11.14.

| | PostgreSQL | MariaDB |
|---|---|---|
| Baseline plugin tests (before) | none existed | none existed |
| Plugin tests after | 7 runs, 64 assertions, 0 failures | 7 runs, 64 assertions, 0 failures |
| e2e (production mode) | smoke 11 shots, core 6, other-forms 5, settings 7, upload-limit 9, 0 problems | same, 0 problems |

Baseline e2e before changes (branch head with 871f032): smoke 11/0, core 6/0 on PostgreSQL.
The new tests fail without the fix: breaking the fallback to 10 in `_form.html.erb` gave 2 failures.
Migrations: the plugin has none. Boot and production eager load: the e2e server runs in production mode.

Verdicts on the GEOxyz changes:

| commit | verdict |
|---|---|
| `baff6c2` Make it work under Redmine 5 | kept (the `render :parent` locals in `_form.html.erb`, needed so 5.x/6/7 locals pass through). Test: new integration tests render the form on 7.0. |
| `4d3e401` limit also in uploadAndAttachFiles | kept; covered by e2e drop/paste scenario (`upload-limit`, drop-above-limit). Core in 7.0 still hardcodes 10 there. |
| `871f032` SVG icons like Redmine 6+ | kept, this is what makes uploads work on 7.0 |

Changed in this session: tests added (`test/integration/attachments_limit_test.rb`), the alert text now
names the configured limit instead of core's hardcoded (10), e2e scenarios with screenshots in `docs/e2e/`.

Webhooks (item 5): the plugin neither hides nor changes issue data, so nothing to do for Redmine 7 webhooks.
Together with the other GEOxyz plugins (item 7): not run, those plugins are not available in this session. Left for the coordinator harness.
Not done: run on 5.1-stable and "before" pictures on 5.1 (this branch is not meant to stay 5.1-compatible in this session). Item 1 (manual staging upload test) is covered by the e2e scenarios, a staging check by a person is still sensible.
Not testable here: a real paste of a screenshot from the clipboard; `uploadAndAttachFiles` is exercised directly (same path as drop and paste).
OpenAI review: `docs/reviews/openai-2026-10-06-d9ccdc2.md`, both findings resolved there.

### Inventory of functions

| function | how a user reaches it | scenario | screenshot |
|---|---|---|---|
| Configure the limit | Administration > Plugins > Configure (admin) | `settings` | `settings-settings-form.png`, `settings-saved-7.png`, `settings-fallback-10.png` |
| Limit refused for non-admins | same URL as manager, reporter, anonymous | `settings` | `settings-manager-refused.png`, `settings-reporter-refused.png`, `settings-anonymous-login.png` |
| Fallback to 10 for blank, 0, negative, text | settings | `settings`, integration test | `settings-fallback-10.png` |
| Limit on file pick (add button hides) | new issue form | `upload-limit` | `upload-limit-two-of-three.png`, `upload-limit-three-of-three.png`, `upload-limit-saved-with-three.png` |
| Alert above the limit, names the limit | pick 5 files at once | `upload-limit` | `upload-limit-five-at-once.png` |
| Limit on drop/paste (`uploadAndAttachFiles`) | drop or paste files | `upload-limit` | `upload-limit-drop-above-limit.png` |
| Size limit still applies | 6 MB file | `upload-limit` | `upload-limit-too-big.png` |
| Same limit for members without permissions | reporter | `upload-limit` | `upload-limit-reporter-limit.png` |
| No access | outsider on private project, anonymous | `upload-limit` | `upload-limit-outsider-refused.png`, `upload-limit-anonymous-login.png` |
| Other forms | wiki, news, document, files, issue edit | `other-forms` | `other-forms-*.png` |

## Open questions for Jan

- The alert text is fixed in the plugin's JS by replacing the number 10 in core's localized message. The alternative is to leave core's wrong text. Recommendation: keep the fix (the plugin is dropped at 7.1 anyway).
- The plugin shadows core's `addFile` and `uploadAndAttachFiles` (item 3). Recommendation: keep until the move to 7.1 (#18556), then remove the plugin.

## Work list for the migration session

In this order: things that break, security, the GEOxyz changes, the open items, then the checks.

**Open items from the analysis** (Dutch; where they conflict with a decision or a priority item above, those win)

1. Manually re-test uploads on staging (issue, wiki, news, pasted screenshot)
2. Drop the plugin when moving to Redmine 7.1 (#18556)
3. Plugin shadows core addFile/uploadAndAttachFiles: future core fixes (e.g. #44556) stay hidden; upload error path (#43381) not verified live

**Checks**

4. Run the plugin's whole test suite on Redmine 7.0-stable-GEOxyz with PostgreSQL AND MariaDB, and once on 5.1-stable if the branch is meant to stay 5.1-compatible.
5. Check Redmine 7 webhooks against this plugin (see "Rules"), and note the result here even if nothing is needed.
6. Verify every feature of the plugin by hand on a running Redmine 7 (screenshots).

## GEOxyz changes to review or re-apply

These GEOxyz commits are on the branch GEOxyz runs today and therefore on this branch. Review each one against the code it now sits on (upstream merges and Redmine 7 core): drop it if upstream or core now does the same, rewrite it if it is not up to the quality rules below (tests, I18n, security, portability), keep it otherwise. Record the verdict per commit in this file.

| commit | date | subject |
|---|---|---|
| `baff6c2` | 2025-04-27 | Make it work under Redmine 5 |
| `4d3e401` | 2022-10-24 | 1. Hack the max-number-of-files-message to consider window.maxFileUploads. 2. Small typo fix. |

## After the upgrade (production)

Actions the person doing the upgrade must take, or know about, for this plugin:

- Drop the plugin when GEOxyz moves to Redmine 7.1 (max_attachments_at_once, #18556).

## How to test

```sh
./.codex/redmine_clone.sh 7.0-stable-GEOxyz      # or 5.1-stable / 6.1-stable / 7.0-stable
./.codex/test_setup.sh                                 # RMP_DB=mariadb for MariaDB, RMP_PROVISION_DB=0 if a server runs
./.codex/test_plugin.sh                                # minitest + rspec of this plugin
```

```sh
./.codex/start_server.sh       # real Redmine (production mode) with this plugin, seeded users and projects
./.codex/e2e.sh                # browser: smoke over the plugin's pages, core issue flows, test/e2e/*.mjs
./.codex/openai_review.sh      # independent OpenAI review of the diff, only when OPENAI_API_KEY is set
```
Write one scenario per function in `test/e2e/<function>.mjs` (example at the top of
`.codex/e2e/lib.mjs`); screenshots and a table per scenario land in `docs/e2e/`. Users:
`admin`, `manager` (every permission), `reporter` (no plugin permissions), `outsider` (no
membership); password `Redmine7Test!`. Needs Node with Playwright and Chromium
(`npm install -g playwright && npx playwright install --with-deps chromium`).

On GitHub the same runs by hand only: Actions > "Redmine tests (manual)" > Run workflow (tick
"e2e" for the browser run; screenshots come back as an artifact).

The coordinator's harness (`plugin-check.sh` in the migration kit, kept outside this repo) adds a
browser smoke test of every page the plugin adds and runs all GEOxyz plugins together; the
results quoted in the analysis come from it.

## How the migration session works (same for every plugin)

1. **Start**: `git fetch && git checkout redmine70-migration && git pull`. Read this whole file,
   including the analysis report at the bottom. Do not reopen decisions recorded here.
2. **Baseline, before you change anything**:
   - the plugin's tests on Redmine 7.0-stable-GEOxyz with PostgreSQL and with MariaDB;
   - a real running Redmine with this plugin (`./.codex/start_server.sh`) and the browser run
     (`./.codex/e2e.sh`: smoke over every page the plugin adds, plus the core issue flows).
   Write the numbers here. Something already broken now is a finding, not your regression.
3. **Inventory of functions**: list every function of the plugin in this file, in a table
   "function | how a user reaches it | scenario | screenshot". Take them from the README,
   `init.rb` (permissions, menus, settings, project modules), routes, hooks and view
   overrides, macros, mail handling, API endpoints, rake tasks and cron jobs. This table is the
   coverage list for step 8; a function that is not in it will not be tested.
4. **GEOxyz changes**: go through the table above, one item at a time. Each kept or re-made change
   is its own commit with a test that proves it. Record the verdict in the table.
5. **Work list**: then the numbered list, in order. One concern per commit.
6. **Portability**: everything must run on Redmine's supported databases (PostgreSQL,
   MySQL/MariaDB; SQLite where the plugin already supports it). Migrations must be reversible and
   are run down and up on PostgreSQL and MariaDB.
7. **Together**: run with the other GEOxyz plugins installed (the migration kit's harness, or
   `RMP_EXTRA_PLUGINS`). A failure that only appears in combination is a finding to record here.
8. **End to end, visually, every function**: on the real Redmine from `start_server.sh`
   (production mode, the way GEOxyz runs it), write one scenario per function in
   `test/e2e/<function>.mjs` with `.codex/e2e/lib.mjs` and run them with `./.codex/e2e.sh`.
   - Each function as the users that matter: `admin`, `manager` (every permission, the
     plugin's included), `reporter` (member without the plugin's permissions), `outsider`
     (no membership, private project must stay invisible).
   - The failure paths too: setting off, permission absent, empty state, invalid input, the
     value that used to raise. A refusal that is shown is evidence as much as a success.
   - One screenshot per function and per path, with a caption saying what it proves. Open
     every screenshot and look at it: a picture nobody looked at proves nothing. Commit them
     in `docs/e2e/` and list them in the inventory table.
   - Functions without a page (mail in and out, REST API, rake tasks, cron, webhooks): exercise
     them against the same running instance (mails land in `redmine/tmp/mails`, `t.mails()`
     reads them; API through `t.page.request`) and record command and result.
   - Before pictures where behaviour or layout changes: the branch GEOxyz runs today, on
     Redmine 5.1, same scenarios, `RMP_E2E_OUT=docs/e2e/before`.
   - Run the whole e2e set once on MariaDB as well (`RMP_DB=mariadb`, then `start_server.sh --reset`).
9. **Independent review**: first your own, adversarial: re-read the whole diff as if someone
   else wrote it and you are paid to reject it. Then, **when `OPENAI_API_KEY` is set in the
   session**, `./.codex/openai_review.sh`: it sends the diff of this branch to an OpenAI model
   and writes `docs/reviews/openai-<date>-<sha>.md`. Every finding gets a `Resolution:` line
   there (fixed in <commit>, with a test, or why not). Fix, re-run the tests and the e2e set,
   and run the review again until it has nothing new that you accept. Without the key: write
   "OpenAI review: skipped, no OPENAI_API_KEY" in the report; never send code anywhere else.
10. **After the upgrade**: anything the production upgrade must do for this plugin (data fixes,
    settings, cron, files, removed features) goes into the section "After the upgrade".
11. **Finish**: update "Status", the inventory and the work list in this file, push
    `redmine70-migration`, and report: what changed, test numbers on both databases, e2e
    numbers (scenarios, screenshots, problems), the review result, what is left, what needs Jan.

### Stop and ask Jan when
- a GEOxyz change would be lost or behave differently for users;
- a new gem, a new setting with user impact, or a schema change not required by Redmine 7 seems needed;
- the change would send data to an external service (the OpenAI review of the code diff is the
  one exception Jan approved, and only when the key is present);
- upstream and GEOxyz disagree on behaviour and both are defensible.

## Rules

- **Target**: Redmine 7.0-stable-GEOxyz (https://github.com/jcatrysse/redmine), Rails 8.1, Ruby 3.3+.
  Core sources for comparison: branches `5.1-stable`, `6.1-stable`, `7.0-stable`, `7.0-stable-GEOxyz`.
- **Evidence**: never report a test, lint, browser check or review as passed without having seen
  it. Quote the summary lines; list the screenshots. "Should work" is not a result, and a green
  test suite is not proof that a feature works in the browser.
- **Tests**: never skip, delete or weaken a test. A test that encodes Redmine 5 markup or
  behaviour is updated to Redmine 7, with the reason in the commit. Every fix gets a test that
  fails without it.
- **Minimal diffs** in the plugin's own style. No reformatting, no unrelated refactoring.
  Something wrong elsewhere: write it down here, do not fix it in passing.
- **Security**: authorization on every action and entry point; `safe_attributes`, never
  `to_unsafe_hash` into `update`; no SQL built from params; no secrets in logs; no `html_safe` on
  user input.
- **Webhooks (new in Redmine 7)**: core sends issue payloads (core `issues/show.api.rsb`, rendered
  as the webhook owner) to webhook endpoints, past plugin hooks and controller patches. If the
  plugin hides, adds or changes issue data, make webhooks consistent with that or record why not.
- **Redmine 7 conventions**: SVG icons through `sprite_icon` (the `icon icon-*` CSS is gone),
  Propshaft assets under `assets/` (`/assets/plugin_assets/<id>/...`), the new header and user menu,
  `ContextMenus::*Controller`, Loofah-based text formatting, Chart.js as an ES module, sudo mode
  (on by default: `t.sudo()` in a scenario). The breaker list is in the migration kit's CHECKLIST.md.
- **Locales**: keep the locales the plugin ships in sync; translate a new key by matching the
  closest existing key in the same file, not from scratch; do not add new languages.
- **5.1 compatibility**: prefer fixes that also run on Redmine 5.1 so they can be merged early;
  say so when a fix cannot.
- **Git**: work on `redmine70-migration` only; never push to the default branch; never force-push
  a branch someone else uses. Descriptive commit messages (what and why). Push after every
  commit, together with the updated status in this file: a cloud session can stop at a usage
  limit, and work that is not pushed is lost with its container.
- **GitHub Actions**: manual only (`workflow_dispatch`). Do not add push, pull_request or schedule
  triggers.

## Definition of done

- All items of the work list are done or explicitly deferred with a reason, in this file.
- The plugin's tests are green on Redmine 7.0-stable-GEOxyz with PostgreSQL and MariaDB
  (numbers in this file); boot, production-like eager load, migrations up/down OK.
- Every function in the inventory exercised end to end on a real running Redmine, with and
  without permissions and on its failure paths; `./.codex/e2e.sh` green; screenshots looked at,
  committed in `docs/e2e/` and listed.
- Review done: your own, and the OpenAI review when the key is present, every finding resolved
  in `docs/reviews/`.
- No new failure when run together with the other GEOxyz plugins.
- "After the upgrade" lists every action production needs; "Status" is current.


## Analysis report (2026-10-06, Dutch)

# that_attachments_limit
- Gebruikte branch: master @ baff6c2 (2025-04-27) - plugin id that_attachments_limit, versie 0.0.2
- Upstream: ThatCompany/that_attachments_limit - upstream HEAD master @ 444a4ee (2019-12-13), enige branch
- Fork t.o.v. upstream: 2 eigen commits (4d3e401 limiet ook in uploadAndAttachFiles, baff6c2 Redmine 5), 0 upstream-commits ontbreken
- Andere relevante branches: geen.
- Gemfile: `render_parent ~> 0.1.0` (0.1.0 in de bundle). Geen migraties, geen tests.
- Werking: override van core-partial app/views/attachments/_form.html.erb (rendert core via `render :parent` en zet `window.maxFileUploads`) + assets/javascripts/attachments.js die de core-functies `addFile` en `uploadAndAttachFiles` vervangt door kopieën met `10` -> `window.maxFileUploads`.

## 1. Werkt out of the box op Redmine 7?   NEE
- Harness (results/1006-085544-...): alles OK, smoke 60/60 - maar de smoke uploadt niets.
- Live (limiet 3): uploaden is kapot voor élk formulier. De plugin-kopie van `addFile` dateert van 5.1; core-`ajaxUpload` in 7.0 zoekt het SVG-icoon dat de 7.0-`addFile` toevoegt en geeft het aan `updateSVGIcon` -> `pageerror: Cannot read properties of undefined (reading 'getElementsByTagName')`. Gevolg: geen upload, token leeg, limiet-alert verschijnt niet, bij opslaan gaan de gekozen bestanden stil verloren (alleen de native file-input-fallback hing toevallig het laatste bestand aan).
- `render_parent` 0.1.0 werkt wél met Rails 8.1: de core-partial wordt gerenderd (`.attachments_icons` aanwezig).

## 2. Upstream sync?   UPSTREAM DOOD
- Upstream sinds 2019 stil, fork bevat alles. Geen onderhouden fork gevonden.

## 3. Werkt na sync op Redmine 7?   n.v.t.

## 4. Complexiteit en blokkers   score 2
- Blokkers:
  - assets/javascripts/attachments.js:1-25 - `addFile` gelijkgetrokken met 7.0: attachment- en delete-SVG klonen uit `.attachments_icons` zoals core; de limietwijziging zelf blijft. Op 5.1 zijn die iconen er niet en zijn de klonen leeg (geen effect) - gefixt in 871f032. Live na fix: 3 bestanden uploaden en worden bewaard, het 4de wordt geweigerd met de alert, "add"-knop verdwijnt, geen JS-fouten.
- Stille breuken:
  - De alert-tekst zegt "(10)": die komt uit core (`data-max-number-of-files-message`, hardgecodeerd 10, ook in 5.1). Pre-existing.
  - De plugin vervangt core-JS-functies: elke toekomstige core-wijziging aan `addFile`/`uploadAndAttachFiles` wordt verborgen (bv. #44556, fix in 6.1.5 voor plakken van afbeeldingen boven de limiet, zit nog niet in 7.0-stable).
  - #43381 (zichtbare foutmelding bij upload) en #44186 (lange extensies) zitten in core-code die de plugin niet vervangt; het foutpad zelf niet live kunnen verifiëren (upload met geweigerde extensie gaf 200).
- Overlap met Redmine core: Feature #18556 "max_attachments_at_once" in configuration.yml (standaard 50) is opgelost voor **7.1.0** (r25176), niet in 7.0. Bij overstap naar 7.1 is de plugin overbodig.
- Open werk voor ansif:
  - Uploads op staging nog eens manueel testen (issue, wiki, nieuws, plakken van een screenshot).
  - Plugin schrappen zodra GEOxyz naar Redmine 7.1 gaat; limiet dan via `max_attachments_at_once`.

## Branch redmine70-migration
- Basis: origin/master @ baff6c2
- Commits: 871f032 Bring addFile in line with Redmine 6+ SVG icons
- Eindresultaat harness (results/1006-094837-s3-that_attachments_limit_redmine70-migration): OK bundle, boot 0.0.2, eager load, migraties dev+test, OK smoke 60/60
- Rollback migraties: n.v.t.

