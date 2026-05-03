import { Router, Request, Response } from "express";
import puppeteer from "puppeteer";
import { extractBearerToken, verifyToken, loadAuthenticatedAppUser } from "../../_core/appAuth";
import { loadAuthenticatedMerchantUser } from "../merchant/merchantAuth";
import { respondRouteError } from "../../_core/routeResponses";

async function multiAuthMiddleware(req: Request, res: Response, next: any) {
  try {
    const token = extractBearerToken(req.headers.authorization as string);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = await verifyToken(token);
    if (!payload) return res.status(401).json({ error: "Session expired" });

    if (payload.role === "merchant") {
      const user = await loadAuthenticatedMerchantUser(payload.userId);
      if (!user) return res.status(401).json({ error: "Inactive user" });
    } else {
      const user = await loadAuthenticatedAppUser(payload.userId);
      if (!user) return res.status(401).json({ error: "Inactive user" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Session expired" });
  }
}

export function registerPdfExportRoutes(router: Router) {
  console.log("Registering PDF Export Route");
  router.post(
    "/export/pdf",
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { html, filename, headerTemplate, footerTemplate, marginTop, marginBottom, marginRight, marginLeft, landscape } = req.body;

        if (!html) {
          return res.status(400).json({ error: "Missing HTML content" });
        }

        // Launch puppeteer
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();

        // Set HTML content
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });

        const useHeaderFooter = !!(headerTemplate || footerTemplate);

        // Generate PDF
        const pdfBuffer = await page.pdf({
          format: "A4",
          landscape: landscape === true || landscape === "true",
          printBackground: true,
          displayHeaderFooter: useHeaderFooter,
          headerTemplate: headerTemplate || "<span></span>",
          footerTemplate: footerTemplate || "<span></span>",
          margin: {
            top: marginTop || (useHeaderFooter ? "26mm" : "10mm"),
            right: marginRight || "8mm",
            bottom: marginBottom || (useHeaderFooter ? "24mm" : "10mm"),
            left: marginLeft || "8mm",
          },
          timeout: 30000
        });

        await browser.close();

        // Ensure it's a Buffer (newer puppeteer versions return Uint8Array)
        const finalBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

        // Send PDF back to client
        const safeFilename = encodeURIComponent(filename || "export.pdf");
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${safeFilename}`,
          "Content-Length": finalBuffer.length,
        });

        return res.end(finalBuffer);
      } catch (error) {
        console.error("[PDF Export Error]:", error);
        return respondRouteError(res, error);
      }
    }
  );
}
