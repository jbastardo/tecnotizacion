import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";

// Algunos plugins usan `require` para resolver dependencias
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    // Módulos que NO se pueden bundlear porque:
    // - cargan binarios nativos (.node)
    // - usan path traversal dinámico para leer archivos hermanos
    // - dependen de workers del sistema operativo
    external: [
      // Binarios nativos
      "*.node",
      "sharp",
      "canvas",
      "bcrypt",
      "argon2",
      "re2",
      "cpu-features",
      "isolated-vm",
      "fsevents",
      // pg-native: la app usa `pg` (JS puro), pero lo externalizamos por si acaso
      "pg-native",
      // WebSocket internals opcionales de ws/uWebSockets
      "bufferutil",
      "utf-8-validate",
      // lightningcss: binario nativo, cargado dinámicamente
      "lightningcss",
    ],
    sourcemap: "linked",
    plugins: [
      // pino usa worker_threads internamente; el plugin bundlea los workers correctamente
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
    // Compatibilidad CJS → ESM para paquetes como express
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
