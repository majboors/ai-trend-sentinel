import { type Comment } from "./types";

interface CommentCardProps {
  comment: Comment;
}

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="border-l-4 border-primary p-4 bg-muted/50 rounded">
      <p className="text-sm text-muted-foreground mb-2">Author: {comment.author}</p>
      <p className="mb-2 group relative">
        <span className="block group-hover:hidden">{comment.comment_response}</span>
        <span className="hidden group-hover:block">{comment.text}</span>
      </p>
      <p className="text-sm">
        Sentiment: <span className={`font-semibold ${
          comment.indicator === 'buy' ? 'text-green-500' :
          comment.indicator === 'sell' ? 'text-red-500' :
          'text-yellow-500'
        }`}>
          {comment.indicator.toUpperCase()}
        </span>
      </p>
    </div>
  );
}