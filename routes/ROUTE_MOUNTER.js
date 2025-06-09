const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const repositoryRoutes = require("./repository.routes");
const organizationRoutes = require("./organization.routes");
router.get('/', (req, res) => {
    return res.status(200).json({
        message: "Welcome to the API"
    })
})
router.use("/auth", authRoutes);
router.use("/repositories", repositoryRoutes);
router.use("/organizations", organizationRoutes);
module.exports = router;
