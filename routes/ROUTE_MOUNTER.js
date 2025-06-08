const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");

router.get('/', (req, res) => {
    return res.status(200).json({
        message: "Welcome to the API"
    })
})
router.use("/auth", authRoutes);
module.exports = router;
