export const sendTradeNotification = async (
  coin: string,
  direction: 'UP' | 'DOWN',
  percentage: number,
  tradingViewName: string,
  amount: number
) => {
  const message = `ALERT ${coin} went ${direction} ${percentage.toFixed(2)}% your ${tradingViewName} would have ${direction === 'UP' ? 'made' : 'LOST'} you $${Math.abs(amount).toFixed(2)}`;
  
  try {
    await fetch('https://ntfy.sh/Trading', {
      method: 'POST',
      body: message,
    });
    console.log('Notification sent:', message);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};