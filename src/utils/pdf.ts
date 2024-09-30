import {
  arrayAsString,
  decodePDFRawStream,
  PDFDocument,
  PDFName,
  PDFRawStream,
} from "pdf-lib";
import { deflate } from "pako";

interface Rules {
  pattern: string;
  replacement: string;
}

export async function modifyPdf(
  currentPdfFile: File,
  companyLogoFile: Blob,
  rules: Rules[]
) {
  const currentPdfBytes = await currentPdfFile.arrayBuffer();
  const companyLogoFileBytes = await companyLogoFile.arrayBuffer();

  const pdfDoc = await PDFDocument.load(currentPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const enumeratedIndirectObjects = pdfDoc.context.enumerateIndirectObjects();

  let updatedLogo = 0;
  for (const [_, pdfObject] of enumeratedIndirectObjects) {
    if (!(pdfObject instanceof PDFRawStream)) {
      continue;
    }

    if (pdfObject?.dict?.get(PDFName.of("Subtype")) === PDFName.of("Image")) {
      if (updatedLogo < 2) {
        // @ts-ignore
        pdfObject.contents = new Uint8Array();
        updatedLogo+=1
      } else if (updatedLogo === 2) {
        const embededLogo = await pdfDoc.embedPng(companyLogoFileBytes);
        firstPage.drawImage(embededLogo, {
          x: firstPage.getWidth() - embededLogo.width / 2 + 50, // Adjust the x position as needed
          y: firstPage.getWidth() + embededLogo.height + 25, // Adjust the y position as needed
          width: embededLogo.width / 4,
          height: embededLogo.height / 4,
        });
      }
      continue;
    }

    let text = arrayAsString(decodePDFRawStream(pdfObject).decode());
    let modified = false;

    for (const { pattern, replacement } of rules) {
      const newText = text.replace(pattern, replacement);
      if (newText !== text) {
        text = newText;
        modified = true;
      }
    }
    if (modified) {
      // @ts-ignore
      pdfObject.contents = deflate(Buffer.from(text, "latin1"));
    }
  }

  return pdfDoc.save({ addDefaultPage: false })
}
