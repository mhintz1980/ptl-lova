// Simple script to check for TypeScript errors
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
    console.log('Running TypeScript compiler...');
    const output = execSync('npx tsc -b --listFiles 2>&1', {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        cwd: process.cwd()
    });

    writeFileSync('tsc-output.txt', output);
    console.log('Output written to tsc-output.txt');
    console.log('First 1000 characters:');
    console.log(output.substring(0, 1000));
} catch (error) {
    console.error('Error occurred:');
    console.error(error.stdout || error.message);
    writeFileSync('tsc-errors.txt', error.stdout || error.message);
    console.log('Errors written to tsc-errors.txt');
}
