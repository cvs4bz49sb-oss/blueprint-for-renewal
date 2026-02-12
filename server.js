const express = require("express");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

// PDF generation helper
async function generatePdf(pageUrl, filename, res) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(pageUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for fonts to load
    await page.evaluateHandle("document.fonts.ready");

    const pdfData = await page.pdf({
      format: "Letter",
      margin: { top: "0.75in", bottom: "0.75in", left: "0.75in", right: "0.75in" },
      printBackground: true,
      displayHeaderFooter: false,
    });

    const pdfBuffer = Buffer.from(pdfData);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  } finally {
    if (browser) await browser.close();
  }
}

// Blueprint for Renewal PDF
app.get("/api/pdf", (req, res) => {
  generatePdf(
    `http://localhost:${PORT}/?print=true`,
    "blueprint-for-renewal.pdf",
    res
  );
});

// Spiritual Formation PDF
app.get("/api/pdf/spiritual-formation", (req, res) => {
  generatePdf(
    `http://localhost:${PORT}/spiritual-formation.html?print=true`,
    "spiritual-formation-for-the-family.pdf",
    res
  );
});

// Spiritual Formation page
app.get("/spiritual-formation", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "spiritual-formation.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
