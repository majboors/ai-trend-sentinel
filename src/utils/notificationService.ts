// Simple rate limiting using a token bucket algorithm
let lastNotificationTime = 0;
const RATE_LIMIT_WINDOW = 2000; // 2 seconds between notifications

export const sendTradeNotification = async (
  coin: string,
  direction: 'UP' | 'DOWN',
  percentage: number,
  tradingViewName: string,
  amount: number
) => {
  const now = Date.now();
  if (now - lastNotificationTime < RATE_LIMIT_WINDOW) {
    console.log('Rate limited: Skipping notification to prevent 429 error');
    return;
  }

  const message = `ALERT ${coin} went ${direction} ${percentage.toFixed(2)}% your ${tradingViewName} would have ${direction === 'UP' ? 'made' : 'LOST'} you $${Math.abs(amount).toFixed(2)}`;
  
  try {
    lastNotificationTime = now;
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
      return;
    }

    console.log('Notification sent:', message);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};