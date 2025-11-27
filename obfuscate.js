const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'js', 'dashboard.js');
const outputFile = path.join(__dirname, 'js', 'dashboard.js');
const backupFile = path.join(__dirname, 'js', 'dashboard.js.backup');

// Read the original file
let code = fs.readFileSync(inputFile, 'utf8');

// Check if file is already obfuscated (contains obfuscation patterns)
const isObfuscated = code.includes('_0x') || code.includes('base64') || (code.length > 100000 && code.split('var ').length > 50);

// Create backup of original file only if it's NOT obfuscated and backup doesn't exist
if (!isObfuscated && !fs.existsSync(backupFile)) {
    console.log('Creating backup of original dashboard.js...');
    fs.copyFileSync(inputFile, backupFile);
    console.log('Backup created at:', backupFile);
}

// If file is obfuscated and backup exists, warn user
if (isObfuscated && fs.existsSync(backupFile)) {
    console.log('Warning: dashboard.js appears to be obfuscated.');
    console.log('To make changes, edit the source file and re-obfuscate.');
    console.log('Backup source file available at:', backupFile);
}

// Fix image paths to be absolute (for production)
code = code.replace(/assets\/images\//g, '/assets/images/');

// Obfuscate with settings that maintain functionality
const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false, // Keep false to not break dev tools
    debugProtectionInterval: 0,
    disableConsoleOutput: false, // Keep console for errors
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false, // Keep global names to avoid breaking
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
});

// Write obfuscated code
fs.writeFileSync(outputFile, obfuscationResult.getObfuscatedCode(), 'utf8');

console.log('Obfuscation complete!');

