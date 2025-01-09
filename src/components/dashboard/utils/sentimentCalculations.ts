import type { SentimentData, Strategy } from "../types/sentiment";

export const defaultSentimentData: SentimentData[] = [
  { type: "Positive", value: 70, color: "bg-green-500" },
  { type: "Neutral", value: 20, color: "bg-yellow-500" },
  { type: "Negative", value: 10, color: "bg-red-500" },
];

export const calculateSentimentPercentages = (videos: any) => {
  let buyCount = 0;
  let sellCount = 0;
  let othersCount = 0;
  let totalCount = 0;

  // Count sentiments from comments
  Object.values(videos).forEach((video: any) => {
    if (video.comments && Array.isArray(video.comments)) {
      video.comments.forEach((comment: any) => {
        if (comment.indicator === 'buy') buyCount++;
        else if (comment.indicator === 'sell') sellCount++;
        else if (comment.indicator === 'others') othersCount++;
        totalCount++;
      });
    }

    // Add title sentiment if available
    if (video.title_label === 'buy') {
      buyCount++;
      totalCount++;
    } else if (video.title_label === 'sell') {
      sellCount++;
      totalCount++;
    } else if (video.title_label === 'others') {
      othersCount++;
      totalCount++;
    }
  });

  // Calculate percentages
  const total = totalCount || 1; // Prevent division by zero
  return [
    { type: "Positive", value: Math.round((buyCount / total) * 100), color: "bg-green-500" },
    { type: "Neutral", value: Math.round((othersCount / total) * 100), color: "bg-yellow-500" },
    { type: "Negative", value: Math.round((sellCount / total) * 100), color: "bg-red-500" },
  ];
};

export const determineStrategy = (sentimentData: SentimentData[]): Strategy => {
  if (!sentimentData || sentimentData.length === 0) {
    return "hold";
  }

  const neutral = sentimentData.find(s => s.type === "Neutral")?.value || 0;
  const positive = sentimentData.find(s => s.type === "Positive")?.value || 0;
  const negative = sentimentData.find(s => s.type === "Negative")?.value || 0;

  // First priority: Check neutral sentiment
  if (neutral > 50) {
    return "COIN IS DEAD";
  }
  
  // Second priority: Check negative sentiment
  if (negative > 10) {
    return "do not buy";
  }
  
  // Third priority: Check positive sentiment
  if (positive > 20) {
    return "buy";
  }

  // If none of the conditions are met
  return "hold";
};