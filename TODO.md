# TODO — Council Room

## موجود در رابط کاربری
- [x] Create RTL command-center shell and responsive layouts.
- [x] Show the agent roster, timeline, filters, disagreement examples, and judge panel as sample UI.
- [x] Add project-owner composer.
- [x] Add sample consultation scenario and role prompts.

## Runtime محلی
- [x] Send one prompt to the local OpenCode CLI from the desktop app.
- [x] Resolve the Windows OpenCode command through PATH, including npm command shims.
- [x] Restrict the OpenCode working directory to a canonical workspace root.
- [x] Validate the trusted Electron IPC sender.
- [x] Add automated tests for workspace boundary validation.
- [ ] Implement a real multi-agent orchestrator with independent agent runs.
- [ ] Persist run state, messages, tool calls, and results in an event store.
- [ ] Implement real pause/cancel for running tasks.
- [ ] Implement a real final judge over agent outputs.

## امنیت و یکپارچه‌سازی
- [ ] Add a user-controlled workspace picker and persist its approved path.
- [ ] Implement secure secret storage and real provider connection checks.
- [ ] Implement real approval records linked to specific actions.
- [ ] Implement GitHub branch, commit, checks, and Draft PR flow.
- [ ] Add integration and end-to-end tests on Windows.
- [ ] Verify the packaged Electron app on a real Windows machine.

**وضعیت:** داشبورد هنوز یک جلسه چندایجنتی واقعی نیست. دکمه‌های تأیید و Gateway نیز به سرویس اجرایی متصل نیستند.
