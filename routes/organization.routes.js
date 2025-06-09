const express = require("express");
const router = express.Router();
const { getAllOrganizations, getAllOrganizationRepositories } = require("../controllers/organization.controller");

router.get('/', getAllOrganizations);
router.get('/repositories', getAllOrganizationRepositories);

module.exports = router;
