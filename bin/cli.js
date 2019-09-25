#!/usr/bin/env node
'use strict';

/**
 * Required ENV vars
 * - GITHUB_TOKEN
 *
 *
 */
const execa = require('execa');
const codemodCli = require('codemod-cli');
const Octokit = require("@octokit/rest");
const tmp = require('tmp');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

const branchName = 'remove-jquery----ember-jSquirrels';
const { GITHUB_TOKEN } = process.env;

if (!GITHUB_TOKEN) {
  throw new Error(`Environment variable: GITHUB_TOKEN has not be set!`)
}


const octokit = new Octokit({ auth: GITHUB_TOKEN });

const GITHUB_REGEX = /\/([\w-_]+)\/([\w-_]+)/

// TODO:
//
// Parse EmberObserver
//
// Integrate with GitHub
//  - document permissions needed.
//  - will need to:
//    - fork repos
//    - update main branch if fork already exists
//    - create branch - "remove-jquery"
//
// Run these codemods:
// https://github.com/ember-codemods/ember-3x-codemods/tree/master/transforms/jquery-apis
//
// https://github.com/ember-codemods/ember-test-helpers-codemod
//
// GitHub:
// - Push Code
// - Open PR
async function removeJQuery() {
  try {
    // await getRepo();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  let progress = progressFile();

  let repos = Object.keys(progress);

  for (let i = 0; i < repos.length; i++) {
    let key = repos[i];
    let info = progress[key];

    await removeJQueryFor(info);
    break;
  }
}

async function removeJQueryFor(theirs) {
  let userName = await getUserName();
  let { repo } = theirs;
  let mine = { owner: userName, repo };

  let { name: tmpPath, removeCallback: cleanTmp } = tmp.dirSync();

  try {
    if (!await repoExists(mine)) {
      await fork(theirs);
    }

    let repoPath = await clone({ owner: userName, repo, cwd: tmpPath });

    await runCodemods({ cwd: repoPath });

    await pushBranch({ cwd: repoPath });

    await createPR({ base: userName, upstream: theirs.owner, repo });
  } catch (e) {
    console.log('sadness');
    console.error(e);
  } finally {
    cleanTmp();
  }


}

function progressFile() {
  try {
    let rawdata = fs.readFileSync('progress.json');
    let json = JSON.parse(rawdata);

    return json;
  } catch (e) {
    return {};
  }

}

function writeProgressFile(json) {
  fs.writeFileSync('progress.json', JSON.stringify(json));
}

async function createPR({ base, upstream, repo }) {
  console.log(`creating PR: ${upstream} <- ${base} with ${repo}`);

  await octokit.pulls.create({
    owner: upstream,
    repo,
    head: `${base}:${head}`,
    base,
    title: 'Remove jQuery',
    body: `
     This is an automated PR from: https://github.com/NullVoxPopuli/ember-jSquirrels

     In an effort to better ready the Ember ecosystem for the modern web, jQuery must be removed.

     There have been native replacements for jQuery APIs for quite a few years.

     Removing jQuery will reduce everyone's app vendor size by 30-80kb after min+gzip, depending on the jQuery version.
    `
  });
}

async function getRepo() {
  let progress = progressFile();
  let alreadyVisited = Object.keys(progress);

  for (let i = 0; i < 1; i++) {
    let offset = i;
    let url = `https://emberobserver.com/api/v2/addons?page%5Blimit%5D=100&page%5Boffset%5D=${offset}&sort=ranking`;

    console.log(url);

    let data = [];

    try {
      let response = await fetch(url);
      let json = await response.json();

      if (!json.data) {
        console.log('empty response', json);
      }
      data = json.data || [];
    } catch (e) {
      console.log(e);
    }

    for (let i = 0; i < data.length; i++) {
      let { attributes } = data[i];
      let gitUrl = attributes['repository-url'];
      let isInvalid = attributes['has-invalid-github-url'];

      if (isInvalid) {
        console.log(attributes);
        process.exit(1);
      }

      if (!gitUrl) {
        // shame!
        continue;
      }

      let rawUrl = gitUrl.replace(`://github`, `://raw.githubusercontent`);
      let packageUrl = `${rawUrl}/master/package.json`;

      let packageJson;

      try {
        let packageResponse = await fetch(packageUrl);
        packageJson = await packageResponse.text();
      } catch (e) {
        console.error(e);
        process.exit(1);
      }

      if (packageJson.includes('jQuery') || packageJson.includes('jquery')) {
        let matches = gitUrl.match(GITHUB_REGEX);

        if (!matches) {

          console.log('no matches for url:', gitUrl);
          continue;
        }

        let [_match, owner, repo] = matches;

        let key = `${owner}/${repo}`

        console.log(key);
        if (!alreadyVisited.includes(key)) {
          progress[key] = {
            owner, repo
          };

        }
      }
    }

  }

  console.log(progress);
  writeProgressFile(progress);
}

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

async function pushBranch({ cwd }) {
  await run(`git checkout -b ${branchName}`, { cwd });
  await run(`git add .`, { cwd });
  await run(`git commit -m "Ran codemods to remove jQuery"`, { cwd });
  await run(`git push origin ${branchName}`, { cwd });
}

async function runCodemods({ cwd }) {
  if (fs.existsSync(path.join(cwd, 'addon'))) {
    await run(`npx ember-3x-codemods jquery-apis ./addon`, { cwd });
  }
  if (fs.existsSync(path.join(cwd, 'addon-test-support'))) {
    await run(`npx ember-3x-codemods jquery-apis ./addon-test-support`, { cwd });
  }
  if (fs.existsSync(path.join(cwd, 'test-support'))) {
    await run(`npx ember-3x-codemods jquery-apis ./test-support`, { cwd });
  }
  if (fs.existsSync(path.join(cwd, 'tests', 'integration'))) {
    await run(`npx ember-test-helpers-codemod integration tests/integration`, { cwd });
  }
  if (fs.existsSync(path.join(cwd, 'tests', 'acceptance'))) {
  await run(`npx ember-test-helpers-codemod acceptance tests/acceptance`, { cwd });
  }
  if (fs.existsSync(path.join(cwd, 'tests'))) {
    await run(`npx ember-test-helpers-codemod native-dom tests --ext js,ts`, { cwd });
  }
}

async function getUserName() {
  let user = await octokit.users.getAuthenticated();

  return user.data.login;
}

async function hasFork({ owner, repo }) {
 let user = await octokit.users.getAuthenticated();
 let forks = await octokit.repos.listForks({ owner, repo });
 let hasFork = forks.data.find(fork => fork.owner.login === user.data.login);

  return hasFork;
}

async function clone({ owner, repo, cwd }) {
  console.log(`cloning... ${owner}/${repo} into ${cwd}`);
  let gitUrl = await gitUrlFor({ owner, repo });

  await run(`git clone ${gitUrl}`, { cwd });

  return path.join(cwd, repo);
}

async function fork({ owner, repo }) {
  return await octokit.repos.createFork({ owner, repo });
}

async function repoExists({ owner, repo }) {
  try {
    let url = await gitUrlFor({ owner, repo });

    return Boolean(url);
  } catch (e) {
    switch (e.status) {
      case 404: return false;
      default:
        throw e;
    }
  }
}

async function gitUrlFor({ owner, repo }) {
  console.log(`getting git Url: ${owner}/${repo}`);
  let response = await octokit.repos.get({ owner, repo });

  return response.data.git_url;
}

function runRemainingTransforms() {
  codemodCli.runTransform(
    __dirname,
    process.argv[2] /* transform name */,
    process.argv.slice(3) /* paths or globs */
  );
}

removeJQuery();
