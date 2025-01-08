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
const RATE_LIMIT_WINDOW = 5000; // 5 seconds between notifications
const MAX_RETRIES = 3;

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
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notification error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Retry logic for failed requests
      if (retryCount < MAX_RETRIES && response.status === 429) {
        console.log(`Retrying notification (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          sendNotification(notification, retryCount + 1);
        }, RATE_LIMIT_WINDOW * (retryCount + 1));
        return;
      }
    } else {
      console.log('Notification sent:', message);
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => {
        sendNotification(notification, retryCount + 1);
      }, RATE_LIMIT_WINDOW * (retryCount + 1));
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
  // Add notification to queue
  notificationQueue.push({
    coin,
    direction,
    percentage,
    tradingViewName,
    amount
  });
  
  // Start processing queue if not already processing
  processQueue();
};