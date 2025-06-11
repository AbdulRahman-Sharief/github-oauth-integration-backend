// models/pullRequest.model.js

const mongoose = require('mongoose');

const pullRequestSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        githubId: {
            type: Number,
            required: true,
            unique: true,
        },
        repoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Repository',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        user: {
            type: String,
            default: null,
        },
        pullCreatedAt: {
            type: Date,
            required: true,
        },
        pullUpdatedAt: {
            type: Date,
            required: true,
        },
        pullClosedAt: {
            type: Date,
            default: null,
        },
        pullMergedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt for local tracking
    }
);

module.exports = mongoose.model('PullRequest', pullRequestSchema);
