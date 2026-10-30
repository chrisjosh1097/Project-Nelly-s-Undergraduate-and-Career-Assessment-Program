import { defineConfig } from "@playwright/experimental-ct-react";
import { fileURLToPath } from "node:url";
const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
 testDir: "./tests/browser", timeout: 30000, workers: 1,
 use: { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }, viewport: { width:390,height:844 }, ctPort:3101, ctViteConfig: {
  publicDir: resolve("./public"),
  resolve: { alias: [
    { find:"@/components/auth/AuthProvider",replacement:resolve("./tests/browser/mocks/auth.tsx") },
    { find:"next/navigation",replacement:resolve("./tests/browser/mocks/navigation.ts") },
    { find:"next/link",replacement:resolve("./tests/browser/mocks/link.tsx") },
    { find:"next/image",replacement:resolve("./tests/browser/mocks/image.tsx") },
    { find:"@",replacement:resolve("./src") }
  ] }
 } }
});
