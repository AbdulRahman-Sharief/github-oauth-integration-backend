const passport = require("passport");
const { redirectToFrontendWithLoginStatus } = require("../helpers/helpers");
const axios = require("axios");
const User = require('../models/user.model');
const { Octokit } = require("@octokit/rest");
const createOctokit = (token) => new Octokit({ auth: token });
/**
 * Initiates GitHub OAuth login
 */
const githubLogin = passport.authenticate("github", {
    scope: ["read:org", "repo", "user", "user:email"],
});

/**
 * Handles GitHub OAuth callback
 */
const githubCallback = (req, res, next) => {
    passport.authenticate("github", (err, user, info) => {
        if (err) {
            console.error("GitHub authentication error:", err);
            return redirectToFrontendWithLoginStatus(res, "error");
        }

        if (!user) {
            console.warn("GitHub authentication failed:", info);
            return redirectToFrontendWithLoginStatus(res, "error");
        }

        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error("Login session error:", loginErr);
                return redirectToFrontendWithLoginStatus(res, "error");
            }

            return redirectToFrontendWithLoginStatus(res, "success", user.id);
        });
    })(req, res, next);
};


const checkAuthStatus = async (req, res) => {
    const { id: userId } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { _id, username, email, connectedAt } = user;
        console.log("User found:", { _id, username, email, connectedAt });
        return res.status(200).json({
            message: "Authentication status verified",
            isAuthenticated: true,
            user: {
                id: _id,
                username,
                email,
                connectedAt,
            },
        });
    } catch (error) {
        console.error("Failed to verify authentication status:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Remove GitHub access token from user and redirect to revoke page.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
const revokeGithubAccessAndRedirect = async (req, res) => {
    const { id: userId } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user || !user.githubId) {
            return res.status(400).json({
                message: "User not found or not connected with GitHub"
            });
        }

        // Remove only the GitHub access token
        user.accessToken = undefined;
        await user.save();

        // Redirect to GitHub's authorized app revocation page
        const githubRevokeUrl = `https://github.com/settings/connections/applications/${process.env.GITHUB_CLIENT_ID}`;

        // Optionally include frontend return URL (though GitHub may ignore it)
        const frontendRedirectUrl = encodeURIComponent(process.env.FRONTEND_URL || 'http://localhost:4200/logout-success');
        const finalRedirect = `${githubRevokeUrl}?return_to=${frontendRedirectUrl}`;

        return res.status(200).json({ redirectUrl: finalRedirect });

    } catch (error) {
        console.error("Error during GitHub revoke:", error.message);
        return res.status(500).json({
            message: "Failed to revoke GitHub connection",
            error: error.message
        });
    }
};



module.exports = {
    githubLogin,
    githubCallback,
    checkAuthStatus,
    revokeGithubAccessAndRedirect
};
