import type { Video } from '@/types';

const DIRECT_VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

// Pulls the video ID out of a "/embed/<id>" YouTube URL.
export function getYouTubeEmbedId(embedUrl: string): string | null {
  const match = embedUrl.match(/\/embed\/([^/?]+)/);
  return match ? match[1] : null;
}

export type VideoSource =
  | { kind: 'youtube'; id: string; embedUrl: string }
  | { kind: 'file'; url: string }
  | { kind: 'none' };

// A video is either a YouTube embed (has embedUrl) or a self-hosted file
// (url points straight at an .mp4/.webm/etc, no YouTube chrome to fight).
export function getVideoSource(video: Video | undefined): VideoSource {
  if (!video) return { kind: 'none' };
  if (video.embedUrl) {
    const id = getYouTubeEmbedId(video.embedUrl);
    if (id) return { kind: 'youtube', id, embedUrl: video.embedUrl };
  }
  if (video.url && DIRECT_VIDEO_RE.test(video.url)) {
    return { kind: 'file', url: video.url };
  }
  return { kind: 'none' };
}
