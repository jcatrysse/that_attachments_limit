# upload-limit

Run 2026-10-06T19:39:53.500Z against http://127.0.0.1:3000.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](upload-limit-two-of-three.png) | manager | `/projects/e2e-project/issues/new` | Two files uploaded, the add button is still there (limit 3) |
| ![](upload-limit-three-of-three.png) | manager | `/projects/e2e-project/issues/new` | Three files uploaded, the add button is gone, no alert |
| ![](upload-limit-saved-with-three.png) | manager | `/issues/10` | The issue is saved with all three attachments |
| ![](upload-limit-five-at-once.png) | manager | `/projects/e2e-project/issues/new` | Five files at once: only 3 are kept; alert text: "This file cannot be uploaded because it exceeds the maximum number of files that can be attached simultaneously (3)" |
| ![](upload-limit-drop-above-limit.png) | manager | `/projects/e2e-project/issues/new` | 1 file present, 3 dropped: the list stops at 3 and the alert is shown |
| ![](upload-limit-too-big.png) | manager | `/projects/e2e-project/issues/new` | A 6 MB file is refused; alert "This file cannot be uploaded because it exceeds the maximum allowed file size (5 MB)" |
| ![](upload-limit-reporter-limit.png) | reporter | `/projects/e2e-project/issues/new` | A member without special permissions is held to the same limit |
| ![](upload-limit-outsider-refused.png) | outsider | `/projects/e2e-private/issues/new` | An outsider cannot reach the upload form of a private project |
| ![](upload-limit-anonymous-login.png) | anonymous | `/login?back_url=http%3A%2F%2F127.0.0.1%3A3000%2Fprojects%2Fe2e-project%2Fissues%2Fnew` | Anonymous cannot reach the upload form: redirected to the login |
