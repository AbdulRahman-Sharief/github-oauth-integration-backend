const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
    {
        githubId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        login: {
            type: String,
            required: true,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        repos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Repository",
            },
        ],
        avatar_url: {
            type: String,
        },
        description: {
            type: String
        },
        url: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
