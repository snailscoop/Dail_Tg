/**
 * Message Queue for Telegram Bot
 * 
 * This module provides a simple queue system for managing Telegram messages,
 * ensuring they are processed in order and rate-limited appropriately.
 */

class MessageQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.rateLimit = options.rateLimit || 30; // Messages per minute
    this.delayBetweenMessages = options.delayBetweenMessages || 2000; // ms between messages
    this.retryDelay = options.retryDelay || 5000; // ms to wait after error
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Add a message to the queue
   * @param {Function} sendFunction - Function to call to send the message
   * @param {Object} params - Parameters to pass to the send function
   */
  add(sendFunction, params) {
    this.queue.push({
      sendFunction,
      params,
      retries: 0
    });

    // Start processing if not already running
    if (!this.processing) {
      this.process();
    }
  }

  /**
   * Process the queue
   */
  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const message = this.queue.shift();

    try {
      await message.sendFunction(message.params);
      
      // Wait before processing next message
      setTimeout(() => this.process(), this.delayBetweenMessages);
    } catch (error) {
      console.error('Error sending message:', error);

      // Retry if under max retries
      if (message.retries < this.maxRetries) {
        message.retries++;
        this.queue.unshift(message);
        console.log(`Retrying message, attempt ${message.retries}/${this.maxRetries}`);
        setTimeout(() => this.process(), this.retryDelay);
      } else {
        console.error('Max retries reached, dropping message');
        // Continue with next message
        setTimeout(() => this.process(), this.delayBetweenMessages);
      }
    }
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Get current queue length
   * @returns {number} Number of messages in queue
   */
  getLength() {
    return this.queue.length;
  }
}

module.exports = MessageQueue; 