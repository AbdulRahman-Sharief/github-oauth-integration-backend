const { Octokit } = require("@octokit/rest");
const Organization = require('../models/organization.model');
const User = require("../models/user.model");
const Repository = require('../models/repository.model');
const OrganizationMember = require('../models/organizationMember.model');
// const OrgUser = require('../models/organizationMember.model');
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


/**
 * Controller to fetch GitHub organizations using Octokit and store them in the database.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
const getAllOrganizations = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId).select('accessToken');

        if (!user || !user.accessToken) {
            return res.status(404).json({ message: 'User not found or access token missing' });
        }

        const octokit = new Octokit({ auth: user.accessToken });

        const { data: orgs } = await octokit.rest.orgs.listForAuthenticatedUser();

        console.log('Organizations:', orgs);

        try {
            await Organization.insertMany(
                orgs.map(({ id, login, avatar_url, description, url }) => ({
                    githubId: id,
                    login,
                    userId: user._id,
                    avatar_url,
                    description,
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
        const organizations = await Organization.find({ userId: user._id });

        return res.status(200).json({ organizations });

    } catch (error) {
        console.error('Failed to fetch organizations:', error.message);
        res.status(500).json({ message: 'Failed to fetch organizations', error: error.message });
    }
};

/**
 * Controller to fetch repositories for an organization using Octokit and store them in the database.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
const getAllOrganizationRepositories = async (req, res) => {
    try {
        const { userId, organizationId } = req.query;

        if (!userId || !organizationId) {
            return res.status(400).json({ message: 'Missing userId or organizationId' });
        }

        const user = await User.findById(userId).select('accessToken');
        if (!user || !user.accessToken) {
            return res.status(404).json({ message: 'User not found or access token missing' });
        }

        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.login) {
            return res.status(404).json({ message: 'Organization not found or missing login' });
        }

        const octokit = new Octokit({ auth: user.accessToken });

        const repos = [];
        let page = 1;

        while (true) {
            const { data } = await octokit.rest.repos.listForOrg({
                org: organization.login,
                per_page: 100,
                page,
            });

            if (data.length === 0) break;

            repos.push(...data);
            page++;
        }

        console.log('Fetched Repositories:', repos.length);
        try {
            const insertedRepos = await Repository.insertMany(
                repos.map(({ id, name, full_name, html_url, description, visibility }) => ({
                    githubId: id,
                    name,
                    fullName: full_name,
                    organizationId: organization._id,
                    url: html_url,
                    description,
                    visibility
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
        const allRepos = await Repository.find({ organizationId: organization._id });
        return res.status(200).json({ repos: allRepos });
    } catch (error) {
        console.error('Error syncing GitHub repos:', error.message);
        if (error.writeErrors) {
            const duplicateErrors = error.writeErrors.filter(e => e.code === 11000);
            console.warn(`Skipped ${duplicateErrors.length} duplicate repositories`);
        } else {
            console.error('Error syncing GitHub repos:', error.message);
            return res.status(500).json({ message: 'Failed to sync repos', error: error.message });
        }
    }
};


// Get users in an organization
const getAllOrganizationMembers = async (req, res) => {
    try {
        const { userId, organizationId } = req.query;
        const user = await User.findById(userId).select('accessToken');
        const organization = await Organization.findById(organizationId);

        if (!user || !organization) {
            return res.status(404).json({ message: 'User or organization not found' });
        }

        const octokit = createOctokit(user.accessToken);

        const members = await paginate(octokit.rest.orgs.listMembers, {
            org: organization.login,
        });
        console.log('Fetched Organization Members:', members);
        /*
        
         {
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
  }
        */
        const saved = await OrganizationMember.insertMany(
            members.map(({ url, id, login, avatar_url, type }) => ({
                url,
                githubId: id,
                organizationId: organization._id,
                login,
                avatar_url,
                type,
            })),
            {
                ordered: false
            }
        );

        return res.status(200).json({ users: saved });
    } catch (error) {
        console.error('Org users fetch failed:', error.message);
        res.status(500).json({ message: 'Failed to fetch organization users', error: error.message });
    }
};

module.exports = {
    getAllOrganizations,
    getAllOrganizationRepositories,
    getAllOrganizationMembers
};
