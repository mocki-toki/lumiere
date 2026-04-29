# Bot Matrix Buttons E2E Checklist

Use this checklist before promoting a release that includes bot inline buttons.

## 1) Static Validation (Lumiere repo)
- [ ] Run `eslint` on modified files.
- [ ] Confirm no new lint errors were introduced.
- [ ] If typecheck baseline issues exist, confirm they are unchanged by this release.

## 2) Matrix Manual E2E (Room)
- [ ] Bot message containing `io.lumiere.bot.reply_markup` renders buttons under the message.
- [ ] Single click sends exactly one `io.lumiere.bot.callback` event.
- [ ] Single click triggers expected bot action.
- [ ] Rapid double/triple click on the same message sends only one callback while pending.
- [ ] Buttons re-enable after the callback request settles.
- [ ] With `showHiddenEvents=false`, callback event is hidden.
- [ ] With `showHiddenEvents=true`, callback event is visible.
- [ ] Bot command flow that returns button markup still works.

## 3) Bot Runtime Smoke
- [ ] Runtime container/service restarts cleanly.
- [ ] No startup errors in runtime logs.
- [ ] Callback path logs normal handling.
- [ ] Rapid repeated clicks do not produce duplicate action execution.

## 4) Non-Git Host Change Log
If runtime docs/config are edited in a non-git environment, capture:
- Backup command used (with timestamp in filename).
- Exact edited file paths.
- Commands run for restart and log checks.
- Short pass/fail outcome.

## 5) Final Consistency Check
- [ ] `docs/bot-matrix-buttons-v1.md` matches implemented behavior.
- [ ] Lumiere README links to protocol + E2E docs.
- [ ] Runtime docs match current callback flow and limitation notes.

## 6) Session Status (2026-04-29)
- Static validation (`eslint` on modified client files): `PASS` (warnings only, no errors).
- Matrix manual E2E: `NOT RUN` in this workspace.
- Bot runtime smoke: `NOT RUN` in this workspace.
