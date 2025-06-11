const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
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
    number: {
        type: Number,
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
        required: false,
    },
    issueCreatedAt: {
        type: Date,
        required: true,
    },
    issueUpdatedAt: {
        type: Date,
        required: true,
    },
    issueClosedAt: {
        type: Date,
        required: false,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Issue', issueSchema);