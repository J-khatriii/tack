import { useEffect, useState } from "react";
import { getDb } from "../storage/db.js";
import { ensureDefaultProject } from "../storage/seed.js";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      await ensureDefaultProject();
      const db = await getDb();
      setData({
        projects: await db.getAll("projects"),
        columns: await db.getAll("columns"),
      });
    })();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <pre className="rounded-lg border border-border bg-surface p-6 text-xs text-fg-muted">
        {data ? JSON.stringify(data, null, 2) : "loading..."}
      </pre>
    </div>
  );
}

export default App;