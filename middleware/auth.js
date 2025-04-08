const session = require('express-session');
const rateLimit = require('express-rate-limit');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const config = require('../config');

// Redis client for session storage
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

// Session middleware
const sessionMiddleware = session({
    store: new RedisStore({ client: redis }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: config.session.cookie
});

// Rate limiting middleware
const rateLimiter = rateLimit({
    windowMs: config.linkedin.rateLimits.windowMs,
    max: config.linkedin.rateLimits.requests,
    standardHeaders: true,
    store: new rateLimit.RedisStore({
        sendCommand: (...args) => redis.call(...args)
    })
});

// Authentication check middleware
const requireAuth = (req, res, next) => {
    if (!req.session.linkedinToken) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

module.exports = { sessionMiddleware, rateLimiter, requireAuth }; 