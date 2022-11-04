import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import ppt from "puppeteer";

let browser: ppt.Browser | undefined;
async function initBrowser() {
  if (!browser) {
    browser = await ppt.launch({ headless: true });
  }
  return browser;
}

export type GeneratePdfOptions = {
  pdfPath?: string;
  waitUntil?: ppt.WaitForOptions["waitUntil"];
};

/** This generates a pdf file from the given url */
export async function generatePdf(
  URL: string,
  { pdfPath = "dist/preview.pdf", waitUntil = "load" }: GeneratePdfOptions = {}
) {
  const outputDir = path.dirname(pdfPath);
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  const browser = await initBrowser();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil });
  await page.pdf({
    format: "A4",
    path: pdfPath,
    margin: { top: "16px", bottom: "16px" },
  });
}
