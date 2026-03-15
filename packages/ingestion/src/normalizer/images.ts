import sharp from "sharp";
import { supabase } from "@feral-tokens/shared";
import { retry } from "@feral-tokens/shared";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export async function processImage(
  imageUrl: string,
  externalId: string,
  platform: string
): Promise<{ originalUrl: string; thumbnailUrl: string } | null> {
  try {
    const { buffer: imageBuffer, contentType } = await retry(async () => {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://www.reddit.com/",
        },
      });
      if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
      const ct = response.headers.get("content-type") ?? "";
      if (!ct.startsWith("image/")) throw new Error(`Not an image: ${ct}`);
      return { buffer: Buffer.from(await response.arrayBuffer()), contentType: ct };
    });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "feral-tokens-"));
    const thumbnailPath = path.join(tempDir, "thumbnail");

    await sharp(imageBuffer)
      .resize(400, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);

    const thumbnailBuffer = await fs.readFile(thumbnailPath);
    const storagePath = `${platform}/${externalId}`;

    const { error: originalError } = await supabase.storage
      .from("post-images")
      .upload(`${storagePath}/original`, imageBuffer, { 
        upsert: true,
        contentType: contentType 
      });

    if (originalError) throw originalError;

    const { error: thumbnailError } = await supabase.storage
      .from("post-images")
      .upload(`${storagePath}/thumbnail`, thumbnailBuffer, { 
        upsert: true,
        contentType: "image/jpeg"
      });

    if (thumbnailError) throw thumbnailError;

    const { data: originalData } = supabase.storage
      .from("post-images")
      .getPublicUrl(`${storagePath}/original`);

    const { data: thumbnailData } = supabase.storage
      .from("post-images")
      .getPublicUrl(`${storagePath}/thumbnail`);

    await fs.rm(tempDir, { recursive: true });

    return {
      originalUrl: originalData.publicUrl,
      thumbnailUrl: thumbnailData.publicUrl,
    };
  } catch (err) {
    console.error(`Image processing failed for ${externalId}:`, err);
    return null;
  }
}