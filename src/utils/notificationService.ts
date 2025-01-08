// Queue implementation for notifications
interface QueuedNotification {
  coin: string;
  direction: 'UP' | 'DOWN';
  percentage: number;
  tradingViewName: string;
  amount: number;
  timestamp: number;
}

let notificationQueue: QueuedNotification[] = [];
let isProcessingQueue = false;
let lastNotificationTime = 0;
const RATE_LIMIT_WINDOW = 30000; // 30 seconds between notifications
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 50; // Reduced queue size
const MIN_PERCENTAGE_CHANGE = 5; // Only notify for 5% or greater changes
const NOTIFICATION_COOLDOWN: Record<string, number> = {}; // Track last notification time per coin

const processQueue = async () => {
  if (isProcessingQueue || notificationQueue.length === 0) return;
  
  isProcessingQueue = true;
  const now = Date.now();
  
  try {
    if (now - lastNotificationTime >= RATE_LIMIT_WINDOW) {
      // Sort queue by percentage change (highest first)
      notificationQueue.sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage));
      
      const notification = notificationQueue.shift();
      if (notification) {
        await sendNotification(notification);
        lastNotificationTime = now;
        
        // Clear old notifications from queue
        const timeThreshold = now - RATE_LIMIT_WINDOW * 2;
        notificationQueue = notificationQueue.filter(n => n.timestamp > timeThreshold);
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
      
      // Only retry on rate limit errors with exponential backoff
      if (retryCount < MAX_RETRIES && response.status === 429) {
        const backoffTime = RATE_LIMIT_WINDOW * Math.pow(2, retryCount);
        console.log(`Rate limited. Retrying in ${backoffTime/1000}s (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          void sendNotification(notification, retryCount + 1);
        }, backoffTime);
      }
    } else {
      console.log('Notification sent successfully:', {
        coin,
        direction,
        percentage: percentage.toFixed(2),
        timestamp: new Date().toISOString()
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
  // Only notify for significant price changes
  if (Math.abs(percentage) < MIN_PERCENTAGE_CHANGE) {
    return;
  }

  const now = Date.now();
  
  // Check if we've recently sent a notification for this coin
  const lastNotification = NOTIFICATION_COOLDOWN[coin] || 0;
  if (now - lastNotification < RATE_LIMIT_WINDOW * 2) {
    console.log(`Skipping notification for ${coin}: too recent`);
    return;
  }
  
  // Prevent queue from growing too large
  if (notificationQueue.length >= MAX_QUEUE_SIZE) {
    // Replace oldest notification if new one has higher percentage
    const lowestPercentageIdx = notificationQueue
      .reduce((minIdx, n, idx, arr) => 
        Math.abs(n.percentage) < Math.abs(arr[minIdx].percentage) ? idx : minIdx
      , 0);
    
    if (Math.abs(percentage) > Math.abs(notificationQueue[lowestPercentageIdx].percentage)) {
      notificationQueue[lowestPercentageIdx] = {
        coin,
        direction,
        percentage,
        tradingViewName,
        amount,
        timestamp: now
      };
      console.log(`Replaced older notification with higher impact change for ${coin}`);
    } else {
      console.log(`Queue full: Skipping lower impact notification for ${coin}`);
    }
    return;
  }
  
  // Add notification to queue
  notificationQueue.push({
    coin,
    direction,
    percentage,
    tradingViewName,
    amount,
    timestamp: now
  });
  
  // Update cooldown
  NOTIFICATION_COOLDOWN[coin] = now;
  
  // Start processing queue if not already processing
  void processQueue();
};