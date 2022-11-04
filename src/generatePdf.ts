import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import ppt from "puppeteer";

export type PdfOptions = Omit<ppt.PDFOptions, "path">;

export type GeneratePdfOptions = {
  outFile: string;
  waitUntil?: ppt.WaitForOptions["waitUntil"];
  pdfOptions?: PdfOptions;
};

/** This generates a pdf file from the given url */
export async function generatePdf(
  URL: string,
  {
    outFile,
    waitUntil = "load",
    pdfOptions: {
      format = "A4",
      margin = { top: "16px", bottom: "16px" },
    } = {},
  }: GeneratePdfOptions
) {
  const outputDir = path.dirname(outFile);
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  const browser = await initBrowser();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil });
  await page.pdf({
    format,
    path: outFile,
    margin,
  });
}

let browser: ppt.Browser | undefined;
async function initBrowser() {
  if (!browser) {
    browser = await ppt.launch({ headless: true });
  }
  return browser;
}
