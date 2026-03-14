export interface PostScore {
    id: string;
    score: number;
    category: string;
    reason: string;
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
  
      return parsed.filter((item) => {
        if (typeof item.id !== "string") return false;
        if (typeof item.score !== "number") return false;
        if (typeof item.category !== "string") return false;
        if (typeof item.reason !== "string") return false;
        return true;
      });
    } catch (err) {
      console.error("Failed to parse scoring response:", err);
      return [];
    }
  }