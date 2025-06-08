const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const passport = require("passport");
const router = require("../routes/ROUTE_MOUNTER");
const session = require("express-session");
const GitHubStrategy = require('passport-github').Strategy;
const User = require('../models/user.model')
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


    // Serialize only the user ID into the session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize by fetching the user from DB
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).select('-accessToken -refreshToken'); // Optional: exclude tokens
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    // Configure GitHub OAuth strategy
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
                scope: ["read:org", "repo", "user", "user:email"],
            },
            async (accessToken, refreshToken, profile, done) => {

                try {
                    console.log("GitHub Profile:", profile);

                    console.log("Access Token:", accessToken);
                    console.log("Refresh Token:", refreshToken);
                    let user = await User.findOne({ githubId: profile.id });

                    if (user) {
                        user.accessToken = accessToken;
                        user.refreshToken = refreshToken;
                        user.connectedAt = new Date();
                        await user.save();
                        return done(null, user);
                    }

                    const newUser = new User({
                        githubId: profile.id,
                        username: profile.username,
                        displayName: profile.displayName || profile.username,
                        profileUrl: profile.profileUrl,
                        provider: profile.provider,
                        avatar: profile._json.avatar_url,
                        connectedAt: new Date(),
                        accessToken,
                        refreshToken,
                    });

                    await newUser.save();
                    done(null, newUser);
                } catch (err) {
                    console.error("GitHub Strategy Error:", err);
                    done(err);
                }
            }
        )
    );

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


/*
                   GitHub Profile: {
 id: '215410755',
 displayName: null,
 username: 'AbdulRahman-Sharief-1',
 profileUrl: 'https://github.com/AbdulRahman-Sharief-1',
 
 
 photos: [
   { value: 'https://avatars.githubusercontent.com/u/215410755?v=4' }
 ],
 provider: 'github',
 
 
 _raw: '{"login":"AbdulRahman-Sharief-1","id":215410755,"node_id":"U_kgDODNboQw","avatar_url":"https://avatars.githubusercontent.com/u/215410755?v=4","gravatar_id":"","url":"https://api.github.com/users/AbdulRahman-Sharief-1","html_url":"https://github.com/AbdulRahman-Sharief-1","followers_url":"https://api.github.com/users/AbdulRahman-Sharief-1/followers","following_url":"https://api.github.com/users/AbdulRahman-Sharief-1/following{/other_user}","gists_url":"https://api.github.com/users/AbdulRahman-Sharief-1/gists{/gist_id}","starred_url":"https://api.github.com/users/AbdulRahman-Sharief-1/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/AbdulRahman-Sharief-1/subscriptions","organizations_url":"https://api.github.com/users/AbdulRahman-Sharief-1/orgs","repos_url":"https://api.github.com/users/AbdulRahman-Sharief-1/repos","events_url":"https://api.github.com/users/AbdulRahman-Sharief-1/events{/privacy}","received_events_url":"https://api.github.com/users/AbdulRahman-Sharief-1/received_events","type":"User","user_view_type":"private","site_admin":false,"name":null,"company":null,"blog":"","location":null,"email":null,"hireable":null,"bio":null,"twitter_username":null,"notification_email":null,"public_repos":0,"public_gists":0,"followers":0,"following":0,"created_at":"2025-06-08T18:25:18Z","updated_at":"2025-06-08T18:25:21Z","private_gists":0,"total_private_repos":0,"owned_private_repos":0,"disk_usage":0,"collaborators":0,"two_factor_authentication":false,"plan":{"name":"free","space":976562499,"collaborators":0,"private_repos":10000}}',
 _json: {
   login: 'AbdulRahman-Sharief-1',
   id: 215410755,
   node_id: 'U_kgDODNboQw',
   avatar_url: 'https://avatars.githubusercontent.com/u/215410755?v=4',
   gravatar_id: '',
   url: 'https://api.github.com/users/AbdulRahman-Sharief-1',
   html_url: 'https://github.com/AbdulRahman-Sharief-1',
   followers_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/followers',
   following_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/following{/other_user}',
   gists_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/gists{/gist_id}',
   starred_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/starred{/owner}{/repo}',
   subscriptions_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/subscriptions',
   organizations_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/orgs',
   repos_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/repos',
   events_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/events{/privacy}',
   received_events_url: 'https://api.github.com/users/AbdulRahman-Sharief-1/received_events',
   type: 'User',
   user_view_type: 'private',
   site_admin: false,
   name: null,
   company: null,
   blog: '',
   location: null,
   email: null,
   hireable: null,
   bio: null,
   twitter_username: null,
   notification_email: null,
   public_repos: 0,
   public_gists: 0,
   followers: 0,
   following: 0,
   created_at: '2025-06-08T18:25:18Z',
   updated_at: '2025-06-08T18:25:21Z',
   private_gists: 0,
   total_private_repos: 0,
   owned_private_repos: 0,
   disk_usage: 0,
   collaborators: 0,
   two_factor_authentication: false,
   plan: {
     name: 'free',
     space: 976562499,
     collaborators: 0,
     private_repos: 10000
   }
 }
}
                   
                   */
