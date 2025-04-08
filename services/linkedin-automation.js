const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const config = require('../config');

console.log('Initializing LinkedIn automation service');
puppeteer.use(StealthPlugin());

class LinkedInAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isAuthenticated = false;
        console.log('LinkedIn automation service constructed');
    }

    async initialize() {
        console.log('Initializing browser...');
        if (this.browser) {
            console.log('Browser already initialized');
            return;
        }

        try {
            console.log('Launching browser...');
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-notifications'
                ],
                defaultViewport: { width: 1280, height: 800 }
            });
            console.log('Browser launched successfully');

            this.page = await this.browser.newPage();
            console.log('New page created');
            
            await this.setupStealthMode();
            console.log('Stealth mode configured');
        } catch (error) {
            console.error('Failed to initialize browser:', error);
            throw error;
        }
    }

    async setupStealthMode() {
        console.log('Setting up stealth mode...');
        try {
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
            
            await this.page.evaluateOnNewDocument(() => {
                delete navigator.__proto__.webdriver;
                window.navigator.chrome = { runtime: {} };
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            });
            console.log('Stealth mode setup completed');
        } catch (error) {
            console.error('Failed to setup stealth mode:', error);
            throw error;
        }
    }

    async login() {
        if (this.isAuthenticated) {
            console.log('Already authenticated');
            return;
        }

        console.log('Starting LinkedIn login process...');
        try {
            console.log('Navigating to LinkedIn login page...');
            await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });
            
            console.log('Entering email...');
            await this.page.type('#username', config.linkedin.credentials.email, { delay: 100 });
            
            console.log('Entering password...');
            await this.page.type('#password', config.linkedin.credentials.password, { delay: 100 });
            
            console.log('Clicking submit button...');
            await this.page.click('button[type="submit"]');
            
            console.log('Waiting for navigation...');
            await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            // Check for security verification
            const hasVerification = await this.page.$('.security-verification-container');
            if (hasVerification) {
                console.error('Security verification required');
                throw new Error('Security verification required. Please login manually first.');
            }

            this.isAuthenticated = true;
            console.log('Login successful');
            await this.randomDelay(config.linkedin.automation.delays.navigation);

        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async analyzePost(postUrl) {
        console.log('Starting post analysis for URL:', postUrl);
        try {
            await this.initialize();
            console.log('Browser initialized');

            await this.login();
            console.log('Logged in successfully');

            console.log('Navigating to post URL...');
            await this.page.goto(postUrl, { waitUntil: 'networkidle0' });
            console.log('Waiting for post content to load...');
            await this.page.waitForSelector('.feed-shared-update-v2', { timeout: 10000 });

            console.log('Extracting post data...');
            const postData = await this.extractPostData();
            console.log('Post data extracted:', postData);

            await this.randomDelay();

            console.log('Extracting interactors...');
            const interactors = await this.extractInteractors();
            console.log('Interactors extracted:', interactors);

            return {
                post: postData,
                interactors
            };

        } catch (error) {
            console.error('Post analysis failed:', error);
            throw error;
        }
    }

    async extractPostData() {
        return await this.page.evaluate(() => {
            const getCount = (labelSubstring) => {
                const button = [...document.querySelectorAll('button')].find(btn =>
                    btn.getAttribute('aria-label')?.toLowerCase().includes(labelSubstring)
                );
                if (!button) return null;
                const text = button.textContent.trim();
                const numberMatch = text.match(/\d[\d,]*/);
                return numberMatch ? parseInt(numberMatch[0].replace(/,/g, '')) : null;
            };

            const anchor = document.querySelector('.update-components-actor__meta-link');
            const ariaLabel = anchor?.getAttribute('aria-label') || '';
            const profile = anchor?.href || null;
            const [_, author, tagline] = ariaLabel.match(/View:\s*(.?)\s•\s*(.*)/) || [];

            const contentEl = document.querySelector('.feed-shared-update-v2__description');
            const text = contentEl?.innerText?.trim() || null;
            const hashtags = Array.from(contentEl?.querySelectorAll('a') || [])
                .map(a => a.textContent.trim())
                .filter(t => t.startsWith('#'));

            return {
                author: author?.trim() || null,
                tagline: tagline?.trim() || null,
                profile,
                postContent: text,
                hashtags,
                reactions: getCount('reaction'),
                comments: getCount('comment'),
                reposts: getCount('repost')
            };
        });
    }

    async extractInteractors() {
        try {
            // Click reactions button
            await this.page.click('button[aria-label*="reaction"]');
            await this.page.waitForSelector('.artdeco-modal__content');
            await this.randomDelay();

            const profiles = new Set();
            let previousHeight = 0;

            // Scroll through modal with anti-detection measures
            while (true) {
                const interactors = await this.page.evaluate(() => {
                    return Array.from(document.querySelectorAll('.artdeco-modal__content a[href*="/in/"]'))
                        .map(a => ({
                            profile: a.href,
                            name: a.querySelector('.artdeco-entity-lockup__title')?.innerText.trim() || null,
                            headline: a.querySelector('.artdeco-entity-lockup__subtitle')?.innerText.trim() || null
                        }));
                });

                interactors.forEach(profile => profiles.add(JSON.stringify(profile)));

                const currentHeight = await this.page.evaluate(() => {
                    const modal = document.querySelector('.artdeco-modal__content');
                    modal.scrollTop = modal.scrollHeight;
                    return modal.scrollHeight;
                });

                if (currentHeight === previousHeight) break;

                previousHeight = currentHeight;
                await this.randomDelay(config.linkedin.automation.delays.scroll);
            }

            await this.page.click('.artdeco-modal__dismiss');
            return Array.from(profiles).map(p => JSON.parse(p));

        } catch (error) {
            console.error('Error extracting interactors:', error);
            return [];
        }
    }

    async randomDelay(baseDelay = config.linkedin.automation.delays.base) {
        const randomDelay = Math.floor(Math.random() * config.linkedin.automation.delays.random);
        const totalDelay = baseDelay + randomDelay;
        console.log(`Waiting for ${totalDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
    }

    async cleanup() {
        console.log('Starting cleanup...');
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            this.isAuthenticated = false;
            console.log('Cleanup completed');
        }
    }
}

module.exports = new LinkedInAutomation(); 