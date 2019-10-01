const Octokit = require("@octokit/rest");

const branchName = 'remove-jquery----ember-jSquirrels';
const { GITHUB_TOKEN } = process.env;

if (!GITHUB_TOKEN) {
  throw new Error(`Environment variable: GITHUB_TOKEN has not be set!`)
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const GITHUB_REGEX = /\/([\w-_]+)\/([\w-_]+)/


async function getUserName() {
  let user = await octokit.users.getAuthenticated();

  return user.data.login;
}


async function pushBranch({ cwd }) {
  await run(`git checkout -b ${branchName}`, { cwd });
  await run(`git add .`, { cwd });
  await run(`git commit -m "Ran codemods to remove jQuery"`, { cwd });
  await run(`git status`, { cwd });
  await run(`git push origin ${branchName}`, { cwd });
}



async function gitUrlFor({ owner, repo }) {
  console.log(`getting git Url: ${owner}/${repo}`);
  let response = await octokit.repos.get({ owner, repo });

  return response.data.git_url;
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

async function hasFork({ owner, repo }) {
  let user = await octokit.users.getAuthenticated();
  let forks = await octokit.repos.listForks({ owner, repo });
  let hasFork = forks.data.find(fork => fork.owner.login === user.data.login);

   return hasFork;
 }


async function fork({ owner, repo }) {
  return await octokit.repos.createFork({ owner, repo });
}

async function clone({ owner, repo, cwd }) {
  console.log(`cloning... ${owner}/${repo} into ${cwd}`);
  let gitUrl = await gitUrlFor({ owner, repo });

  await run(`git clone ${gitUrl}`, { cwd });

  return path.join(cwd, repo);
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



module.exports = {
  gitUrlFor,
  repoExists,
  fork,
  clone,
  getUserName,
  hasFork,
  pushBranch,
}
