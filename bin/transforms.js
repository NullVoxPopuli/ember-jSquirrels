const fs = require('fs');
const path = require('path');
const { run } = require('./shell');
const codemodCli = require('codemod-cli');


async function runCodemods({ cwd }) {
  await runCommunityCodemods({ cwd });
  await runRemainingTransforms(({ cwd }));
}

async function runCommunityCodemods({ cwd }) {
  if (fs.existsSync(path.join(cwd, 'addon'))) {
    await run(`npx ember-3x-codemods jquery-apis ./addon`, { cwd });
  }
  if (fs.existsSync(path.join(cwd, 'addon-test-support'))) {
    await run(`npx ember-3x-codemods jquery-apis ./addon-test-support`, { cwd });
  }
  if (fs.existsSync(path.join(cwd, 'test-support'))) {
    await run(`npx ember-3x-codemods jquery-apis ./test-support`, { cwd });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'unit'))) {
    await run(`npx ember-test-helpers-codemod native-dom tests/unit`, { cwd });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'integration'))) {
    await run(`npx ember-test-helpers-codemod integration tests/integration`, { cwd });
    await run(`npx ember-test-helpers-codemod native-dom tests/integration`, { cwd });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'acceptance'))) {
    await run(`npx ember-test-helpers-codemod acceptance tests/acceptance`, { cwd });
    await run(`npx ember-test-helpers-codemod native-dom tests/acceptance`, { cwd });
  }
}


function runRemainingTransforms({ cwd }) {
  // codemodCli.runTransform(
  //   __dirname,
  //   process.argv[2] /* transform name */,
  //   process.argv.slice(3) /* paths or globs */
  // );
}


module.exports = {
  runCodemods,
}
