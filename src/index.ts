import { PluginOption, ResolvedConfig } from "vite";
import path from "path";
import colors from "picocolors";
import { generatePdf, PdfOptions } from "./generatePdf.js";
import invariant from "tiny-invariant";
import chokidar from "chokidar";

interface PdfPreviewOptions {
  /**
   * Relative paths to pdf preview files.
   *
   * @example
   * pages: ["/print"]
   *
   * @example
   * pages: ["page.html"]
   */
  pages: string[];
  /**
   * Glob pattern forwarded to file watcher
   *
   * @see https://github.com/paulmillr/chokidar#api
   */
  watch?: string | string[];
  /**
   * Forwarded to puppeteer pdf function.
   * Property `path` is omitted and can be configured via `build.outDir`
   *
   * @see https://pptr.dev/api/puppeteer.pdfoptions
   *
   * @default
   * {
   *  format = "A4",
   *  margin = { top: "16px", bottom: "16px" },
   * }
   */
  pdfOptions?: PdfOptions;
}

export default function pdfPreview({
  watch = "./src/**",
  pages,
  pdfOptions,
}: PdfPreviewOptions): PluginOption {
  let config: ResolvedConfig | undefined;

  const baseUrl = () => {
    invariant(config?.server.port, "Vite port is not defined");
    return `http://${config.server.host ?? "localhost"}:${config.server.port}`;
  };

  const pageName = (page: string) => path.parse(path.basename(page)).name;

  const resolveOutFile = (page: string) =>
    path.join(config?.build.outDir ?? "dist", `${pageName(page)}-preview.pdf`);

  const pageUrl = (page: string) => `${baseUrl()}/${page}`;

  return {
    name: "vite-plugin-pdf-preview",
    apply: "serve",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    configureServer({ config: { logger } }) {
      // cannot use vite's built in watcher because it causes issues with hmr updates not being sent
      const watcher = chokidar.watch(watch);
      watcher.add(watch);

      async function updatePdfPreview(file: string) {
        await generatePdf(pageUrl(file), {
          outFile: resolveOutFile(file),
          pdfOptions,
        });
      }

      watcher.on("change", () => {
        for (const file of pages) {
          updatePdfPreview(file);
        }
        logger.info(colors.green("pdf update"), {
          timestamp: true,
        });
      });

      // load initial pdf preview
      // using interval to wait for vite server startup
      const interval = setInterval(() => {
        if (config?.server.port) {
          clearInterval(interval);
          clearTimeout(timeout);

          logger.info("");
          logger.info(colors.bold(colors.green("pdf files")));
          for (const file of pages) {
            const outFile = resolveOutFile(file);
            generatePdf(pageUrl(file), { outFile, pdfOptions });
            logger.info(colors.dim(outFile));
          }
        }
      }, 50);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        logger.error(colors.yellow("pdf preview failed resolve server url"));
      }, 5000);
    },
  };
}
