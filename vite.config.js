import { defineConfig, loadEnv } from "vite";
import { createRequire } from "node:module";
import react from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const pkg = require("./package.json");

// Ensure self-contained ytmusic-api vendor bundle exists for Electron main process
esbuild.buildSync({
  entryPoints: [require.resolve("ytmusic-api")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "public/services/vendor/ytmusic-api.cjs",
});

const { startMediaDetector, getSystemMedia } = require("./public/mediaDetector.cjs");
const { ytMusicLyricsService } = require("./public/services/ytmusicService.cjs");

function ytMusicDevMiddleware() {
  return {
    name: "ytmusic-dev-api",
    configureServer(server) {
      startMediaDetector();

      server.middlewares.use("/api/system-media", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(getSystemMedia()));
      });

      server.middlewares.use("/api/lyrics", async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        try {
          const url = new URL(req.url, "http://localhost");
          const query = url.searchParams.get("query");
          const result = await ytMusicLyricsService.searchSongAndLyrics(query);

          if (result.error) {
            res.statusCode = result.statusCode || 404;
            res.end(JSON.stringify({ error: result.error }));
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message || "Internal server error" }));
        }
      });
    },
  };
}

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    base: "./",
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version || "1.0.0"),
    },
    plugins: [react(), ytMusicDevMiddleware()],

    server: {
      port: parseInt(process.env.VITE_PORT) || 5173,
      host: "127.0.0.1",
    },
  });
};
