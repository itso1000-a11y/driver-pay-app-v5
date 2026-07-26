# Driver Pay App — Architecture Overview

## Product layers

### Application shell / PWA

Responsible for startup, install/update behaviour, manifest, service worker, cache identity, responsive mobile layout and local persistence. A PWA change can affect installed users even when business logic is unchanged, so cache/version consistency is mandatory.

### Day state

Stores the working record for each date: day type, Start, Finish, kilometres, extras, pay context and completion state. Suggestions must not be confused with stored Start values.

### Rest Engine

Calculates factual rest context from real Finish/Start data and tracks reduced daily rest, weekly rest candidates and compensation obligations. It must not depend on employer pay policy.

### Pay Engine

Calculates earnings from the saved day and the active/snapshotted payment model. It must not decide legal rest compliance.

### Pay Profiles / Settings

Profiles are reusable configurations. Settings are the current working values. An active profile owns the Settings context. Historical calculations need snapshots so future profile edits cannot rewrite the past.

### Week and Archive

The active week is editable working state. End Week closes the pay period and stores history. Archive navigation must restore the correct week and pay-profile context without turning old records into live settings.

### Persistence and backup

LocalStorage is the current persistence base. Backup v2 exports a complete snapshot. Any future storage migration must preserve existing user data and provide rollback or safe fallback.

## Key data-flow boundaries

1. **Finish → next Rest context**: Rest calculations begin from the real previous Finish.
2. **Suggestion → acceptance**: helper values remain transient until accepted.
3. **Profile → Settings**: loading/applying a profile sets working pay values.
4. **Settings → saved day snapshot**: the historical record should preserve the exact applied context.
5. **Active week → Archive**: End Week stores a stable record and begins weekly-rest handling.
6. **State → Backup**: complete storage snapshot is exported; restore is atomic.

## Areas currently concentrated in `src/App.tsx`

The current application contains substantial UI, state and engine logic in one large file. Do not perform broad refactoring merely for cleanliness. Any future extraction should be its own planned architecture release with behaviour-preserving regression proof.

## Compatibility rule

New fields must be optional or safely sanitised for old data unless a migration is explicitly designed. Never assume every existing user record contains the latest shape.
