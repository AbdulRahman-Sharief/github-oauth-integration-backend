const passport = require("passport");
const { redirectToFrontendWithLoginStatus } = require("../helpers/helpers");
const axios = require("axios");

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

module.exports = {
    githubLogin,
    githubCallback,
};
