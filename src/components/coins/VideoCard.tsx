import { type Video } from "./types";
import { CommentCard } from "./CommentCard";
import { Card } from "@/components/ui/card";

interface VideoCardProps {
  videoId: string;
  video: Video;
  sentimentFilter: "all" | "buy" | "sell" | "others";
}

export function VideoCard({ videoId, video, sentimentFilter }: VideoCardProps) {
  const filteredComments = video.comments.filter(
    comment => sentimentFilter === "all" || comment.indicator === sentimentFilter
  );

  if (filteredComments.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Video Analysis</h3>
        <p className="group relative">
          <span className="block group-hover:hidden">{video.title_response}</span>
          <span className="hidden group-hover:block">{video.title}</span>
        </p>
      </div>
      <div className="space-y-4">
        {filteredComments.map((comment, index) => (
          <CommentCard key={index} comment={comment} />
        ))}
      </div>
    </Card>
  );
}