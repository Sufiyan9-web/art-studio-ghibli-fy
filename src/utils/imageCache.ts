
/**
 * ImageCache: A utility for caching transformed images to improve performance
 * and reduce API calls for repeated transformations
 */

export class ImageCache {
  private static cache: Map<string, string> = new Map();
  private static MAX_CACHE_ITEMS = 100; // Increased cache size for high traffic

  /**
   * Generates a hash for a file based on its content and metadata
   */
  static generateHash(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          // Simple hash function based on the first 10KB of the file
          const sample = result.slice(0, 10240);
          let hash = 0;
          for (let i = 0; i < sample.length; i++) {
            hash = ((hash << 5) - hash) + sample.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
          }
          resolve(`${hash}-${file.size}-${file.type}`);
        } else {
          resolve(`${file.name}-${file.size}-${file.lastModified}`);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Retrieves a cached transformation result if available
   */
  static async get(file: File): Promise<string | null> {
    const hash = await this.generateHash(file);
    return this.cache.get(hash) || null;
  }

  /**
   * Stores a transformation result in the cache
   */
  static async set(file: File, url: string): Promise<void> {
    const hash = await this.generateHash(file);
    
    // Manage cache size using simple LRU approach
    if (this.cache.size >= this.MAX_CACHE_ITEMS) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(hash, url);
  }

  /**
   * Clears the entire image cache
   */
  static clear(): void {
    this.cache.clear();
  }
}
