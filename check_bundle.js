const fs = require('fs');
const content = fs.readFileSync('live_bundle.js', 'latin1');

const mojibake = [
  ['em dash', '\u00e2\u0080\u0093'],
  ['bullet', '\u00e2\u0080\u00a2'],
  ['copyright', '\u00c2\u00a9'],
  ['left quote', '\u00e2\u0080\u0098'],
  ['right quote', '\u00e2\u0080\u0099'],
  ['open dquote', '\u00e2\u0080\u009c'],
  ['close dquote', '\u00e2\u0080\u009d'],
];

let found = false;
mojibake.forEach(([name, pattern]) => {
  const idx = content.indexOf(pattern);
  if (idx !== -1) {
    console.log('FOUND ' + name + ' at index ' + idx);
    console.log('  Context: ' + JSON.stringify(content.substring(idx - 40, idx + 60)));
    found = true;
  }
});

if (!found) {
  console.log('No mojibake found in live bundle - bundle is clean');
}

// Also check the copyright and bullet areas specifically
const copyrightIdx = content.indexOf('All rights reserved');
if (copyrightIdx !== -1) {
  console.log('\nCopyright line context:');
  console.log(JSON.stringify(content.substring(copyrightIdx - 60, copyrightIdx + 80)));
}

const legalIdx = content.indexOf('Privacy Policy');
if (legalIdx !== -1) {
  console.log('\nPrivacy Policy area context:');
  console.log(JSON.stringify(content.substring(legalIdx - 20, legalIdx + 200)));
}
