const Octokit = require("@octokit/rest");
const path = require('path');
const execa = require('execa');
const { run } = require('./shell');

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


async function checkoutBranch({ cwd }) {
  console.log('switching branches...');
  try {
    await execa(`git checkout -b ${branchName}`, options);
  } catch (e) {
    // branch exists?
  }

  await execa(`git checkout ${branchName}`, options);

  console.log('fetching remote changes...');
  await execa(`git pull origin ${branchName}`, options);
}


async function pushBranch({ cwd, updateState, repo, owner }) {
  let options = {
    shell: true,
    cwd,
    stdio: 'inherit',
    // env: {
    //   GIT_SSH_COMMAND: `ssh -i ${process.env.HOME}/.ssh/id_rsa`,
    // }
  };

  console.log('adding changes...');
  await execa(`git`, ['add', '.'], options);
  console.log('committing...');
  await execa(`git commit -m"Ran codemods to remove jQuery" --allow-empty`, options);
  // console.log('updating origin crap....');
  // await execa(`git remote rm origin`, options);
  // await execa(`git remote add origin git@github.com:${owner}/${repo}.git`, options);
  console.log('pushing...');
  await execa(`git push --set-upstream origin ${branchName}`, options);

  updateState({
    pushed: true,
  });
}



async function gitUrlFor({ owner, repo }) {
  console.log(`getting git Url: ${owner}/${repo}`);
  let response = await octokit.repos.get({ owner, repo });

  // console.log(response.data);
  return response.data.ssh_url;
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


async function createPR({ base, upstream, repo, updateState }) {
  console.log(`creating PR: ${upstream} <- ${base} with ${repo}`);

  await octokit.pulls.create({
    owner: upstream,
    repo,
    head: `${base}:${branchName}`,
    base: 'master', // todo, fix for repos who have a different default
    title: 'Remove jQuery',
    body: `
     This is an automated PR from: https://github.com/NullVoxPopuli/ember-jSquirrels

     In an effort to better ready the Ember ecosystem for the modern web, jQuery must be removed.

     There have been native replacements for jQuery APIs for quite a few years.

     Removing jQuery will reduce everyone's app vendor size by 30-80kb after min+gzip, depending on the jQuery version.
    `
  });

  updateState({
    prCreated: true,
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
  GITHUB_REGEX,
  createPR,
  checkoutBranch,
}
