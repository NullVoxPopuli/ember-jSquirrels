const execa = require('execa');

async function run(command, options = {}) {
    console.log(`
      Running:
        ${command}
    `)
    return await execa(command, {
      stdio: "inherit",
      shell: true,
      ...options
    });
  }

  module.exports = {
      run,
  }
