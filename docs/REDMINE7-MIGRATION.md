# Redmine 7 migration: that_attachments_limit

Start a Claude Code (or Codex) session on this repository, branch `redmine70-migration`, with:

> Read CLAUDE.md and docs/REDMINE7-MIGRATION.md, then carry out the Redmine 7 migration of this
> plugin as described there, on branch redmine70-migration. Report to me in Dutch at the end.

This file is the plan and the memory of that work. Update it as you go: verdicts, results,
what is left. Written 2026-10-06 from a measured analysis (report at the bottom).

## Status

| | |
|---|---|
| Plugin id | `that_attachments_limit` |
| GEOxyz runs today | `master` |
| Upstream | ThatCompany/that_attachments_limit master @ 444a4ee (2019-12-13) |
| Runs on Redmine 7 as is | NEE |
| Upstream sync | UPSTREAM DOOD |
| After sync | n.v.t. |
| Complexity (1 trivial .. 5 rewrite) | 2 |
| Measured on | Redmine 7.0.1 (7.0-stable-GEOxyz + latest 7.0-stable), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16 and MariaDB 10.11 |
| Branch head when this file was written | `871f032` |

## Already on this branch

- `871f032` Bring addFile in line with Redmine 6+ SVG icons

## Work list for the migration session

In this order: things that break, security, the GEOxyz changes, the open items, then the checks.

**Open items from the analysis** (Dutch; where they repeat a priority item, the priority item wins)

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
On GitHub the same runs by hand only: Actions > "Redmine tests (manual)" > Run workflow.

The coordinator's harness (`plugin-check.sh` in the migration kit, kept outside this repo) adds a
browser smoke test of every page the plugin adds and runs all GEOxyz plugins together; the
results quoted in the analysis come from it.

## How the migration session works (same for every plugin)

1. **Start**: `git fetch && git checkout redmine70-migration && git pull`. Read this whole file,
   including the analysis report at the bottom. Do not reopen decisions recorded here.
2. **Baseline**: set up Redmine 7.0-stable-GEOxyz and run the plugin's tests on PostgreSQL and
   on MariaDB (see "How to test"). Write the numbers here before you change anything.
3. **GEOxyz changes**: go through the table above, one item at a time. Each kept or re-made change
   is its own commit with a test that proves it. Record the verdict in the table.
4. **Work list**: then the numbered list, in order. One concern per commit.
5. **Portability**: everything must run on Redmine's supported databases (PostgreSQL,
   MySQL/MariaDB; SQLite where the plugin already supports it). Migrations must be reversible and
   are run down and up on PostgreSQL and MariaDB.
6. **Browser**: start a Redmine 7 with this plugin, exercise every feature as admin and as a
   normal user with and without the plugin's permissions, and save screenshots (before on 5.1 or
   the old branch, after on 7.0) where behaviour or layout matters.
7. **Together**: run with the other GEOxyz plugins installed (the migration kit's harness, or
   `RMP_EXTRA_PLUGINS`). A failure that only appears in combination is a finding to record here.
8. **After the upgrade**: anything the production upgrade must do for this plugin (data fixes,
   settings, cron, files, removed features) goes into the section "After the upgrade".
9. **Finish**: update "Status" and the work list in this file, push `redmine70-migration`, and
   report: what changed, test numbers on both databases, what is left, what needs Jan.

### Stop and ask Jan when
- a GEOxyz change would be lost or behave differently for users;
- a new gem, a new setting with user impact, or a schema change not required by Redmine 7 seems needed;
- the change would send data to an external service;
- upstream and GEOxyz disagree on behaviour and both are defensible.

## Rules

- **Target**: Redmine 7.0-stable-GEOxyz (https://github.com/jcatrysse/redmine), Rails 8.1, Ruby 3.3+.
  Core sources for comparison: branches `5.1-stable`, `6.1-stable`, `7.0-stable`, `7.0-stable-GEOxyz`.
- **Evidence**: never report a test, lint or browser check as passed without having seen it.
  Quote the summary lines. "Should work" is not a result.
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
  `ContextMenus::*Controller`, Loofah-based text formatting, Chart.js as an ES module.
  The breaker list is in the migration kit's CHECKLIST.md.
- **Locales**: keep the locales the plugin ships in sync; translate a new key by matching the
  closest existing key in the same file, not from scratch; do not add new languages.
- **5.1 compatibility**: prefer fixes that also run on Redmine 5.1 so they can be merged early;
  say so when a fix cannot.
- **Git**: work on `redmine70-migration` only; never push to the default branch; never force-push
  a branch someone else uses. Descriptive commit messages (what and why).
- **GitHub Actions**: manual only (`workflow_dispatch`). Do not add push, pull_request or schedule
  triggers.

## Definition of done

- All items of the work list are done or explicitly deferred with a reason, in this file.
- The plugin's tests are green on Redmine 7.0-stable-GEOxyz with PostgreSQL and MariaDB
  (numbers in this file); boot, production-like eager load, migrations up/down OK.
- Every feature verified by hand on Redmine 7; screenshots listed.
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

