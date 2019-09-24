#!/usr/bin/env node
'use strict';

// TODO:
//
// Parse EmberObserver
//
// Integrate with GitHub
//  - Check for Credentials in ENV vars
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

require('codemod-cli').runTransform(
  __dirname,
  process.argv[2] /* transform name */,
  process.argv.slice(3) /* paths or globs */
);
