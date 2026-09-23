import { migrateLegacyFacts, type LegacyStorageSnapshot, type RestEngineMigration } from "./migration.ts";

export const REST_ENGINE_STORAGE_KEYS = {
  snapshot: "driverPayApp:restEngine:v1:migration:snapshot",
  staging: "driverPayApp:restEngine:v1:migration:staging",
  current: "driverPayApp:restEngine:v1:migration:current",
  marker: "driverPayApp:restEngine:v1:migration:complete",
  derivedCache: "driverPayApp:restEngine:v1:derived-cache",
} as const;

export type KeyValueStorage = {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type MigrationWriteOptions = {
  beforeCommit?: () => void;
};

export function captureStorageSnapshot(storage: KeyValueStorage): LegacyStorageSnapshot {
  const snapshot: LegacyStorageSnapshot = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key == null || key.startsWith("driverPayApp:restEngine:v1:")) continue;
    const value = storage.getItem(key);
    if (value != null) snapshot[key] = value;
  }
  return Object.fromEntries(Object.entries(snapshot).sort(([left], [right]) => left.localeCompare(right)));
}

function parseMigration(value: string | null): RestEngineMigration | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<RestEngineMigration>;
    return parsed.namespace === "driverPayApp:restEngine:v1"
      && parsed.migrationVersion === 1
      && Array.isArray(parsed.facts)
      && typeof parsed.sourceSnapshotHash === "string"
      ? parsed as RestEngineMigration
      : null;
  } catch {
    return null;
  }
}

export function readCurrentMigration(storage: KeyValueStorage): RestEngineMigration | null {
  return parseMigration(storage.getItem(REST_ENGINE_STORAGE_KEYS.current));
}

/**
 * Snapshot and staging are written before the commit marker. No legacy key is
 * changed or removed, so an interrupted migration remains recoverable.
 */
export function migrateLegacyStorage(
  storage: KeyValueStorage,
  asOfEpochMilliseconds: number,
  options: MigrationWriteOptions = {},
): RestEngineMigration {
  const snapshot = captureStorageSnapshot(storage);
  const current = readCurrentMigration(storage);
  const migration = migrateLegacyFacts(snapshot, asOfEpochMilliseconds, current);
  storage.setItem(REST_ENGINE_STORAGE_KEYS.snapshot, JSON.stringify(snapshot));
  storage.setItem(REST_ENGINE_STORAGE_KEYS.staging, JSON.stringify(migration));
  options.beforeCommit?.();
  storage.setItem(REST_ENGINE_STORAGE_KEYS.current, JSON.stringify(migration));
  storage.setItem(REST_ENGINE_STORAGE_KEYS.marker, JSON.stringify({ migrationVersion: 1, sourceSnapshotHash: migration.sourceSnapshotHash }));
  storage.removeItem(REST_ENGINE_STORAGE_KEYS.staging);
  return migration;
}

export function recoverInterruptedMigration(storage: KeyValueStorage): RestEngineMigration | null {
  const staged = parseMigration(storage.getItem(REST_ENGINE_STORAGE_KEYS.staging));
  if (staged) {
    const current = readCurrentMigration(storage);
    if (!current || current.sourceSnapshotHash !== staged.sourceSnapshotHash) {
      storage.setItem(REST_ENGINE_STORAGE_KEYS.current, JSON.stringify(staged));
      storage.setItem(REST_ENGINE_STORAGE_KEYS.marker, JSON.stringify({ migrationVersion: 1, sourceSnapshotHash: staged.sourceSnapshotHash }));
      storage.removeItem(REST_ENGINE_STORAGE_KEYS.staging);
      return staged;
    }
    storage.removeItem(REST_ENGINE_STORAGE_KEYS.staging);
    return current;
  }
  return readCurrentMigration(storage);
}

export function invalidateStoredDerivedCache(storage: KeyValueStorage): void {
  storage.removeItem(REST_ENGINE_STORAGE_KEYS.derivedCache);
}

/** Returns the untouched pre-migration snapshot for audit or rollback view. */
export function readLegacyRollbackSnapshot(storage: KeyValueStorage): LegacyStorageSnapshot | null {
  const raw = storage.getItem(REST_ENGINE_STORAGE_KEYS.snapshot);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as LegacyStorageSnapshot : null;
  } catch {
    return null;
  }
}
