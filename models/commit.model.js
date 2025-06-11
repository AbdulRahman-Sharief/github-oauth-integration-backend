// models/commit.model.js

const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema(
    {
        sha: {
            type: String,
            required: true,
            unique: true,
        },
        repoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Repository',
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        author: {
            type: String,
            default: null,
        },
        committer: {
            type: String,
            default: null,
        },
        date: {
            type: Date,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

module.exports = mongoose.model('Commit', commitSchema);
