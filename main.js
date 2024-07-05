const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const exp = require('constants');
const fs = require('fs').promises;
const path = require('path');


const cookies = [
    {
        name: 'JSESSIONID',
        value: , // get JSESSIONID from cookies from browser and paste here
        domain: 'codeforces.com',
        path: '/',
        httpOnly: true,
    }
]; 

const pages = [
    "https://codeforces.com/contest/1987/problem/A",
    "https://codeforces.com/contest/1987/problem/B",
];

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();
    if (cookies) await page.setCookie(...cookies);

    createDirectory('problems');
    
    let pdfPaths = [];
    for (let pageUrl of pages) {
        console.log(`Opening page: ${pageUrl}`);
        try {
            await page.goto(pageUrl, { waitUntil: 'networkidle2' });

            await page.evaluate(() => {
                const x = document.getElementById('pageContent');
                let y = x.children[2].innerHTML;
                x.children[2].innerHTML = y.substr(y.indexOf('.') + 2);
                document.body.innerHTML = x.innerHTML;
            });

            const fileName = `problems/${pageUrl.at(pageUrl.length - 1)}.pdf`;
            console.log(`Saving page to: ${fileName}`);
            await page.pdf({ path: fileName, format: 'A4' });
            pdfPaths.push(fileName);
            console.log(`Saved PDF: ${fileName}`);
        } catch (e) {
            console.error(`Error processing page ${pageUrl}:`, e);
        }
    }

    await browser.close();

    await mergePDFs(pdfPaths, 'contest.pdf');
})();


async function mergePDFs(pdfPaths, outputPath) {
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfPath of pdfPaths) {
        const pdfBytes = await fs.readFile(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, mergedPdfBytes);
    console.log(`Merged PDF saved to: ${outputPath}`);
}


function createDirectory(folderName) {
    const folderPath = path.join(__dirname, folderName);
    fs.mkdir(folderPath, { recursive: true }, (err) => {
        if (err) throw err;
    });
}