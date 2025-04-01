
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wand2, Download, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface ImageTransformerProps {
  originalImage: File;
  onReset: () => void;
}

// Cache for transformed images to avoid redundant API calls
interface CacheItem {
  hash: string;
  url: string;
}

// Create a simple local cache system
class TransformationCache {
  private static cache: Map<string, string> = new Map();
  private static MAX_CACHE_ITEMS = 20;

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

  static async get(file: File): Promise<string | null> {
    const hash = await this.generateHash(file);
    return this.cache.get(hash) || null;
  }

  static async set(file: File, url: string): Promise<void> {
    const hash = await this.generateHash(file);
    
    // Manage cache size using simple LRU approach
    if (this.cache.size >= this.MAX_CACHE_ITEMS) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(hash, url);
  }
}

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

const ImageTransformer = ({ originalImage, onReset }: ImageTransformerProps) => {
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [transformedUrl, setTransformedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransformed, setIsTransformed] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("replicateApiKey") || "";
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [isOptimized, setIsOptimized] = useState<boolean>(true);

  useEffect(() => {
    // Create object URL for the original image
    const url = URL.createObjectURL(originalImage);
    setOriginalUrl(url);

    // Check cache for this image first
    const checkCache = async () => {
      const cachedUrl = await TransformationCache.get(originalImage);
      if (cachedUrl) {
        setTransformedUrl(cachedUrl);
        setIsTransformed(true);
        toast.success("Image loaded from cache!");
      }
    };

    checkCache();

    // Clean up the URL when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [originalImage]);

  const handleTransform = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      toast.error("Please enter your Replicate API key first.");
      return;
    }

    // Save API key to localStorage
    localStorage.setItem("replicateApiKey", apiKey);

    // Check cache first
    const cachedUrl = await TransformationCache.get(originalImage);
    if (cachedUrl) {
      setTransformedUrl(cachedUrl);
      setIsTransformed(true);
      toast.success("Using cached transformation!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Optimize image before sending if enabled
      const optimizedImage = isOptimized 
        ? await optimizeImageForUpload(originalImage) 
        : originalImage;
      
      // Convert the image to base64
      const base64Image = await fileToBase64(optimizedImage);
      
      // Call the Replicate API with the Ghibli model
      const response = await fetch(REPLICATE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({
          version: "ad59ca21177f9e217b9075e7300cf6e14f7e5b4505b478b3a1700d1ccd3d8517",
          input: {
            image: base64Image,
            prompt: "Studio Ghibli style, Hayao Miyazaki",
            negative_prompt: "bad quality, low quality",
            num_inference_steps: isOptimized ? 20 : 30 // Fewer steps for optimized mode
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const prediction = await response.json();
      
      // Poll for results
      const result = await pollForResult(prediction.id, apiKey);
      
      if (result.status === "succeeded") {
        setTransformedUrl(result.output);
        setIsTransformed(true);
        
        // Store in cache
        await TransformationCache.set(originalImage, result.output);
        
        toast.success("Your image has been Ghibli-fied!");
      } else {
        throw new Error("Image transformation failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to transform image. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Optimize image by reducing size/quality before upload
  const optimizeImageForUpload = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Target dimensions - reduce to max 800x800 for efficiency
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to Blob with reduced quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(optimizedFile);
          },
          'image/jpeg',
          0.85  // Quality 0.85 is a good balance
        );
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Poll for result with exponential backoff
  const pollForResult = async (id: string, apiKey: string): Promise<any> => {
    let result;
    let attempts = 0;
    let backoff = 2000; // Start with 2 seconds
    const maxBackoff = 15000; // Maximum 15 seconds between attempts
    const maxAttempts = 30; // Reduced max attempts for efficiency

    while (attempts < maxAttempts) {
      const response = await fetch(`${REPLICATE_API_URL}/${id}`, {
        headers: {
          Authorization: `Token ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check prediction status: ${response.status}`);
      }

      result = await response.json();

      if (result.status === "succeeded" || result.status === "failed") {
        break;
      }

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff = Math.min(backoff * 1.5, maxBackoff);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Prediction timed out");
    }

    return result;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = transformedUrl;
    link.download = `ghibli-${originalImage.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded successfully!");
  };

  return (
    <div className="animate-fade-in">
      {showApiKeyInput && !apiKey && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-serif text-lg font-medium mb-2">API Key Required</h3>
          <p className="text-sm text-muted-foreground mb-3">
            To transform your image to Ghibli style, you'll need a Replicate API key. 
            You can get one for free at <a href="https://replicate.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">replicate.com</a>.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter Replicate API key"
              className="flex-1 px-3 py-2 border rounded-md"
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
              onClick={() => setShowApiKeyInput(false)}
              disabled={!apiKey}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 ghibli-card overflow-hidden">
          <h3 className="font-serif text-lg font-medium mb-2">Original</h3>
          <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {originalUrl && (
              <img
                src={originalUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </Card>

        <Card className="p-4 ghibli-card overflow-hidden">
          <h3 className="font-serif text-lg font-medium mb-2">Ghibli Style</h3>
          <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {isTransformed ? (
              <img
                src={transformedUrl}
                alt="Ghibli Style"
                className="w-full h-full object-contain"
              />
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p>Transforming your image...</p>
                <p className="text-sm">This may take a minute or two</p>
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center justify-center p-6 text-center">
                <Wand2 className="h-10 w-10 mb-2" />
                <p>Click the "Ghibli-fy" button to transform your image</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 mb-4 bg-muted/30 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-muted-foreground" />
          <h4 className="text-sm font-medium">Performance Settings</h4>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            id="optimize" 
            checked={isOptimized}
            onChange={() => setIsOptimized(!isOptimized)} 
          />
          <label htmlFor="optimize" className="text-sm">Optimize for high traffic (faster but slightly lower quality)</label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isLoading}
        >
          Upload New Image
        </Button>
        
        {!isTransformed ? (
          <Button
            onClick={handleTransform}
            disabled={isLoading}
            className="gap-2 bg-ghibli-blue hover:bg-ghibli-navy"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Ghibli-fy Image
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleDownload}
            className="gap-2 bg-ghibli-amber hover:bg-ghibli-orange"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImageTransformer;
