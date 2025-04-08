const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const config = require('../config');

puppeteer.use(StealthPlugin());

class LinkedInAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isAuthenticated = false;
    }

    async initialize() {
        if (this.browser) return;

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

        this.page = await this.browser.newPage();
        await this.setupStealthMode();
    }

    async setupStealthMode() {
        // Mask automation
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        
        await this.page.evaluateOnNewDocument(() => {
            delete navigator.__proto__.webdriver;
            window.navigator.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        });
    }

    async login() {
        if (this.isAuthenticated) return;

        try {
            await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });
            
            // Add random delays between actions
            await this.randomDelay();
            await this.page.type('#username', config.linkedin.credentials.email, { delay: 100 });
            
            await this.randomDelay();
            await this.page.type('#password', config.linkedin.credentials.password, { delay: 100 });
            
            await this.randomDelay();
            await this.page.click('button[type="submit"]');
            
            // Wait for navigation and possible security checks
            await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            // Check for security verification
            if (await this.page.$('.security-verification-container')) {
                throw new Error('Security verification required. Please login manually first.');
            }

            this.isAuthenticated = true;
            await this.randomDelay(config.linkedin.automation.delays.navigation);

        } catch (error) {
            console.error('Login failed:', error);
            throw new Error('Failed to login to LinkedIn');
        }
    }

    async analyzePost(postUrl) {
        try {
            await this.initialize();
            await this.login();

            // Navigate to post
            await this.page.goto(postUrl, { waitUntil: 'networkidle0' });
            await this.randomDelay();

            // Extract post data
            const postData = await this.extractPostData();
            await this.randomDelay();

            // Get interactors
            const interactors = await this.extractInteractors();

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
        await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            this.isAuthenticated = false;
        }
    }
}

module.exports = new LinkedInAutomation(); 