class TelegramErrorHandler {
    constructor(bot) {
        this.bot = bot;
        this.errorCounts = new Map();
        this.errorThreshold = 5;
        this.errorWindow = 300000; // 5 minutes
        this.initializeErrorHandling();
        this.messageDeletionQueue = new MessageDeletionQueue(bot); // Use MessageDeletionQueue here
    }
  
    initializeErrorHandling() {
        this.bot.on('error', (error) => this.handleBotError(error));
        this.bot.on('polling_error', (error) => this.handlePollingError(error));
  
        // Clean up error counts periodically
        setInterval(() => this.cleanupErrorCounts(), this.errorWindow);
    }
  
    async handleBotError(error, chatId = null) {
        try {
            const errorContext = {
                timestamp: new Date().toISOString(),
                errorCode: error.code,
                errorMessage: error.message,
                chatId
            };
  
            // Track error frequency
            this.trackError(error.code);
  
            // Handle specific Telegram API errors
            if (error.code === 'ETELEGRAM') {
                const response = error.response || {};
                switch (response.error_code) {
                    case 403:
                        console.error('Bot was blocked by the user', errorContext);
                        if (chatId) {
                            await this.handleBlockedUser(chatId);
                        }
                        break;
  
                    case 429:
                        console.error('Too Many Requests', errorContext);
                        await this.handleRateLimitError(response);
                        break;
  
                    case 400:
                        console.error('Bad Request', errorContext);
                        this.logInvalidUsage(errorContext);
                        break;
  
                    default:
                        console.error('Unknown Telegram error', errorContext);
                }
            } else {
                // Handle non-Telegram errors
                console.error('Non-Telegram error:', errorContext);
            }
  
            // Check if we need to take action based on error frequency
            this.checkErrorThreshold(error.code);
        } catch (err) {
            console.error('Error during bot error handling:', err);
        }
    }
  
    handlePollingError(error) {
        console.error('Polling error:', {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString()
        });
  
        // Handle common polling errors (e.g., ETIMEDOUT, ECONNRESET, ENOTFOUND)
        const retryableErrors = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'];
        if (retryableErrors.includes(error.code)) {
            this.handlePollingTimeout();
        }
    }
  
    trackError(errorCode) {
        const now = Date.now();
        const errors = this.errorCounts.get(errorCode) || [];
        errors.push(now);
        this.errorCounts.set(errorCode, errors);
        console.log(`Tracked error [${errorCode}] at ${new Date(now).toISOString()}`);
    }
  
    checkErrorThreshold(errorCode) {
        const errors = this.errorCounts.get(errorCode) || [];
        const recentErrors = errors.filter(time =>
            Date.now() - time < this.errorWindow
        );
  
        if (recentErrors.length >= this.errorThreshold) {
            this.handleErrorThresholdExceeded(errorCode, recentErrors.length);
        }
    }
  
    async handleErrorThresholdExceeded(errorCode, count) {
        console.error(`Error threshold exceeded for ${errorCode}. Count: ${count}`);
        // Implement threshold handling logic here (e.g., suspend certain bot features)
    }
  
    cleanupErrorCounts() {
        const now = Date.now();
        for (const [code, times] of this.errorCounts.entries()) {
            const recentErrors = times.filter(time => now - time < this.errorWindow);
            if (recentErrors.length === 0) {
                this.errorCounts.delete(code);
            } else {
                this.errorCounts.set(code, recentErrors);
            }
        }
    }
  
    async handleRateLimitError(response) {
        // Implement exponential backoff
        const retryAfter = response.parameters?.retry_after || 30;
        console.log(`Rate limit reached, retrying after ${retryAfter} seconds`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    }
  
    async handleBlockedUser(chatId) {
        // Implement blocked user handling
        console.log(`User ${chatId} has blocked the bot`);
    }
  
    logInvalidUsage(errorContext) {
        console.log('Invalid bot usage:', errorContext);
    }
  
    handlePollingTimeout() {
        console.log('Handling polling timeout with exponential backoff');
        // You can implement your own retry logic here
    }
  }
  
  class MessageDeletionQueue {
    constructor(bot, maxRetries = 3, retryDelay = 1000) {
      this.bot = bot;
      this.queue = new Map();
      this.maxRetries = maxRetries;
      this.retryDelay = retryDelay;
    }
  
    async addToQueue(chatId, messageId, timeout = 15000) {
      const key = `${chatId}:${messageId}`;
      
      if (this.queue.has(key)) {
        return;
      }
  
      this.queue.set(key, {
        attempts: 0,
        timeoutId: setTimeout(() => this.processDelete(key), timeout)
      });
    }
  
    async processDelete(key) {
      const [chatId, messageId] = key.split(':');
      const item = this.queue.get(key);
      
      if (!item) return;
  
      try {
        await this.bot.deleteMessage(parseInt(chatId), parseInt(messageId));
        this.queue.delete(key);
      } catch (error) {
        if (item.attempts < this.maxRetries) {
          item.attempts++;
          item.timeoutId = setTimeout(() => this.processDelete(key), this.retryDelay);
        } else {
          console.warn(`Failed to delete message after ${this.maxRetries} attempts:`, {
            chatId,
            messageId,
            error: error.response?.body?.description || error.message
          });
          this.queue.delete(key);
        }
      }
    }
  
    clearQueue() {
      for (const [_, item] of this.queue) {
        if (item.timeoutId) {
          clearTimeout(item.timeoutId);
        }
      }
      this.queue.clear();
    }
  }
  
  // Export the classes for use in other files
  module.exports = {
    TelegramErrorHandler,
    MessageDeletionQueue
  };
  