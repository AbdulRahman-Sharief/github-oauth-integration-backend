const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const passport = require("passport");
const router = require("../routes/ROUTE_MOUNTER");
const session = require("express-session");
const GitHubStrategy = require('passport-github').Strategy;

module.exports = (app, express) => {
    app.use(cors());
    app.use(
        session({
            secret: "github-oauth-integration-secret",
            resave: false,
            saveUninitialized: true,
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(logger("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    // app.use(express.static(path.join(__dirname, 'public')));


    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL
    },
        function (accessToken, refreshToken, profile, cb) {
            User.findOrCreate({ githubId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    ));


    app.use(
        rateLimit({
            windowMs: 1 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        })
    );
    app.use("/api/v1", router);
};