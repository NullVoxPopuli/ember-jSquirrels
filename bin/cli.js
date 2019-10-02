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
  repoExists,
  fork,
  clone,
  pushBranch,
  createPR,
  wasPrClosed,
  checkoutBranch,
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

  for (let i = 60; i < 90 /* repos.length */; i++) {
    let key = repos[i];
    let info = progress[key];

    // if (info.prCreated) {
    //   console.log(`${key} already has a PR created.`);
    //   continue;
    // }

    let updateState = (dataForRepo = {}) => {
      progress[key] = {
        ...dataForRepo,
        ...info,
      };

      writeProgressFile(progress);
    };

    await removeJQueryFor(info, updateState);
    // break;
  }
}

async function removeJQueryFor(theirs, updateState) {
  let userName = await getUserName();
  let { repo } = theirs;
  let mine = { owner: userName, repo };

  let { name: tmpPath, removeCallback: cleanTmp } = tmp.dirSync();

  try {
    if (await wasPrClosed({ user: userName, repo })) {
      console.log(`PR for ${userName}/${repo} was closed or merged`);
      return;
    }

    if (!(await repoExists(mine))) {
      await fork(theirs);
    }

    updateState({ forked: true });

    let repoPath = await clone({ owner: userName, repo, cwd: tmpPath });

    // let repoPath = `${process.env.HOME}/Development/NullVoxPopuli/cardstack-auth0`
    await checkoutBranch({ cwd: repoPath });

    await runCodemods({ cwd: repoPath, updateState });

    await pushBranch({ cwd: repoPath, repo, owner: userName, updateState });

    // if (!(await prExists({ user: userName, repo }))) {
      await createPR({
        base: userName,
        upstream: theirs.owner,
        repo,
        updateState,
      });
    // }
  } catch (e) {
    console.log('sadness');
    console.error(e);
  } finally {
    cleanTmp();
  }
}

async function begin() {
  await scrapeEverything();
  // await removeJQuery();
}

begin();
