const fetch = require('node-fetch');

const { GITHUB_REGEX } = require('./git');
const { progressFile, writeProgressFile } = require('./cache');

const jQueryPackageParts = [
  'jquery',
  'ajax',
];

const jQueryNameKeywords = [
  'jquery',
  'semantic-ui',
  'ajax',
  'colpick',
  'twitter-typeahead',
  'fotorama',
  'froala',
  'mousewheel',
  'ui-dropzone',
  'backstretch'
];

const beginningOf2017 = new Date(2017, 0, 1);

/**
 * NOTE: ember-observer doesn't have a public api
 *
 * So, we need to do some silly things to get as many
 * addons as possible.
 *
 * 1. Get all the categories.
 * 2. Load repos for each category.
 *    There will be overlap.
 *
 */
async function scrapeEverything() {
  let categories = await getCategories();

  let allRepos = [];

  for (let i = 0; i < categories.length; i++) {
    let { id, name } = categories[i];
    console.log(`Getting Repos from ${name}`);

    let repos = await getReposForCategory({ id });

    allRepos = allRepos.concat(repos);
  }

  console.log(`There are ${allRepos.length} repos`);

  await filterByjQueryAndWriteToCache(allRepos);

  let reposNeedingPr = progressFile();

  console.log(`There are ${Object.keys(reposNeedingPr).length} repos with jQuery`);

  return reposNeedingPr;
}

async function getCategories() {
  let url = `https://emberobserver.com/api/v2/categories?include=subcategories%2Cparent`;

  let data = await getDataFromUrl(url);

  return data.map(({ id, attributes}) => {
    return {
      id,
      name: attributes.name,
    }
  });
}

async function getReposForCategory({ id }) {
  let url = `https://emberobserver.com/api/v2/addons?filter%5BinCategory%5D=${id}&include=categories`

  let data = await getDataFromUrl(url);

  let result = [];

  for (let i = 0; i < data.length; i++) {
    let gitUrl = gitUrlFrom(data[i]);

    if (!gitUrl) {
      // shame!
      continue;
    }

    let updatedAt = data[i].attributes['latest-version-date'];

    // too old
    if (new Date(updatedAt) < beginningOf2017) {
      continue;
    }

    result.push({ gitUrl });
  }

  return result;
}

function containsAny(str, options) {
  for (let i = 0; i < options.length; i++) {
    if (str.includes(options[i])) {
      return true;
    }
  }

  return false;
}

async function filterByjQueryAndWriteToCache(repoList) {
  let progress = progressFile();
  let alreadyVisited = Object.keys(progress);

  for (let i = 0; i < repoList.length; i++) {
    let { gitUrl } = repoList[i];

    if (containsAny(gitUrl, jQueryNameKeywords)) {
      continue;
    }

    let { owner, repo, key } = ownerRepoFromUrl(gitUrl);

    if (!owner && !repo) {
      continue;
    }

    if (!alreadyVisited.includes(key)) {
      let packageJson = await getPackageJson(gitUrl);
      let isInNeedOfPR = hasjQuery(packageJson);

      if (isInNeedOfPR) {
         progress[key] = { owner, repo };
         writeProgressFile(progress);
      }
    }
  }

  writeProgressFile(progress);
}

async function getDataFromUrl(url) {
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

  return data;
}

function gitUrlFrom({ attributes }) {
  let gitUrl = attributes['repository-url'];
  let isInvalid = attributes['has-invalid-github-url'];

  if (isInvalid) {
    console.log('invalid repo!', attributes);
  }

  return gitUrl;
}

async function getPackageJson(gitUrl) {
  let rawUrl = gitUrl.replace(`://github`, `://raw.githubusercontent`);
  let packageUrl = `${rawUrl}/master/package.json`;

  let packageJson;

  try {
    let packageResponse = await fetch(packageUrl);
    packageJson = await packageResponse.text();
  } catch (e) {
    console.error(e);
    return '';
  }

  return packageJson;
}

function hasjQuery(packageJson) {
  let json = packageJson.toLowerCase();

  return containsAny(json, jQueryPackageParts);
}

function ownerRepoFromUrl(gitUrl) {
  let matches = gitUrl.match(GITHUB_REGEX);

  if (!matches) {

    console.log('no matches for url:', gitUrl);
    return {};
  }

  let [_match, owner, repo] = matches;

  let key = `${owner}/${repo}`

  return { key, owner, repo };
}

module.exports = {
  scrapeEverything,
}
