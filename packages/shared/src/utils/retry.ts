export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        if (i < maxRetries - 1) {
          await new Promise((res) => setTimeout(res, baseDelay * Math.pow(2, i)));
        }
      }
    }
    throw lastError!;
  }