const mongoose = require('mongoose');

const ChangelogSchema = new mongoose.Schema({
    githubId: {
        type: Number,
        required: true,
        unique: true
    },
    repoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    issueNumber: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    event: {
        type: String,
        required: true
    },
    actor: {
        type: String,
        required: true
    },
    changeLogCreatedAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Changelog', ChangelogSchema);
