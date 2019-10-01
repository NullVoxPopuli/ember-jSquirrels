const fs = require('fs');
const path = require('path');
const { run } = require('./shell');
const codemodCli = require('codemod-cli');


async function runCodemods({ cwd, updateState }) {
  await runCommunityCodemods({ cwd, updateState });
  await runRemainingTransforms(({ cwd }));
}

async function runCommunityCodemods({ cwd, updateState }) {
  if (fs.existsSync(path.join(cwd, 'addon'))) {
    await runAndCapture(`npx ember-3x-codemods jquery-apis ./addon/**/*.js`, { cwd, updateState });
  }
  if (fs.existsSync(path.join(cwd, 'addon-test-support'))) {
    await runAndCapture(`npx ember-3x-codemods jquery-apis ./addon-test-support/**/*.js`, { cwd, updateState });
  }
  if (fs.existsSync(path.join(cwd, 'test-support'))) {
    await runAndCapture(`npx ember-3x-codemods jquery-apis ./test-support/**/*.js`, { cwd, updateState });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'unit'))) {
    await runAndCapture(`npx ember-test-helpers-codemod native-dom tests/unit`, { cwd, updateState });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'integration'))) {
    await runAndCapture(`npx ember-test-helpers-codemod integration tests/integration`, { cwd, updateState });
    await runAndCapture(`npx ember-test-helpers-codemod native-dom tests/integration`, { cwd, updateState });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'acceptance'))) {
    await runAndCapture(`npx ember-test-helpers-codemod acceptance tests/acceptance`, { cwd, updateState });
    await runAndCapture(`npx ember-test-helpers-codemod native-dom tests/acceptance`, { cwd, updateState });
  }
}

async function runAndCapture(command, { cwd, updateState }) {
  let error;
  try {
    await run(command, { cwd });
  } catch (e) {
    error = e;
  }

  updateState({ [command]: {
    succeeded: !error,
    error,
   } });
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
