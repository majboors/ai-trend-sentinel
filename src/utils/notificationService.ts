// Queue implementation for notifications
interface QueuedNotification {
  coin: string;
  direction: 'UP' | 'DOWN';
  percentage: number;
  tradingViewName: string;
  amount: number;
}

let notificationQueue: QueuedNotification[] = [];
let isProcessingQueue = false;
let lastNotificationTime = 0;
const RATE_LIMIT_WINDOW = 10000; // 10 seconds between notifications
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 100; // Prevent queue from growing too large

const processQueue = async () => {
  if (isProcessingQueue || notificationQueue.length === 0) return;
  
  isProcessingQueue = true;
  const now = Date.now();
  
  try {
    if (now - lastNotificationTime >= RATE_LIMIT_WINDOW) {
      const notification = notificationQueue.shift();
      if (notification) {
        await sendNotification(notification);
        lastNotificationTime = now;
      }
    }
  } catch (error) {
    console.error('Error processing notification queue:', error);
  } finally {
    isProcessingQueue = false;
    // Continue processing queue if there are more items
    if (notificationQueue.length > 0) {
      setTimeout(processQueue, RATE_LIMIT_WINDOW);
    }
  }
};

const sendNotification = async (notification: QueuedNotification, retryCount = 0) => {
  const { coin, direction, percentage, tradingViewName, amount } = notification;
  const message = `ALERT ${coin} went ${direction} ${percentage.toFixed(2)}% your ${tradingViewName} would have ${direction === 'UP' ? 'made' : 'LOST'} you $${Math.abs(amount).toFixed(2)}`;
  
  try {
    const response = await fetch('https://ntfy.sh/Trading', {
      method: 'POST',
      body: message,
      headers: {
        'Content-Type': 'text/plain',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notification error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Only retry on rate limit errors
      if (retryCount < MAX_RETRIES && response.status === 429) {
        const backoffTime = RATE_LIMIT_WINDOW * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Rate limited. Retrying in ${backoffTime/1000}s (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          void sendNotification(notification, retryCount + 1);
        }, backoffTime);
        return;
      }
    } else {
      console.log('Notification sent successfully:', {
        coin,
        direction,
        percentage: percentage.toFixed(2)
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Retry on network errors with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const backoffTime = RATE_LIMIT_WINDOW * Math.pow(2, retryCount);
      setTimeout(() => {
        void sendNotification(notification, retryCount + 1);
      }, backoffTime);
    }
  }
};

export const sendTradeNotification = async (
  coin: string,
  direction: 'UP' | 'DOWN',
  percentage: number,
  tradingViewName: string,
  amount: number
) => {
  // Prevent queue from growing too large
  if (notificationQueue.length >= MAX_QUEUE_SIZE) {
    console.warn('Notification queue is full. Skipping notification.');
    return;
  }
  
  // Add notification to queue
  notificationQueue.push({
    coin,
    direction,
    percentage,
    tradingViewName,
    amount
  });
  
  // Start processing queue if not already processing
  void processQueue();
};