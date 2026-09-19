import { createServer } from "node:https";
import { createApp } from "./presentation/app";
import { redis } from "./infrastructure/db/redis.client";
import { db } from "./infrastructure/db/prisma.client";
import { loadHttpsCerts } from "./infrastructure/https";

const PORT = Number(process.env.PORT ?? 3000);

const app = await createApp();
const { key, cert } = loadHttpsCerts();

const server = createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`Server started on https://localhost:${PORT}`);
});

function closeServer() {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  try {
    await closeServer();
    await Promise.allSettled([redis.quit(), db.$disconnect()]);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
