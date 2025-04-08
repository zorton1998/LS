const { linkedin: config } = require('../config');
const { LinkedInClient } = require('@linkedin/api-client');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

puppeteer.use(StealthPlugin());

class LinkedInService {
    constructor() {
        this.client = new LinkedInClient({
            clientId: config.clientId,
            clientSecret: config.clientSecret
        });
        this.automationRetries = new Map();
    }

    // Official API methods
    async getProfile(accessToken) {
        try {
            return await this.client.profile.getOwnProfile(accessToken);
        } catch (error) {
            console.error('LinkedIn API error:', error);
            throw new Error('Failed to fetch profile');
        }
    }

    // Automation methods with anti-detection measures
    async analyzePost(postUrl, credentials) {
        const browser = await this.createStealthBrowser();
        let page;
        
        try {
            page = await browser.newPage();
            await this.setupStealthPage(page);
            
            // Handle authentication
            await this.handleAuthentication(page, credentials);
            
            // Navigate to post with retry logic
            await this.retryOperation(async () => {
                await page.goto(postUrl, { waitUntil: 'networkidle0' });
                await page.waitForSelector('.feed-shared-update-v2', { timeout: 10000 });
            });
            
            // Extract data with delay between operations
            const postData = await this.extractPostData(page);
            await sleep(this.getRandomDelay());
            const interactors = await this.extractInteractors(page);
            
            return { post: postData, interactors };
            
        } catch (error) {
            console.error('LinkedIn automation error:', error);
            throw new Error('Failed to analyze post');
        } finally {
            if (page) await page.close();
            await browser.close();
        }
    }

    // Helper methods for stealth browsing
    async createStealthBrowser() {
        return await puppeteer.launch({
            headless: 'new',
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            defaultViewport: { width: 1280, height: 800 }
        });
    }

    async setupStealthPage(page) {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        await page.evaluateOnNewDocument(() => {
            delete navigator.__proto__.webdriver;
            window.navigator.chrome = { runtime: {} };
        });
    }

    // Retry logic for operations
    async retryOperation(operation) {
        let lastError;
        
        for (let i = 0; i < config.automation.maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                await sleep(this.getRandomDelay());
            }
        }
        
        throw lastError;
    }

    getRandomDelay() {
        const baseDelay = config.automation.delayBetweenRequests;
        return config.automation.randomDelay 
            ? baseDelay + Math.random() * baseDelay 
            : baseDelay;
    }
}

module.exports = new LinkedInService(); 