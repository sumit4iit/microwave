const fs = require('fs');
const path = require('path');

const MHTML_FILE = path.join(__dirname, '../source/LG HTML Manual.mhtml');
const OUTPUT_HTML = path.join(__dirname, '../output/extracted.html');

console.log('Reading MHTML file...');
const mhtml = fs.readFileSync(MHTML_FILE, 'utf-8');

// MHTML uses quoted-printable encoding where = is used for encoding
// =3D is =, =0D is CR, =0A is LF
function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, '') // Remove soft line breaks
    .replace(/=([0-9A-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

// Extract the main HTML content (first text/html part)
// Look for Content-Type: text/html followed by the HTML content
// Note: MHTML uses \r\n line endings
const htmlMatch = mhtml.match(/Content-Type: text\/html\r?\nContent-ID:.*?\r?\nContent-Transfer-Encoding: quoted-printable\r?\nContent-Location:.*?\r?\n\r?\n([\s\S]*?)(?=\r?\n------MultipartBoundary)/);

if (htmlMatch) {
  console.log('Found HTML content, decoding...');
  const encodedHtml = htmlMatch[1];
  const decodedHtml = decodeQuotedPrintable(encodedHtml);

  fs.writeFileSync(OUTPUT_HTML, decodedHtml, 'utf-8');
  console.log('Extracted HTML saved to:', OUTPUT_HTML);
  console.log('File size:', Math.round(decodedHtml.length / 1024), 'KB');

  // Quick check for recipe elements
  const tableCount = (decodedHtml.match(/<table/g) || []).length;
  const subjectCount = (decodedHtml.match(/<div class="subject"/g) || []).length;

  console.log('');
  console.log('Found in extracted HTML:');
  console.log('  - Tables:', tableCount);
  console.log('  - Subject divs:', subjectCount);

  // Check for specific recipes
  if (decodedHtml.includes('HP1')) {
    console.log('  - HP1 (Kala Chana): YES');
  }
  if (decodedHtml.includes('ηh1')) {
    console.log('  - ηh1 (Ghee): YES');
  }
} else {
  console.error('Could not find HTML content in MHTML file');
}
