const execa = require('execa');

async function run(command, options = {}) {
    console.log(`
      Running:
        ${command}
    `)
    return await execa(command, {
      stdio: "inherit",
      shell: true,
      env: {
        SSH_AUTH_SOCK: '/run/user/1000/keyring/ssh'
      },
      ...options
    });
  }

  module.exports = {
      run,
  }
