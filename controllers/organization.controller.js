const axios = require('axios');
const Organization = require('../models/organization.model');
const User = require("../models/user.model");
const Repository = require('../models/repository.model');

/**
 * Controller to fetch GitHub organizations and store them in the database.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const getAllOrganizations = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId).select('accessToken');
        if (!user || !user.accessToken) {
            return res.status(404).json({ message: 'User not found or access token missing' });
        }

        const endpoint = 'https://api.github.com/user/orgs';
        const token = user.accessToken;
        console.log(user)
        const response = await axios.get(endpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
            },
        });

        console.log('Granted Scopes:', response.headers['x-oauth-scopes']);
        console.log('Organizations:', response.data);

        const organizations = await Organization.insertMany(
            response.data.map(({ id, login, avatar_url, description, url }) => ({
                githubId: id,
                login,
                userId: user._id,
                avatar_url,
                description,
                url
            }))
        );


        res.status(200).json({ organizations });
    } catch (error) {
        console.error('Failed to fetch organizations:', error?.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch organizations', error: error.message });
    }
};

/**
 * Fetch GitHub organization repos and store them in the database.
 * @route GET /api/github/sync-organization-repos
 * @query userId - MongoDB User ID
 * @query organizationId - MongoDB Organization ID
 */
const getAllOrganizationRepositories = async (req, res) => {
    try {
        const { userId, organizationId } = req.query;
        console.log('Query Params:', req.query);
        // Validate query params
        if (!userId || !organizationId) {
            return res.status(400).json({ message: 'Missing userId or organizationId' });
        }

        // Find user
        const user = await User.findById(userId).select('accessToken');
        if (!user || !user.accessToken) {
            return res.status(404).json({ message: 'User not found or missing access token' });
        }

        // Find organization
        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.login) {
            return res.status(404).json({ message: 'Organization not found or missing login' });
        }

        // Fetch repos from GitHub API
        const { data: reposData, headers } = await axios.get(
            `https://api.github.com/orgs/${organization.login}/repos`,
            {
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                    Accept: 'application/vnd.github+json',
                },
            }
        );

        console.log('GitHub OAuth Scopes:', headers['x-oauth-scopes']);
        console.log('Fetched Repositories:', reposData);


        // Insert repos into DB
        const repos = await Repository.insertMany(
            reposData.map(({ id, name, full_name, url, description, visibility }) => ({
                githubId: id,
                name,
                fullName: full_name,
                organizationId: organization._id,
                url,
                description,
                visibility
            }))
        );

        return res.status(200).json({ repos });
    } catch (error) {
        console.error('Error syncing GitHub repos:', error.message);
        return res.status(500).json({ message: 'Failed to sync repos', error: error.message });
    }
};


module.exports = {
    getAllOrganizations,
    getAllOrganizationRepositories
}