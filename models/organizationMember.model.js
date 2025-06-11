const mongoose = require('mongoose');

const OrganizationMemberSchema = new mongoose.Schema({
    githubId: {
        type: Number,
        required: true,
        unique: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    login: {
        type: String,
        required: true
    },
    avatar_url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('OrganizationMember', OrganizationMemberSchema);
