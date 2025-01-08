import { type Video } from "./types";
import { CommentCard } from "./CommentCard";
import { Card } from "@/components/ui/card";

interface VideoCardProps {
  videoId: string;
  video: Video;
}

export function VideoCard({ videoId, video }: VideoCardProps) {
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
        {video.comments.map((comment, index) => (
          <CommentCard key={index} comment={comment} />
        ))}
      </div>
    </Card>
  );
}