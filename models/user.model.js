const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        githubId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        username: {
            type: String,
            trim: true,
        },
        displayName: {
            type: String,
            trim: true,
        },
        profileUrl: {
            type: String,
            trim: true,
        },
        provider: {
            type: String,
            trim: true,
        },
        avatar: {
            type: String,
        },
        accessToken: {
            type: String,
            select: false, // Hide from queries by default
        },
        refreshToken: {
            type: String,
            select: false, // Hide from queries by default
        },
        connectedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

module.exports = mongoose.model("User", userSchema);
