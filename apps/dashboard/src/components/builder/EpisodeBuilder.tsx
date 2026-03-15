"use client";

import { UnifiedPost } from "@feral-tokens/shared";

export interface ProviderOption {
  provider: string;
  model: string;
  label: string;
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    provider: "anthropic",
    model: "claude-opus-4-20250514",
    label: "Claude Opus",
  },
  {
    provider: "xai",
    model: "grok-4-fast",
    label: "Grok 4 Fast",
  },
];

interface EpisodeBuilderProps {
  posts: UnifiedPost[];
  onRemove: (postId: string) => void;
  onReorder: (from: number, to: number) => void;
  onGenerateScript: () => void;
  generating: boolean;
  selectedProvider: ProviderOption;
  onProviderChange: (option: ProviderOption) => void;
}

export function EpisodeBuilder({
  posts,
  onRemove,
  onReorder,
  onGenerateScript,
  generating,
  selectedProvider,
  onProviderChange,
}: EpisodeBuilderProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-700">
            Episode Builder ({posts.length} bits)
          </h2>
          <button
            onClick={onGenerateScript}
            disabled={posts.length === 0 || generating}
            className="text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-1.5 rounded"
          >
            {generating ? "Generating..." : "Generate Script"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Model:</label>
          <select
            value={`${selectedProvider.provider}:${selectedProvider.model}`}
            onChange={(e) => {
              const option = PROVIDER_OPTIONS.find(
                (o) => `${o.provider}:${o.model}` === e.target.value
              );
              if (option) onProviderChange(option);
            }}
            className="text-xs border rounded px-2 py-1 text-gray-600 bg-white"
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option
                key={`${option.provider}:${option.model}`}
                value={`${option.provider}:${option.model}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Click posts in the inbox to add them here
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {posts.map((post, index) => {
            const pitch =
              (post as any).pitch ??
              (post.score_data as any)?.pitch ??
              null;

            return (
              <div
                key={post.id}
                className="flex items-start gap-3 p-3 bg-white border rounded-lg"
              >
                <span className="text-gray-400 font-mono text-sm w-5 shrink-0">
                  {index + 1}
                </span>
                {post.thumbnail_url && (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="w-12 h-12 object-cover rounded shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {post.platform} · score {post.score?.toFixed(1)}
                  </p>
                  {pitch && (
                    <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">
                      {pitch}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => index > 0 && onReorder(index, index - 1)}
                    disabled={index === 0}
                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() =>
                      index < posts.length - 1 && onReorder(index, index + 1)
                    }
                    disabled={index === posts.length - 1}
                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <button
                  onClick={() => onRemove(post.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
