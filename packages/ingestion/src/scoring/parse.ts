export interface PostScore {
    id: string;
    commentary: number;
    visual: number;
    virality: number;
    topical: number;
    composite: number;
    category: string;
    pitch: string | null;
  }
  
  const VALID_CATEGORIES = [
    "companion",
    "behavior",
    "humor",
    "creepy",
    "culture",
    "other",
  ];
  
  const WEIGHTS = {
    commentary: 0.35,
    visual: 0.30,
    virality: 0.20,
    topical: 0.15,
  };
  
  function isValidScore(val: unknown): val is number {
    return typeof val === "number" && val >= 0 && val <= 10;
  }
  
  function computeComposite(item: {
    commentary: number;
    visual: number;
    virality: number;
    topical: number;
  }): number {
    const raw =
      WEIGHTS.commentary * item.commentary +
      WEIGHTS.visual * item.visual +
      WEIGHTS.virality * item.virality +
      WEIGHTS.topical * item.topical;
    return Math.round(raw * 10) / 10;
  }
  
  export function parseScoringResponse(response: string): PostScore[] {
    try {
      const clean = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
  
      const parsed = JSON.parse(clean);
  
      if (!Array.isArray(parsed)) {
        console.error("Scoring response is not an array");
        return [];
      }
  
      return parsed
        .filter((item) => {
          if (typeof item.id !== "string") return false;
          if (!isValidScore(item.commentary)) return false;
          if (!isValidScore(item.visual)) return false;
          if (!isValidScore(item.virality)) return false;
          if (!isValidScore(item.topical)) return false;
          if (typeof item.category !== "string") return false;
          return true;
        })
        .map((item) => {
          // Recompute composite to ensure consistency with our weights,
          // rather than trusting the model's arithmetic
          const composite = computeComposite(item);
  
          // Normalize category to lowercase and validate
          const category = VALID_CATEGORIES.includes(item.category.toLowerCase())
            ? item.category.toLowerCase()
            : "other";
  
          // Only accept pitch if composite meets threshold
          const pitch =
            composite >= 7.0 && typeof item.pitch === "string" && item.pitch.length > 0
              ? item.pitch
              : null;
  
          return {
            id: item.id,
            commentary: item.commentary,
            visual: item.visual,
            virality: item.virality,
            topical: item.topical,
            composite,
            category,
            pitch,
          };
        });
    } catch (err) {
      console.error("Failed to parse scoring response:", err);
      return [];
    }
  }
  