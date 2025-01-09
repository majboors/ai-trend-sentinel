import { supabase } from "@/integrations/supabase/client";

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
const RATE_LIMIT_WINDOW = 60000; // 60 seconds between notifications
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 25;
const MIN_PERCENTAGE_CHANGE = 5; // Only notify for 5% or greater changes
const NOTIFICATION_COOLDOWN: Record<string, number> = {};

const storeNotification = async (notification: QueuedNotification) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: session.user.id,
      coin_symbol: notification.coin,
      direction: notification.direction,
      percentage: notification.percentage,
      trading_view_name: notification.tradingViewName,
      amount: notification.amount,
      status: 'pending'
    });

  if (error) {
    console.error('Error storing notification:', error);
  }
};

const updateNotificationStatus = async (coin: string, status: 'sent' | 'failed', errorMessage?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { error } = await supabase
    .from('notifications')
    .update({
      status,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null
    })
    .eq('user_id', session.user.id)
    .eq('coin_symbol', coin)
    .eq('status', 'pending');

  if (error) {
    console.error('Error updating notification status:', error);
  }
};

const processQueue = async () => {
  if (isProcessingQueue || notificationQueue.length === 0) return;
  
  isProcessingQueue = true;
  const now = Date.now();
  
  try {
    if (now - lastNotificationTime >= RATE_LIMIT_WINDOW) {
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
      const errorData = await response.text();
      console.error('Notification error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      await updateNotificationStatus(coin, 'failed', `HTTP ${response.status}: ${errorData}`);
      
      if (retryCount < MAX_RETRIES && response.status === 429) {
        const backoffTime = RATE_LIMIT_WINDOW * Math.pow(2, retryCount);
        console.log(`Rate limited. Retrying in ${backoffTime/1000}s (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          void sendNotification(notification, retryCount + 1);
        }, backoffTime);
      }
    } else {
      await updateNotificationStatus(coin, 'sent');
      console.log('Notification sent successfully:', {
        coin,
        direction,
        percentage: percentage.toFixed(2),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    await updateNotificationStatus(coin, 'failed', error instanceof Error ? error.message : 'Unknown error');
    
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
  if (Math.abs(percentage) < MIN_PERCENTAGE_CHANGE) {
    return;
  }

  const now = Date.now();
  const lastNotification = NOTIFICATION_COOLDOWN[coin] || 0;
  
  if (now - lastNotification < RATE_LIMIT_WINDOW * 2) {
    console.log(`Skipping notification for ${coin}: too recent`);
    return;
  }
  
  const notification = {
    coin,
    direction,
    percentage,
    tradingViewName,
    amount,
    timestamp: now
  };

  await storeNotification(notification);
  
  if (notificationQueue.length >= MAX_QUEUE_SIZE) {
    const lowestPercentageIdx = notificationQueue
      .reduce((minIdx, n, idx, arr) => 
        Math.abs(n.percentage) < Math.abs(arr[minIdx].percentage) ? idx : minIdx
      , 0);
    
    if (Math.abs(percentage) > Math.abs(notificationQueue[lowestPercentageIdx].percentage)) {
      notificationQueue[lowestPercentageIdx] = notification;
      console.log(`Replaced older notification with higher impact change for ${coin}`);
    } else {
      console.log(`Queue full: Skipping lower impact notification for ${coin}`);
    }
    return;
  }
  
  notificationQueue.push(notification);
  NOTIFICATION_COOLDOWN[coin] = now;
  
  void processQueue();
};