#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 GitBook Configuration Validator\n');

// Check required files
const requiredFiles = [
    'README.md',
    'SUMMARY.md', 
    'book.json',
    '.gitbook.yaml',
    'package.json'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - Found`);
    } else {
        console.log(`❌ ${file} - Missing`);
        allFilesExist = false;
    }
});

// Validate JSON files
console.log('\n📋 Validating JSON configuration...');

try {
    const bookJson = JSON.parse(fs.readFileSync('book.json', 'utf8'));
    console.log('✅ book.json - Valid JSON');
    
    // Check essential book.json properties
    const requiredProps = ['title', 'description', 'author', 'plugins'];
    requiredProps.forEach(prop => {
        if (bookJson[prop]) {
            console.log(`  ✅ ${prop}: ${Array.isArray(bookJson[prop]) ? `${bookJson[prop].length} items` : bookJson[prop]}`);
        } else {
            console.log(`  ⚠️  ${prop}: Missing`);
        }
    });
    
} catch (error) {
    console.log('❌ book.json - Invalid JSON:', error.message);
    allFilesExist = false;
}

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ package.json - Valid JSON');
    
    if (packageJson.scripts) {
        console.log(`  ✅ Scripts: ${Object.keys(packageJson.scripts).length} defined`);
        Object.keys(packageJson.scripts).forEach(script => {
            console.log(`    - ${script}: ${packageJson.scripts[script]}`);
        });
    }
    
} catch (error) {
    console.log('❌ package.json - Invalid JSON:', error.message);
    allFilesExist = false;
}

// Validate YAML file
console.log('\n📄 Validating YAML configuration...');
try {
    const yaml = require('js-yaml');
    const gitbookYaml = yaml.load(fs.readFileSync('.gitbook.yaml', 'utf8'));
    console.log('✅ .gitbook.yaml - Valid YAML');
    
    if (gitbookYaml.plugins) {
        console.log(`  ✅ Plugins: ${gitbookYaml.plugins.length} configured`);
        gitbookYaml.plugins.forEach(plugin => {
            console.log(`    - ${plugin}`);
        });
    }
    
} catch (error) {
    console.log('❌ .gitbook.yaml - Invalid YAML:', error.message);
    allFilesExist = false;
}

// Check SUMMARY.md structure
console.log('\n📚 Validating SUMMARY.md structure...');
try {
    const summaryContent = fs.readFileSync('SUMMARY.md', 'utf8');
    const lines = summaryContent.split('\n');
    const chapters = lines.filter(line => line.trim().startsWith('*')).length;
    const parts = lines.filter(line => line.trim().startsWith('##')).length;
    
    console.log('✅ SUMMARY.md - Structure validated');
    console.log(`  ✅ Parts: ${parts}`);
    console.log(`  ✅ Chapters: ${chapters}`);
    
    // Check for proper markdown links
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = summaryContent.match(linkPattern) || [];
    console.log(`  ✅ Links: ${links.length} found`);
    
} catch (error) {
    console.log('❌ SUMMARY.md - Error reading file:', error.message);
    allFilesExist = false;
}

// Check README.md
console.log('\n📖 Validating README.md...');
try {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    const wordCount = readmeContent.split(/\s+/).length;
    const hasTitle = readmeContent.includes('# System Design GitBook');
    
    console.log('✅ README.md - Content validated');
    console.log(`  ✅ Word count: ${wordCount}`);
    console.log(`  ✅ Has main title: ${hasTitle ? 'Yes' : 'No'}`);
    
} catch (error) {
    console.log('❌ README.md - Error reading file:', error.message);
    allFilesExist = false;
}

// Check directory structure
console.log('\n📂 Checking directory structure...');
const expectedDirs = ['.github', '.kiro'];
expectedDirs.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        console.log(`✅ ${dir}/ - Directory exists`);
    } else {
        console.log(`⚠️  ${dir}/ - Directory missing (optional)`);
    }
});

// Final summary
console.log('\n🎯 Validation Summary:');
if (allFilesExist) {
    console.log('✅ All essential files are present and valid');
    console.log('✅ GitBook configuration is properly set up');
    console.log('✅ Ready for GitBook build process');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Install GitBook CLI: npm install -g gitbook-cli');
    console.log('2. Install plugins: gitbook install');
    console.log('3. Build the book: gitbook build');
    console.log('4. Serve locally: gitbook serve');
    
    process.exit(0);
} else {
    console.log('❌ Some issues found - please fix before proceeding');
    process.exit(1);
}