const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        organizationId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        githubId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        included: {
            type: Boolean,
            default: false,
        },
        commits: {
            type: Number,
            default: 0,
            min: 0,
        },
        pullRequests: {
            type: Number,
            default: 0,
            min: 0,
        },
        issues: {
            type: Number,
            default: 0,
            min: 0,
        },
        url: {
            type: String
        },
        description: {
            type: String,
        },
        visibility: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

const Repository = mongoose.model("Repository", repositorySchema);

module.exports = Repository;
