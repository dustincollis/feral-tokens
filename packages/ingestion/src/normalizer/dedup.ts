import { supabase } from "@feral-tokens/shared";

export async function isDuplicate(
  contentHash: string,
  sourceId: string,
  externalId: string
): Promise<boolean> {
  const { data: hashMatch } = await supabase
    .from("posts")
    .select("id")
    .eq("content_hash", contentHash)
    .limit(1);

  if (hashMatch && hashMatch.length > 0) return true;

  const { data: idMatch } = await supabase
    .from("posts")
    .select("id")
    .eq("source_id", sourceId)
    .eq("external_id", externalId)
    .limit(1);

  return (idMatch?.length ?? 0) > 0;
}