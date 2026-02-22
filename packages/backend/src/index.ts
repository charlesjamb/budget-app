import { createApp } from "./app.js";
import { createDb } from "./db/connection.js";

const port = process.env.PORT || 3000;
const db = createDb();

const app = createApp(db);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
