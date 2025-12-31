const { spawn } = require('child_process');

// Start Next.js dev server
const devServer = spawn('next', ['dev'], {
  stdio: 'pipe',
  shell: true
});

// Track if we've shown our custom message
let customMessageShown = false;

devServer.stdout.on('data', (data) => {
  const output = data.toString();

  // Check if Next.js is ready
  if (output.includes('Local:') && !customMessageShown) {
    customMessageShown = true;
    // Print custom message with the correct URL
    console.log('\n  ▲ Next.js ' + require('next/package.json').version);
    console.log('  - Local:        \x1b[36mhttp://localhost:3000\x1b[0m\n');
  } else if (!output.includes('Local:') && !output.includes('- Network:')) {
    // Print other messages as normal (but skip the original Local/Network URLs)
    process.stdout.write(data);
  }
});

devServer.stderr.on('data', (data) => {
  process.stderr.write(data);
});

devServer.on('close', (code) => {
  process.exit(code);
});
