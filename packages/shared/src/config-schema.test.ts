import { describe, expect, it } from "vitest";
import { bullpenConfigSchema } from "./config-schema.js";

describe("bullpen config schema", () => {
  it("defaults omitted runtime paths to legacy instance-root locations", () => {
    const parsed = bullpenConfigSchema.parse({
      $meta: {
        version: 1,
        updatedAt: "2026-05-10T00:00:00.000Z",
        source: "configure",
      },
      database: {
        mode: "embedded-postgres",
      },
      logging: {
        mode: "file",
      },
      server: {},
    });

    expect(parsed.database.embeddedPostgresDataDir).toBe("~/.bullpen/instances/default/db");
    expect(parsed.database.backup.dir).toBe("~/.bullpen/instances/default/data/backups");
    expect(parsed.logging.logDir).toBe("~/.bullpen/instances/default/logs");
    expect(parsed.storage.localDisk.baseDir).toBe("~/.bullpen/instances/default/data/storage");
    expect(parsed.secrets.localEncrypted.keyFilePath).toBe("~/.bullpen/instances/default/secrets/master.key");
  });
});
