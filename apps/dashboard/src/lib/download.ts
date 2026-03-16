import JSZip from "jszip";
import { UnifiedPost } from "@feral-tokens/shared";

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60)
    .toLowerCase();
}

function getExtension(url: string): string {
  const match = url.match(/\.(jpe?g|png|gif|webp)/i);
  return match ? match[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

export async function downloadEpisodePackage(
  posts: UnifiedPost[],
  script: string
) {
  const zip = new JSZip();

  // Add script
  zip.file("script.txt", script);

  // Fetch and add numbered images
  const imagePromises = posts.map(async (post, index) => {
    const url = post.thumbnail_url;
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const blob = await response.blob();
      const num = String(index + 1).padStart(2, "0");
      const name = sanitizeFilename(post.title);
      const ext = getExtension(url);
      zip.file(`${num}_${name}.${ext}`, blob);
    } catch {
      // Skip images that fail to fetch
    }
  });

  await Promise.all(imagePromises);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feral-tokens-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
