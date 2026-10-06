# OpenAI review d9ccdc2

Model `gpt-5`, range `fa7c49edc8..d9ccdc2`, 11 file(s), 1 request(s), 22530 tokens.

Add a `Resolution:` line under every finding: fixed in <commit>, or why not.

## Part 1 of 1

Major, test/e2e/other-forms.mjs:14
Hardcoded /issues/1/edit is not tied to the seeded e2e project, making the scenario nondeterministic and authorization-dependent. In a fresh Redmine, issue ID 1 typically belongs to a different project (e.g., ecookbook). A user “manager” seeded only into e2e-project will get 403 on /issues/1/edit, so the test fails even though the plugin works.
Failure: On a clean run with the standard seed, the step to open /issues/1/edit returns 403 and the subsequent assertions never run.
Fix: Create an issue in the e2e project first and edit that one, or retrieve an issue ID that belongs to P. For example:
- Navigate to /projects/${P}/issues/new, create the issue, capture its ID from the redirected URL, then visit /issues/<that_id>/edit.
- Or ensure the harness seeds a known issue in P and use that ID (do not hardcode 1).

Minor, assets/javascripts/attachments.js:57-58
Brittle string replacement of the alert text: tooManyMessage.replace('10', window.maxFileUploads). This only replaces the first ASCII “10” and assumes the localized message contains “10” exactly once. If the locale changes the formatting, uses non-ASCII digits, or Redmine alters the sentence to include “10” more than once, the alert will show contradictory limits (e.g., “(3)… up to 10 files…”), or it won’t update at all.
Failure: With an English core string that includes “10” twice (e.g., “Cannot upload more than 10 files (10).”), only the first occurrence becomes “3”, leaving the second “10” visible; in some locales the “10” token may not be present, so the alert remains wrong.
Fix: Patch the numeric count robustly. For example:
- Prefer rendering the correct count server-side into a separate data attribute (e.g., data-max-number-of-files-template with a placeholder) and format it with the actual count.
- Or, minimally, replace all standalone numbers using a regex: 
  var msg = String($(inputEl).data('max-number-of-files-message'));
  var patched = msg.replace(/\b10\b/g, String(window.maxFileUploads));
  window.alert($(inputEl).prop('multiple') ? patched : msg);
Additionally, use .prop('multiple') for boolean attributes.

## Resolutions

1. Major, other-forms.mjs hardcoded /issues/1/edit: not changed. The generic seed (.codex/e2e/seed.rb) creates its first issue in e2e-project, and smoke.mjs and core.mjs rely on /issues/1 the same way. The scenario passed on PostgreSQL and MariaDB (screenshot other-forms-issue-edit.png shows the form of that issue).
2. Minor, attachments.js replace of the first "10": fixed in the next commit (regex /\b10\b/g, all standalone occurrences). `.attr('multiple') == 'multiple'` kept on purpose, it is what core uses for the same check.
