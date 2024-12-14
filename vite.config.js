import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import path from "path";
import fs from "fs";

const BUILD_PATH = "app";

function moveHTML() {
    return {
        name: "move-html",
        generateBundle(options, bundle) {
            for (const [fileName, file] of Object.entries(bundle)) {
                if (fileName.endsWith(".html")) {
                    const entryName = fileName.replace(/^src\//, "");
                    const outputPath = path.resolve(options.dir, entryName);

                    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                    fs.writeFileSync(outputPath, file.source);
                }
            }
        },
    };
}

function cleanupPlugin() {
    return {
        name: "cleanup-plugin",
        closeBundle() {
            const buildDir = path.resolve(BUILD_PATH);
            const srcDir = path.join(buildDir, "src");

            if (fs.existsSync(srcDir)) {
                fs.rmSync(srcDir, { recursive: true, force: true });
                console.log("Removed src directory from build folder.");
            }
        },
    };
}

function copyFilesPlugin() {
    return {
        name: "copy-files",
        closeBundle() {
            const buildDir = path.resolve(BUILD_PATH);

            // Copy manifest.json
            const srcManifest = path.resolve("src/manifest.json");
            const destManifest = path.join(buildDir, "manifest.json");
            if (fs.existsSync(srcManifest)) {
                fs.copyFileSync(srcManifest, destManifest);
                console.log("Copied manifest.json to build folder.");
            } else {
                console.log("No manifest.json found.");
            }

            // Copy assets folder
            const srcAssetsDir = path.resolve("src/assets");
            const destAssetsDir = path.join(buildDir, "assets");
            if (fs.existsSync(srcAssetsDir)) {
                copyDirectorySync(srcAssetsDir, destAssetsDir);
                console.log("Copied assets directory to build folder.");
            } else {
                console.log("No assets directory found.");
            }
        },
    };
}

function copyDirectorySync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectorySync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function updateHtmlPaths() {
    return {
        name: "update-html-paths",
        generateBundle(options, bundle) {
            for (const [fileName, file] of Object.entries(bundle)) {
                if (fileName.endsWith(".html")) {
                    let content = file.source;

                    content = content.replace(
                        /href="([^"]+\.css)"/g,
                        (match, p1) => {
                            return `href="/${BUILD_PATH}${p1}"`;
                        }
                    );
                    content = content.replace(
                        /src="([^"]+\.js)"/g,
                        (match, p1) => {
                            return `src="/${BUILD_PATH}${p1}"`;
                        }
                    );
                    content = content.replace(
                        /href="([^"]+\.js)"/g,
                        `href="/${BUILD_PATH}$1"`
                    );

                    // Write the updated HTML file
                    this.emitFile({
                        type: "asset",
                        fileName: fileName.replace(/^src\//, ""),
                        source: content,
                    });
                }
            }
        },
    };
}

export default defineConfig({
    plugins: [svelte()],
    resolve: {
        alias: {
            "@assets": path.resolve(__dirname, "src/assets"),
            "@components": path.resolve(__dirname, "src/components"),
            "@scripts": path.resolve(__dirname, "src/components/scripts"),
        },
    },
    build: {
        rollupOptions: {
            input: {
                // popup: resolve(__dirname, "src/popup/sidepanel.html"),
                // content: resolve(__dirname, "src/content/content.js"),
                // sleeper: resolve(__dirname, "src/content/sleeper.js"),
                tab: resolve(__dirname, "src/tab/index.html"),
                worker: resolve(__dirname, "src/worker/worker.js"),
            },
            output: {
                dir: BUILD_PATH,
                entryFileNames: "[name]/[name].js",
                chunkFileNames: "chunks/[name].js",
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith(".css")) {
                        return "[name]/[name][extname]";
                    }
                    return "[name][extname]";
                },
            },
            plugins: [
                moveHTML(),
                // updateHtmlPaths(),
                cleanupPlugin(),
                copyFilesPlugin(),
            ],
        },
    },
});
