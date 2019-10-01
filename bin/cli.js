#!/usr/bin/env node
'use strict';

/**
 * Required ENV vars
 * - GITHUB_TOKEN
 *
 *
 */
const tmp = require('tmp');

const { scrapeEverything } = require('./ember-observer-scraper');
const { progressFile, writeProgressFile } = require('./cache');
const { runCodemods } = require('./transforms');
const {
  getUserName,
  repoExists, fork, clone,
  pushBranch, createPR,
  checkoutBranch
} = require('./git');

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

  for (let i = 0; i < 10 /* repos.length */; i++) {
    let key = repos[i];
    let info = progress[key];

    if (info.prCreated) {
      continue;
    }

    let updateState = (dataForRepo = {}) => {
      progress[key] = {
        ...dataForRepo,
        ...info,
      };

      writeProgressFile(progress);
    }

    await removeJQueryFor(info, updateState);
    // break;
  }
}

async function removeJQueryFor(theirs, updateState) {
  let userName = await getUserName();
  let { repo } = theirs;
  let mine = { owner: userName, repo };

  let { name: tmpPath, removeCallback: cleanTmp } = tmp.dirSync({template: '/home/lprestonsegoiii/Development/tmp/tmp-XXXXXX' });

  try {
    if (!await repoExists(mine)) {
      await fork(theirs);
    }

    updateState({ forked: true });

    let repoPath = await clone({ owner: userName, repo, cwd: tmpPath });

    // let repoPath = `/home/lprestonsegoiii/Development/OpenSource/cardstack-auth0`
    await checkoutBranch({ cwd: repoPath });

    await runCodemods({ cwd: repoPath, updateState });

    await pushBranch({ cwd: repoPath, repo, owner: userName, updateState });

    await createPR({
      base: userName,
      upstream: theirs.owner,
      repo,
      updateState
    });
  } catch (e) {
    console.log('sadness');
    console.error(e);
  } finally {
    cleanTmp();
  }


}

async function begin() {
  // await scrapeEverything();
  await removeJQuery();
}

begin();


