const fs = require('fs');
const path = require('path');
const { run } = require('./shell');
const codemodCli = require('codemod-cli');

async function runCodemods({ cwd, updateState }) {
  await runCustomTransforms({ cwd });

  await runCommunityCodemods({ cwd, updateState });
}

async function runCommunityCodemods({ cwd, updateState }) {
  await runAndCapture(`volta install jscodeshift ember-3x-codemods ember-qunit-codemod ember-test-helpers-codemod`, { cwd, updateState });

  if (fs.existsSync(path.join(cwd, 'addon'))) {
    await runAndCapture(`ember-3x-codemods jquery-apis ./addon/**/*.js`, { cwd, updateState });
  }
  if (fs.existsSync(path.join(cwd, 'addon-test-support'))) {
    await runAndCapture(`ember-3x-codemods jquery-apis ./addon-test-support/**/*.js`, {
      cwd,
      updateState,
    });
  }
  if (fs.existsSync(path.join(cwd, 'test-support'))) {
    await runAndCapture(`ember-3x-codemods jquery-apis ./test-support/**/*.js`, {
      cwd,
      updateState,
    });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'unit'))) {
    await runAndCapture(`ember-qunit-codemod convert-module-for-to-setup-test tests/unit`, {
      cwd,
      updateState,
    });
    await runAndCapture(`ember-test-helpers-codemod native-dom tests/unit`, { cwd, updateState });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'integration'))) {
    await runAndCapture(`ember-qunit-codemod convert-module-for-to-setup-test tests/integration`, {
      cwd,
      updateState,
    });
    await runAndCapture(`ember-test-helpers-codemod integration tests/integration`, {
      cwd,
      updateState,
    });
    await runAndCapture(`ember-test-helpers-codemod native-dom tests/integration`, {
      cwd,
      updateState,
    });
  }

  if (fs.existsSync(path.join(cwd, 'tests', 'acceptance'))) {
    await runAndCapture(`ember-qunit-codemod convert-module-for-to-setup-test tests/acceptance`, {
      cwd,
      updateState,
    });
    await runAndCapture(`ember-test-helpers-codemod acceptance tests/acceptance`, {
      cwd,
      updateState,
    });
    await runAndCapture(`ember-test-helpers-codemod native-dom tests/acceptance`, {
      cwd,
      updateState,
    });
  }
}

async function runAndCapture(command, { cwd, updateState }) {
  let error;
  try {
    await run(command, { cwd });
  } catch (e) {
    error = e;
  }

  updateState({
    [command]: {
      succeeded: !error,
      error,
    },
  });
}

async function runCustomTransforms({ cwd }) {
  console.log('Running custom transforms...');
  await codemodCli.runTransform(__dirname, 'package-json-cleaner', path.join(cwd, 'package.json'));

  if (fs.existsSync((path.join(cwd, 'yarn.lock')))) {
    await run(`yarn`, { cwd });
  }

  if (fs.existsSync((path.join(cwd, 'package-lock.json')))) {
    await run(`npm install`, { cwd });
  }
}

module.exports = {
  runCodemods,
};
