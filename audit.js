const fs = require('fs');
const path = require('path');

const srcDir = 'e:\\KRISH(PPSU)\\Semester 6\\Major Project\\Harbor\\reactive_resume\\src';
const outputFile = 'e:\\KRISH(PPSU)\\Semester 6\\Major Project\\Harbor\\reactive_resume_audit.md';

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach((name) => {
        const filePath = path.join(currentDirPath, name);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const categories = {
    'UI Primitives (Base/Interactive/ Shadcn)': [],
    'Domain UI Components (Resume, Auth, AI, Layouts, etc.)': [],
    'Route Boundaries & Page UI Components': [],
    'Custom Non-UI Hooks (State & Effects)': [],
    'System Integrations (API, Query, Auth, DB)': [],
    'Data Schemas & Validation Models': [],
    'Non-UI Utilities (Helpers, Formatters, Core Logic)': [],
    'Constants & Configurations': [],
    'Miscellaneous Scripts / Types': []
};

walkSync(srcDir, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/');
    const fileName = path.basename(relPath);
    
    // Categorize
    if (relPath.startsWith('components/ui/')) {
        categories['UI Primitives (Base/Interactive/ Shadcn)'].push(relPath);
    } else if (relPath.startsWith('components/')) {
        categories['Domain UI Components (Resume, Auth, AI, Layouts, etc.)'].push(relPath);
    } else if (relPath.startsWith('hooks/')) {
        categories['Custom Non-UI Hooks (State & Effects)'].push(relPath);
    } else if (relPath.startsWith('utils/')) {
        categories['Non-UI Utilities (Helpers, Formatters, Core Logic)'].push(relPath);
    } else if (relPath.startsWith('schema/')) {
        categories['Data Schemas & Validation Models'].push(relPath);
    } else if (relPath.startsWith('integrations/')) {
        categories['System Integrations (API, Query, Auth, DB)'].push(relPath);
    } else if (relPath.startsWith('routes/')) {
        categories['Route Boundaries & Page UI Components'].push(relPath);
    } else if (relPath.startsWith('constants/')) {
        categories['Constants & Configurations'].push(relPath);
    } else {
        categories['Miscellaneous Scripts / Types'].push(relPath);
    }
});

let mdContent = `# Reactive Resume Full Component & Code Audit\n\n`;
mdContent += `This document provides a comprehensive audit of **every single component and file** actively utilized inside the \`reactive_resume\` source directory.\n\n`;
mdContent += `> Generated automatically across all active .ts and .tsx files.\n\n`;

for (const [catName, files] of Object.entries(categories)) {
    if (files.length === 0) continue;
    
    mdContent += `## ${catName}\n`;
    mdContent += `*Total Identifiable Components/Files: ${files.length}*\n\n`;
    
    files.sort().forEach(file => {
        // Extract basic component name
        let compName = path.basename(file).replace(/\.tsx?$/, '');
        // format comp name to Title Case
        compName = compName.split(/(?=[A-Z])|[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ').trim();
        
        const isUI = file.endsWith('.tsx') ? "🖥️ UI Component" : "⚙️ Core/Non-UI";
        mdContent += `- **${compName}** (\`${file}\`) - ${isUI}\n`;
    });
    mdContent += `\n---\n\n`;
}

fs.writeFileSync(outputFile, mdContent, 'utf-8');
console.log('Audit generated successfully!');
