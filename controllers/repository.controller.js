const axios = require('axios');
const { Octokit } = require("@octokit/rest");
const User = require('../models/user.model');
const Organization = require('../models/organization.model');
const Repository = require('../models/repository.model');
const Commit = require('../models/commit.model');
const PullRequest = require('../models/pull.model');
const Issue = require('../models/issue.model');
const Changelog = require('../models/changelog.model')
const createOctokit = (token) => new Octokit({ auth: token });
const paginate = async (fetchFn, params = {}) => {
    let results = [];
    let page = 1;

    while (true) {
        const { data } = await fetchFn({ ...params, per_page: 100, page });
        if (data.length === 0) break;
        results.push(...data);
        page++;
    }

    return results;
};

const syncOrgReposWithStats = async (req, res) => {
    try {
        const { userId, repoIds } = req.body;

        if (!userId || !Array.isArray(repoIds)) {
            return res.status(400).json({ message: 'Invalid request payload' });
        }

        const user = await User.findById(userId).select("accessToken username");
        console.log('user:', user);
        if (!user || !user.accessToken) {
            return res.status(404).json({ message: 'User not found or access token missing' });
        }

        const results = await Promise.all(
            repoIds.map(async (repoId) => {
                const repo = await Repository.findOne({ _id: repoId });
                if (!repo) return null;

                try {
                    const fetchDataRequest = async (url) => {
                        try {
                            const { data, headers } = await axios.get(url, {
                                headers: {
                                    Authorization: `Bearer ${user.accessToken}`,
                                    Accept: 'application/vnd.github+json',
                                },
                            });

                            console.log('Granted Scopes:', headers['x-oauth-scopes']);

                            return data;
                        } catch (err) {
                            console.error(`GitHub API error (${url}):`, err.response?.data || err.message);
                            throw new Error('GitHub fetch failed');
                        }
                    };

                    const [commits, pullRequests, issues] = await Promise.all([
                        fetchDataRequest(`https://api.github.com/repos/${repo.fullName}/commits`),
                        fetchDataRequest(`https://api.github.com/repos/${repo.fullName}/pulls`),
                        fetchDataRequest(`https://api.github.com/repos/${repo.fullName}/issues`),
                    ]);

                    return {
                        user: user.username,
                        userId: user._id,
                        repoGitHubId: repo.githubId,
                        repoName: repo.name,
                        totalCommits: commits.length,
                        totalPullRequests: pullRequests.length,
                        totalIssues: issues.length,
                    };
                } catch (err) {
                    console.error(`Failed to fetch data for repo (${repoId}):`, err.message);
                    return null;
                }
            })
        );
        console.log('Results:', results);
        res.status(200).json(results.filter(Boolean));
    } catch (err) {
        console.error('Error in getRepoDetailsBatch:', err);
        res.status(500).json({
            message: 'Failed to fetch repository details',
            error: err.message,
        });
    }
};


// Get all commits for a specific repo
const getAllRepoCommits = async (req, res) => {
    try {
        const { userId, repoId } = req.query;
        const user = await User.findById(userId).select('accessToken');
        const repo = await Repository.findById(repoId);

        if (!user || !user.accessToken || !repo) {
            return res.status(404).json({ message: 'User or Repo not found' });
        }

        const octokit = createOctokit(user.accessToken);

        const commits = await paginate(octokit.rest.repos.listCommits, {
            owner: repo.fullName.split('/')[0],
            repo: repo.name,
        });
        try {
            /*
            {
        sha: '997c7bc930304142b3af37bcb21599181124aeb4',
        node_id: 'C_kwDOO4yn5toAKDk5N2M3YmM5MzAzMDQxNDJiM2FmMzdiY2IyMTU5OTE4MTEyNGFlYjQ',
        commit: {
          author: {"name":"Ruslan Lesiutin","email":"rdlesyutin@gmail.com","date":"2025-06-09T17:25:19Z"},
          committer: {"name":"GitHub","email":"noreply@github.com","date":"2025-06-09T17:25:19Z"},
          message: '[DevTools] Get source location from structured callsites in prepareStackTrace (#33143)\n' +
            '\n' +
            'When we get the source location for "View source for this element" we\n' +
            'should be using the enclosing function of the callsite of the child. So\n' +
            "that we don't just point to some random line within the component.\n" +
            '\n' +
            'This is similar to the technique in #33136.\n' +
            '\n' +
            'This technique is now really better than the fake throw technique, when\n' +
            "available. So I now favor the owner technique. The only problem it's\n" +
            "only available in DEV and only if it has a child that's owned (and not\n" +
            'filtered).\n' +
            '\n' +
            "We could implement this same technique for the error that's thrown in\n" +
            "the fake throwing solution. However, we really shouldn't need that at\n" +
            'all because for client components we should be able to call\n' +
            '`inspect(fn)` at least in Chrome which is even better.',
          tree: [Object],
          url: 'https://api.github.com/repos/srediotestorganization/react/git/commits/997c7bc930304142b3af37bcb21599181124aeb4',
          comment_count: 0,
          verification: [Object]
        },
        url: 'https://api.github.com/repos/srediotestorganization/react/commits/997c7bc930304142b3af37bcb21599181124aeb4',
        html_url: 'https://github.com/srediotestorganization/react/commit/997c7bc930304142b3af37bcb21599181124aeb4',
        comments_url: 'https://api.github.com/repos/srediotestorganization/react/commits/997c7bc930304142b3af37bcb21599181124aeb4/comments',
        author: {
          login: 'sebmarkbage',
          id: 63648,
          node_id: 'MDQ6VXNlcjYzNjQ4',
          avatar_url: 'https://avatars.githubusercontent.com/u/63648?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/sebmarkbage',
          html_url: 'https://github.com/sebmarkbage',
          followers_url: 'https://api.github.com/users/sebmarkbage/followers',
          following_url: 'https://api.github.com/users/sebmarkbage/following{/other_user}',
          gists_url: 'https://api.github.com/users/sebmarkbage/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/sebmarkbage/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/sebmarkbage/subscriptions',
          organizations_url: 'https://api.github.com/users/sebmarkbage/orgs',
          repos_url: 'https://api.github.com/users/sebmarkbage/repos',
          events_url: 'https://api.github.com/users/sebmarkbage/events{/privacy}',
          received_events_url: 'https://api.github.com/users/sebmarkbage/received_events',
          type: 'User',
          user_view_type: 'public',
          site_admin: false
        },
        committer: {
          login: 'web-flow',
          id: 19864447,
          node_id: 'MDQ6VXNlcjE5ODY0NDQ3',
          avatar_url: 'https://avatars.githubusercontent.com/u/19864447?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/web-flow',
          html_url: 'https://github.com/web-flow',
          followers_url: 'https://api.github.com/users/web-flow/followers',
          following_url: 'https://api.github.com/users/web-flow/following{/other_user}',
          gists_url: 'https://api.github.com/users/web-flow/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/web-flow/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/web-flow/subscriptions',
          organizations_url: 'https://api.github.com/users/web-flow/orgs',
          repos_url: 'https://api.github.com/users/web-flow/repos',
          events_url: 'https://api.github.com/users/web-flow/events{/privacy}',
          received_events_url: 'https://api.github.com/users/web-flow/received_events',
          type: 'User',
          user_view_type: 'public',
          site_admin: false
        },
        parents: [ [Object] ]
        },
            */
            const saved = await Commit.insertMany(
                commits.map(({ sha, commit, author, committer, url }) => ({
                    sha,
                    repoId: repo._id,
                    message: commit.message,
                    author: author?.login || null,
                    committer: committer?.login || null,
                    date: commit.author.date,
                    url
                })),
                {
                    ordered: false
                }
            );

        } catch (err) {

            if (err.code !== 11000) {
                // Not a duplicate key error
                throw err;
            }
            console.warn('Some duplicate organizations were skipped.');
        }
        const commitsDB = await Commit.find({ repoId: repo._id }).sort({ date: -1 });

        return res.status(200).json({ commits: commitsDB });
    } catch (error) {
        console.error('Commits fetch failed:', error.message);
        res.status(500).json({ message: 'Failed to fetch commits', error: error.message });
    }
};

// Get all pull requests for a specific repo
const getAllRepoPulls = async (req, res) => {
    try {
        const { userId, repoId } = req.query;
        const user = await User.findById(userId).select('accessToken');
        const repo = await Repository.findById(repoId);

        if (!user || !repo) {
            return res.status(404).json({ message: 'User or Repo not found' });
        }

        const octokit = createOctokit(user.accessToken);

        const pulls = await paginate(octokit.rest.pulls.list, {
            owner: repo.fullName.split('/')[0],
            repo: repo.name,
            state: 'all'
        });
        console.log('Pull Requests:', pulls);
        /*
        {
    url: 'https://api.github.com/repos/srediotestorganization/react/pulls/1',
    id: 2582555245,
    node_id: 'PR_kwDOO4yn5s6Z7qpt',
    html_url: 'https://github.com/srediotestorganization/react/pull/1',
    diff_url: 'https://github.com/srediotestorganization/react/pull/1.diff',
    patch_url: 'https://github.com/srediotestorganization/react/pull/1.patch',
    issue_url: 'https://api.github.com/repos/srediotestorganization/react/issues/1',
    number: 1,
    state: 'open',
    locked: false,
    title: 'test PR 1',
    user: {
      login: 'AbdulRahman-Sharief-1',
      id: 215410755,
      node_id: 'U_kgDODNboQw',
      avatar_url: 'https://avatars.githubusercontent.com/u/215410755?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/AbdulRahman-Sharief-1',
      html_url: 'https://github.com/AbdulRahman-Sharief-1',
      followers_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/followers',
      following_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/following{/other_user}',
      gists_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/subscriptions',
      organizations_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/orgs',
      repos_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/repos',
      events_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/events{/privacy}',
      received_events_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/received_events',
      type: 'User',
      user_view_type: 'public',
      site_admin: false
    },
    body: '<!--\r\n' +
      '  Thanks for submitting a pull request!\r\n' +
      '  We appreciate you spending the time to work on these changes. Please provide enough information so that others can review your pull request. The three fields below are mandatory.\r\n' +
      '\r\n' +
      '  Before submitting a pull request, please make sure the following is done:\r\n' +
      '\r\n' +
      '  1. Fork [the repository](https://github.com/facebook/react) and create your branch from `main`.\r\n' +
      '  2. Run `yarn` in the repository root.\r\n' +
      "  3. If you've fixed a bug or added code that should be tested, add tests!\r\n" +
      '  4. Ensure the test suite passes (`yarn test`). Tip: `yarn test --watch TestName` is helpful in development.\r\n' +
      '  5. Run `yarn test --prod` to test in the production environment. It supports the same options as `yarn test`.\r\n' +
      '  6. If you need a debugger, run `yarn test --debug --watch TestName`, open `chrome://inspect`, and press "Inspect".\r\n' +
      '  7. Format your code with [prettier](https://github.com/prettier/prettier) (`yarn prettier`).\r\n' +
      '  8. Make sure your code lints (`yarn lint`). Tip: `yarn linc` to only check changed files.\r\n' +
      '  9. Run the [Flow](https://flowtype.org/) type checks (`yarn flow`).\r\n' +
      "  10. If you haven't already, complete the CLA.\r\n" +
      '\r\n' +
      '  Learn more about contributing: https://reactjs.org/docs/how-to-contribute.html\r\n' +
      '-->\r\n' +
      '\r\n' +
      '## Summary\r\n' +
      '\r\n' +
      '<!--\r\n' +
      ' Explain the **motivation** for making this change. What existing problem does the pull request solve?\r\n' +
      '-->\r\n' +
      '\r\n' +
      '## How did you test this change?\r\n' +
      '\r\n' +
      '<!--\r\n' +
      '  Demonstrate the code is solid. Example: The exact commands you ran and their output, screenshots / videos if the pull request changes the user interface.\r\n' +
      '  How exactly did you verify that your PR solves the issue you wanted to solve?\r\n' +
      '  If you leave this empty, your PR will very likely be closed.\r\n' +
      '-->\r\n',
      created_at: '2025-06-10T21:47:25Z',
      updated_at: '2025-06-10T21:47:25Z',
      closed_at: null,
      merged_at: null,
      merge_commit_sha: null,
      assignee: null,
      assignees: [],
      requested_reviewers: [],
      requested_teams: [],
      labels: [],
      milestone: null,
      draft: false,
      commits_url: 'https://api.github.com/repos/srediotestorganization/react/pulls/1/commits',
      review_comments_url: 'https://api.github.com/repos/srediotestorganization/react/pulls/1/comments',
      review_comment_url: 'https://api.github.com/repos/srediotestorganization/react/pulls/comments{/number}',
      comments_url: 'https://api.github.com/repos/srediotestorganization/react/issues/1/comments',
      statuses_url: 'https://api.github.com/repos/srediotestorganization/react/statuses/80c03eb7e0f05da5e0de6faebbe8dbb434455454',
      head: {
        label: 'srediotestorganization:main',
        ref: 'main',
        sha: '80c03eb7e0f05da5e0de6faebbe8dbb434455454',
        user: [Object],
        repo: [Object]
      },
      base: {
        label: 'srediotestorganization:gh/mofeiZ/17/head',
        ref: 'gh/mofeiZ/17/head',
        sha: '0735db9170cc515f34cfbde4f64186ca34a2fe91',
        user: [Object],
        repo: [Object]
      },
      _links: {
        self: [Object],
        html: [Object],
        issue: [Object],
        comments: [Object],
        review_comments: [Object],
        review_comment: [Object],
        commits: [Object],
        statuses: [Object]
      },
      author_association: 'MEMBER',
      auto_merge: null,
      active_lock_reason: null
      
  }
        
        */
        const saved = await PullRequest.insertMany(
            pulls.map(({ url, id, title, state, user, created_at, updated_at, closed_at, merged_at }) => ({
                url,
                githubId: id,
                repoId: repo._id,
                title,
                state,
                user: user?.login,
                pullCreatedAt: created_at,
                pullUpdatedAt: updated_at,
                pullClosedAt: closed_at,
                pullMergedAt: merged_at
            })),
            {
                ordered: false
            }
        );

        res.status(200).json({ pulls: saved });
    } catch (error) {
        console.error('PRs fetch failed:', error.message);
        res.status(500).json({ message: 'Failed to fetch pull requests', error: error.message });
    }
};

// Get all issues for a specific repo
const getAllRepoIssues = async (req, res) => {
    try {
        const { userId, repoId } = req.query;
        const user = await User.findById(userId).select('accessToken');
        const repo = await Repository.findById(repoId);

        if (!user || !repo) {
            return res.status(404).json({ message: 'User or Repo not found' });
        }

        const octokit = createOctokit(user.accessToken);

        const issues = await paginate(octokit.rest.issues.listForRepo, {
            owner: repo.fullName.split('/')[0],
            repo: repo.name,
            state: 'all'
        });
        console.log('Issues:', issues);

        /*
        {
            "url": "https://api.github.com/repos/srediotestorganization/react/issues/1",
            "repository_url": "https://api.github.com/repos/srediotestorganization/react",
            "labels_url": "https://api.github.com/repos/srediotestorganization/react/issues/1/labels{/name}",
            "comments_url": "https://api.github.com/repos/srediotestorganization/react/issues/1/comments",
            "events_url": "https://api.github.com/repos/srediotestorganization/react/issues/1/events",
            "html_url": "https://github.com/srediotestorganization/react/pull/1",
            "id": 3134919332,
            "node_id": "PR_kwDOO4yn5s6Z7qpt",
            "number": 1,
            "title": "test PR 1",
            "user": {
                "login": "AbdulRahman-Sharief-1",
                "id": 215410755,
                "node_id": "U_kgDODNboQw",
                "avatar_url": "https://avatars.githubusercontent.com/u/215410755?v=4",
                "gravatar_id": "",
                "url": "https://api.github.com/users/AbdulRahman-Sharief-1",
                "html_url": "https://github.com/AbdulRahman-Sharief-1",
                "followers_url": "https://api.github.com/users/AbdulRahman-Sharief-1/followers",
                "following_url": "https://api.github.com/users/AbdulRahman-Sharief-1/following{/other_user}",
                "gists_url": "https://api.github.com/users/AbdulRahman-Sharief-1/gists{/gist_id}",
                "starred_url": "https://api.github.com/users/AbdulRahman-Sharief-1/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/AbdulRahman-Sharief-1/subscriptions",
                "organizations_url": "https://api.github.com/users/AbdulRahman-Sharief-1/orgs",
                "repos_url": "https://api.github.com/users/AbdulRahman-Sharief-1/repos",
                "events_url": "https://api.github.com/users/AbdulRahman-Sharief-1/events{/privacy}",
                "received_events_url": "https://api.github.com/users/AbdulRahman-Sharief-1/received_events",
                "type": "User",
                "user_view_type": "public",
                "site_admin": false
            },
            "labels": [],
            "state": "open",
            "locked": false,
            "assignee": null,
            "assignees": [],
            "milestone": null,
            "comments": 0,
            "created_at": "2025-06-10T21:47:25Z",
            "updated_at": "2025-06-10T21:47:25Z",
            "closed_at": null,
            "author_association": "MEMBER",
            "type": null,
            "active_lock_reason": null,
            "draft": false,
            "pull_request": {
                "url": "https://api.github.com/repos/srediotestorganization/react/pulls/1",
                "html_url": "https://github.com/srediotestorganization/react/pull/1",
                "diff_url": "https://github.com/srediotestorganization/react/pull/1.diff",
                "patch_url": "https://github.com/srediotestorganization/react/pull/1.patch",
                "merged_at": null
            },
            "body": "<!--\r\n  Thanks for submitting a pull request!\r\n  We appreciate you spending the time to work on these changes. Please provide enough information so that others can review your pull request. The three fields below are mandatory.\r\n\r\n  Before submitting a pull request, please make sure the following is done:\r\n\r\n  1. Fork [the repository](https://github.com/facebook/react) and create your branch from `main`.\r\n  2. Run `yarn` in the repository root.\r\n  3. If you've fixed a bug or added code that should be tested, add tests!\r\n  4. Ensure the test suite passes (`yarn test`). Tip: `yarn test --watch TestName` is helpful in development.\r\n  5. Run `yarn test --prod` to test in the production environment. It supports the same options as `yarn test`.\r\n  6. If you need a debugger, run `yarn test --debug --watch TestName`, open `chrome://inspect`, and press \"Inspect\".\r\n  7. Format your code with [prettier](https://github.com/prettier/prettier) (`yarn prettier`).\r\n  8. Make sure your code lints (`yarn lint`). Tip: `yarn linc` to only check changed files.\r\n  9. Run the [Flow](https://flowtype.org/) type checks (`yarn flow`).\r\n  10. If you haven't already, complete the CLA.\r\n\r\n  Learn more about contributing: https://reactjs.org/docs/how-to-contribute.html\r\n-->\r\n\r\n## Summary\r\n\r\n<!--\r\n Explain the **motivation** for making this change. What existing problem does the pull request solve?\r\n-->\r\n\r\n## How did you test this change?\r\n\r\n<!--\r\n  Demonstrate the code is solid. Example: The exact commands you ran and their output, screenshots / videos if the pull request changes the user interface.\r\n  How exactly did you verify that your PR solves the issue you wanted to solve?\r\n  If you leave this empty, your PR will very likely be closed.\r\n-->\r\n",
            "closed_by": null,
            "reactions": {
                "url": "https://api.github.com/repos/srediotestorganization/react/issues/1/reactions",
                "total_count": 0,
                "+1": 0,
                "-1": 0,
                "laugh": 0,
                "hooray": 0,
                "confused": 0,
                "heart": 0,
                "rocket": 0,
                "eyes": 0
            },
            "timeline_url": "https://api.github.com/repos/srediotestorganization/react/issues/1/timeline",
            "performed_via_github_app": null,
            "state_reason": null
        }
        */


        const saved = await Issue.insertMany(
            issues.map(({ url, id, number, title, state, user, created_at, updated_at, closed_at }) => ({
                url,
                githubId: id,
                repoId: repo._id,
                number,
                title,
                state,
                user: user?.login,
                issueCreatedAt: created_at,
                issueUpdatedAt: updated_at,
                issueClosedAt: closed_at

            })),
            {
                ordered: false
            }
        );

        res.status(200).json({ issues: saved });
    } catch (error) {
        console.error('Issues fetch failed:', error.message);
        res.status(500).json({ message: 'Failed to fetch issues', error: error.message });
    }
};

// Get issue changelogs (timeline events)
const getAllIssueChangelogs = async (req, res) => {
    try {
        const { userId, repoId, issueNumber } = req.query;
        const user = await User.findById(userId).select('accessToken');
        const repo = await Repository.findById(repoId);

        if (!user || !repo || !issueNumber) {
            return res.status(400).json({ message: 'Missing user/repo/issueNumber' });
        }

        const octokit = createOctokit(user.accessToken);

        const timeline = await paginate(octokit.rest.issues.listEventsForTimeline, {
            owner: repo.fullName.split('/')[0],
            repo: repo.name,
            issue_number: parseInt(issueNumber),
            mediaType: {
                previews: ["mockingbird"]
            }

        });

        console.log('Issue Timeline:', timeline);
        /*
        {
    id: 18084153840,
    node_id: 'RTE_lADOO5htqs6623VNzwAAAAQ15knw',
    url: 'https://api.github.com/repos/srediotestorganization/testRepo/issues/events/18084153840',
    actor: {
      login: 'AbdulRahman-Sharief-1',
      id: 215410755,
      node_id: 'U_kgDODNboQw',
      avatar_url: 'https://avatars.githubusercontent.com/u/215410755?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/AbdulRahman-Sharief-1',
      html_url: 'https://github.com/AbdulRahman-Sharief-1',
      followers_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/followers',
      following_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/following{/other_user}',
      gists_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/subscriptions',
      organizations_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/orgs',
      repos_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/repos',
      events_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/events{/privacy}',
      received_events_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/received_events',
      type: 'User',
      user_view_type: 'public',
      site_admin: false
    },
    event: 'renamed',
    commit_id: null,
    commit_url: null,
    created_at: '2025-06-10T23:38:07Z',
    rename: { from: 'test issue 1', to: 'renamed issue title 1' },
    performed_via_github_app: null
  }
        */
        const saved = await Changelog.insertMany(
            timeline.map(({ id, url, event, created_at, actor }) => ({
                githubId: id,
                repoId: repo._id,
                issueNumber,
                url,
                event,
                actor: actor?.login,
                changeLogCreatedAt: created_at
            })),
            {
                ordered: false
            }
        );
        res.status(200).json({ changelogs: saved });
    } catch (error) {
        console.error('Issue changelogs fetch failed:', error.message);
        res.status(500).json({ message: 'Failed to fetch changelogs', error: error.message });
    }
};

module.exports = {
    syncOrgReposWithStats,
    getAllRepoCommits,
    getAllIssueChangelogs,
    getAllRepoIssues,
    getAllRepoPulls,
    getAllRepoCommits
}  