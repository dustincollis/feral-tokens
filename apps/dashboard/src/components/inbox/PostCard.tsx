"use client";

import { UnifiedPost } from "@feral-tokens/shared";

interface PostCardProps {
  post: UnifiedPost;
  selected: boolean;
  onSelect: (post: UnifiedPost) => void;
}

const categoryColors: Record<string, string> = {
  companion: "bg-purple-100 text-purple-800",
  behavior: "bg-blue-100 text-blue-800",
  funny: "bg-yellow-100 text-yellow-800",
  concerning: "bg-red-100 text-red-800",
  meta: "bg-gray-100 text-gray-800",
  other: "bg-green-100 text-green-800",
};

export function PostCard({ post, selected, onSelect }: PostCardProps) {
  const score = post.score ?? 0;
  const scoreColor =
    score >= 8
      ? "bg-green-500"
      : score >= 6
      ? "bg-yellow-500"
      : score >= 4
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div
      onClick={() => onSelect(post)}
      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
        selected
          ? "border-blue-500 shadow-lg"
          : "border-gray-200 hover:border-gray-400"
      }`}
    >
      {post.thumbnail_url ? (
        <img
          src={post.thumbnail_url}
          alt={post.title}
          className="w-full h-40 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          No image
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full shrink-0 ${scoreColor}`}>
            {score.toFixed(1)}
          </span>
          {post.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${categoryColors[post.category] ?? "bg-gray-100 text-gray-800"}`}>
              {post.category}
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug mb-1">{post.title}</p>
        <p className="text-xs text-gray-500">{post.platform}</p>
        {post.score_data && (
          <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">
            {(post.score_data as any).reason}
          </p>
        )}
      </div>
    </div>
  );
}