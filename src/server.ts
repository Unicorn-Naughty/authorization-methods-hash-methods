import { createApp } from "./presentation/app";
import { redis } from "./infrastructure/db/redis.client";
import { db } from "./infrastructure/db/prisma.client";

const PORT = Number(process.env.PORT ?? 3000);

const app = await createApp();

const server = app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close();
  await Promise.allSettled([redis.quit(), db.$disconnect()]);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
