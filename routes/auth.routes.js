const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.get("/github", authController.githubLogin);
router.get("/github/callback", authController.githubCallback);
router.post("/auth-status", authController.checkAuthStatus);
router.post("/remove", authController.revokeGithubAccessAndRedirect);
module.exports = router;
