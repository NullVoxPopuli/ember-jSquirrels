const execa = require('execa');

async function run(command, options = {}) {
  console.log(`
      Running:
        ${command}
    `);
  return await execa(`source $HOME/.bash_profile && ${command}`, {
    stdio: 'inherit',
    shell: '/bin/bash',
    env: {
      PATH: process.env.PATH,
    },
    ...options,
  });
}

module.exports = {
  run,
};
