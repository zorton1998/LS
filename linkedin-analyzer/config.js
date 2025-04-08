require('dotenv').config();

module.exports = {
    linkedin: {
        credentials: {
            email: process.env.LINKEDIN_EMAIL,
            password: process.env.LINKEDIN_PASSWORD
        },
        automation: {
            maxRetries: parseInt(process.env.AUTOMATION_MAX_RETRIES) || 3,
            delays: {
                base: parseInt(process.env.AUTOMATION_BASE_DELAY) || 2000,
                random: parseInt(process.env.AUTOMATION_RANDOM_DELAY) || 1500,
                scroll: parseInt(process.env.AUTOMATION_SCROLL_DELAY) || 1000,
                navigation: parseInt(process.env.AUTOMATION_NAVIGATION_DELAY) || 3000
            },
            browser: {
                headless: process.env.BROWSER_HEADLESS === 'true',
                viewport: {
                    width: parseInt(process.env.BROWSER_WIDTH) || 1280,
                    height: parseInt(process.env.BROWSER_HEIGHT) || 800
                }
            }
        }
    },
    session: {
        secret: process.env.SESSION_SECRET,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    },
    server: {
        port: parseInt(process.env.PORT) || 3000,
        environment: process.env.NODE_ENV || 'development'
    }
}; 