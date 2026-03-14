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
    const imageBuffer = await retry(async () => {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "feral-tokens-"));
    const originalPath = path.join(tempDir, "original");
    const thumbnailPath = path.join(tempDir, "thumbnail");

    await fs.writeFile(originalPath, imageBuffer);

    await sharp(imageBuffer)
      .resize(400, null, { withoutEnlargement: true })
      .toFile(thumbnailPath);

    const thumbnailBuffer = await fs.readFile(thumbnailPath);

    const storagePath = `${platform}/${externalId}`;

    const { error: originalError } = await supabase.storage
      .from("post-images")
      .upload(`${storagePath}/original`, imageBuffer, { upsert: true });

    if (originalError) throw originalError;

    const { error: thumbnailError } = await supabase.storage
      .from("post-images")
      .upload(`${storagePath}/thumbnail`, thumbnailBuffer, { upsert: true });

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