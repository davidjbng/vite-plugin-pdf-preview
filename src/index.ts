import { PluginOption, ResolvedConfig } from "vite";
import picomatch from "picomatch";
import path from "path";
import colors from "picocolors";
import { generatePdf, PdfOptions } from "./generatePdf.js";
import invariant from "tiny-invariant";

interface PdfPreviewOptions {
  sourceFiles: string[];
  watch: string[];
  pdfOptions: PdfOptions;
}

export default function pdfPreview({
  watch,
  sourceFiles,
  pdfOptions,
}: PdfPreviewOptions): PluginOption {
  let config: ResolvedConfig | undefined;

  const baseUrl = () => {
    invariant(config?.server.port, "Vite port is not defined");
    return `http://${config.server.host ?? "localhost"}:${config.server.port}`;
  };

  const sourceFileName = (sourceFile: string) =>
    path.parse(path.basename(sourceFile)).name;

  const resolvePdfOutputPath = (sourceFile: string) =>
    path.join(
      config?.build.outDir ?? "dist",
      `${sourceFileName(sourceFile)}-preview.pdf`
    );

  const previewFileUrl = (sourceFile: string) =>
    `${baseUrl()}/${path.basename(sourceFile)}`;

  return {
    name: "vite-plugin-pdf-preview",
    apply: "serve",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    configureServer({ watcher, ws, config: { logger } }) {
      watcher.add(watch);
      const shouldUpdatePdf = picomatch(watch);

      async function updatePdfPreview(file: string) {
        await generatePdf(previewFileUrl(file), {
          outFile: resolvePdfOutputPath(file),
          pdfOptions,
        });
        ws.send({
          type: "full-reload",
          path: "*",
        });
      }

      watcher.on("change", (path) => {
        if (shouldUpdatePdf(path)) {
          for (const file of sourceFiles) {
            updatePdfPreview(file);
          }
          logger.info(colors.green("Pdf preview reload"));
        }
      });

      // load initial pdf preview
      const interval = setInterval(() => {
        if (config?.server.port) {
          clearInterval(interval);
          clearTimeout(timeout);

          logger.info("");
          logger.info(colors.bold(colors.green("Pdf Preview")));
          for (const file of sourceFiles) {
            const outFile = resolvePdfOutputPath(file);
            generatePdf(previewFileUrl(file), { outFile, pdfOptions });
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
