import { createHash } from "crypto";

export function hashContent(
  title: string,
  body: string | null,
  imageUrl: string | null
): string {
  const input = [title, body?.slice(0, 200) ?? "", imageUrl ?? ""].join("|");
  return createHash("sha256").update(input).digest("hex");
}