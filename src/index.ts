import { PluginOption, ResolvedConfig } from "vite";
import picomatch from "picomatch";
import path from "path";
import colors from "picocolors";
import { generatePdf, PdfOptions } from "./generatePdf.js";
import invariant from "tiny-invariant";
import chokidar from "chokidar";

interface PdfPreviewOptions {
  pages: string[];
  watch?: string | string[];
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
      logger.info(`Watch: ${Array.isArray(watch) ? watch.join(", ") : watch}`);
      watcher.add(watch);
      const shouldUpdate = picomatch(watch);

      async function updatePdfPreview(file: string) {
        await generatePdf(pageUrl(file), {
          outFile: resolveOutFile(file),
          pdfOptions,
        });
      }

      watcher.on("change", (path) => {
        logger.info(`change ${path}`);
        if (shouldUpdate(path)) {
          for (const file of pages) {
            updatePdfPreview(file);
          }
          logger.info(colors.green("Pdf preview reload"));
        } else {
          logger.info(colors.dim("No update"));
        }
      });

      // load initial pdf preview
      const interval = setInterval(() => {
        if (config?.server.port) {
          clearInterval(interval);
          clearTimeout(timeout);

          logger.info("");
          logger.info(colors.bold(colors.green("Pdf Preview")));
          for (const file of pages) {
            const outFile = resolveOutFile(file);
            generatePdf(pageUrl(file), { outFile, pdfOptions });
            logger.info(
              colors.dim("File: ") +
                colors.blue(new URL(outFile, import.meta.url).href)
            );
          }
        }
      }, 50);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        logger.error(colors.yellow("Pdf preview failed resolve server url"));
      }, 5000);
    },
  };
}
