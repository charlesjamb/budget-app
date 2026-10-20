import Database from "better-sqlite3";

const OLD_EMAIL = "constance@budget.app";
const NEW_EMAIL = "mathilde@budget.app";

const DISPLAY_NAMES: Record<string, string> = {
  "charles@budget.app": "Charles",
  [NEW_EMAIL]: "Mathilde",
};

const sqlite = new Database(process.env.DB_PATH ?? "budget.db");
sqlite.pragma("foreign_keys = ON");

const run = sqlite.transaction(() => {
  const renamed = sqlite
    .prepare("UPDATE users SET email = ? WHERE email = ?")
    .run(NEW_EMAIL, OLD_EMAIL);
  console.log(`Renamed ${OLD_EMAIL} -> ${NEW_EMAIL}: ${renamed.changes} row(s)`);

  const setName = sqlite.prepare("UPDATE users SET display_name = ? WHERE email = ?");
  for (const [email, name] of Object.entries(DISPLAY_NAMES)) {
    const result = setName.run(name, email);
    console.log(`display_name of ${email} = ${name}: ${result.changes} row(s)`);
  }
});

run();
sqlite.close();
