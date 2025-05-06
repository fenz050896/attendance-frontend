import { defineConfig } from "vite";
import fs from "fs/promises";
// import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: "load-js-files-as-jsx",
          setup(build) {
            build.onLoad({ filter: /src\/.*\.js$/ }, async (args) => ({
              loader: "jsx",
              contents: await fs.readFile(args.path, "utf8"),
            }));
          },
        },
      ],
    },
  },
  resolve: {
    alias: {
      app: path.join(__dirname, "./src/app/"),
    },
  },
  plugins: [
    // legacy({
    //   targets: ["defaults", "not IE 11"],
    // }),
    react(),
  ],
  server: {
    host: true,
  },
  define: {
    global: "window",
  },
});
