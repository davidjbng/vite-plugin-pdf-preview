import { existsSync } from "fs"
import { mkdir } from "fs/promises"
import path from "path"
import ppt from "puppeteer"

// start puppeteer on module load to speed up pdf generation
const browser = await ppt.launch({ headless: true })

export type GeneratePdfOptions = {
  pdfPath?: string
  waitUntil?: ppt.WaitForOptions["waitUntil"]
}

/** This generates a pdf file from the given url */
export async function generatePdf(
  URL: string,
  { pdfPath = "dist/preview.pdf", waitUntil = "load" }: GeneratePdfOptions = {}
) {
  const outputDir = path.dirname(pdfPath)
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }
  const page = await browser.newPage()
  await page.goto(URL, { waitUntil })
  await page.pdf({
    format: "A4",
    path: pdfPath,
    margin: { top: "16px", bottom: "16px" },
  })
}
