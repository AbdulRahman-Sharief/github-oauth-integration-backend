const express = require("express");
const router = express.Router();
const { getAllOrganizations, getAllOrganizationRepositories, getAllOrganizationMembers } = require("../controllers/organization.controller");

router.get('/', getAllOrganizations);
router.get('/repositories', getAllOrganizationRepositories);
router.get('/members', getAllOrganizationMembers);

module.exports = router;
