export interface Comment {
  author: string;
  comment_response: string;
  indicator: string;
  text: string;
  title: string;
  title_response: string;
}

export interface Video {
  comments: Comment[];
  title: string;
  title_response: string;
}

export interface SentimentData {
  videos: {
    [key: string]: Video;
  };
}