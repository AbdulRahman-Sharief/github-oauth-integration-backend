const express = require("express");
const router = express.Router();
const { syncOrgReposWithStats, getAllRepoCommits, getAllRepoPulls, getAllRepoIssues, getAllIssueChangelogs } = require("../controllers/repository.controller");


router.post('/sync', syncOrgReposWithStats);
router.get('/commits', getAllRepoCommits)
router.get('/pulls', getAllRepoPulls)
router.get('/issues/changelogs', getAllIssueChangelogs)
router.get('/issues', getAllRepoIssues)



module.exports = router;
