import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

const KEY_PATH = join(process.cwd(), "certs", "localhost-key.pem");
const CERT_PATH = join(process.cwd(), "certs", "localhost-cert.pem");

const OPENSSL_CANDIDATES = [
  "openssl",
  "C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
  "C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe",
];

function findOpenssl(): string {
  for (const cmd of OPENSSL_CANDIDATES) {
    const result = spawnSync(cmd, ["version"], { encoding: "utf8" });
    if (result.status === 0) {
      return cmd;
    }
  }

  throw new Error(
    "openssl not found. Install Git for Windows or OpenSSL to generate HTTPS certificates.",
  );
}

function generateCerts(): void {
  mkdirSync(dirname(KEY_PATH), { recursive: true });
  const openssl = findOpenssl();
  const result = spawnSync(
    openssl,
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      KEY_PATH,
      "-out",
      CERT_PATH,
      "-days",
      "365",
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(`failed to generate TLS certs: ${result.stderr || result.stdout}`);
  }
}

export function loadHttpsCerts(): { key: Buffer; cert: Buffer } {
  if (!existsSync(KEY_PATH) || !existsSync(CERT_PATH)) {
    generateCerts();
  }

  return {
    key: readFileSync(KEY_PATH),
    cert: readFileSync(CERT_PATH),
  };
}
