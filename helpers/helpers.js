/**
 * Redirects to the frontend with a status and optional userId
 */
const redirectToFrontendWithLoginStatus = (res, status, userId = null) => {
    const baseUrl = process.env.FRONTEND_URL;
    const params = new URLSearchParams({ status });
    if (userId) params.append("userId", userId);
    res.redirect(`${baseUrl}?${params.toString()}`);
};

module.exports = {
    redirectToFrontendWithLoginStatus
}