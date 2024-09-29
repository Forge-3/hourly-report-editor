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
    console.log(companyLogoFile)
  const currentPdfBytes = await currentPdfFile.arrayBuffer();
  const companyLogoFileBytes = await companyLogoFile.arrayBuffer();

  const pdfDoc = await PDFDocument.load(currentPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const enumeratedIndirectObjects = pdfDoc.context.enumerateIndirectObjects();

  let updatedLogo = 0;

  for (const [pdfRef, pdfObject] of enumeratedIndirectObjects) {
    if (!(pdfObject instanceof PDFRawStream)) {
      continue;
    }

    if (pdfObject?.dict?.get(PDFName.of("Subtype")) === PDFName.of("Image")) {
      if (updatedLogo < 2) {
        pdfDoc.context.delete(pdfRef)
        
        const marioImage = await pdfDoc.embedPng(companyLogoFileBytes);
        firstPage.drawImage(marioImage, {
          x: firstPage.getWidth() - marioImage.width / 2 + 50, // Adjust the x position as needed
          y: firstPage.getWidth() + marioImage.height + 25, // Adjust the y position as needed
          width: marioImage.width / 4,
          height: marioImage.height / 4,
        });
        updatedLogo+=1
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

  return pdfDoc.save()
}
