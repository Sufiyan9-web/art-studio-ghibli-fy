
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wand2, Download, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { ImageCache } from "@/utils/imageCache";
import { optimizeImage, fileToBase64, transformToGhibli, pollForResult } from "@/utils/imageTransformation";

interface ImageTransformerProps {
  originalImage: File;
  onReset: () => void;
}

// Constants
const DEFAULT_API_KEY = "r8_8Se5gV4HA9LzeP6EoNNRr3wGceD0slv4KaRIN";

const ImageTransformer = ({ originalImage, onReset }: ImageTransformerProps) => {
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [transformedUrl, setTransformedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransformed, setIsTransformed] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("replicateApiKey") || DEFAULT_API_KEY;
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [isOptimized, setIsOptimized] = useState<boolean>(true);

  useEffect(() => {
    // Create object URL for the original image
    const url = URL.createObjectURL(originalImage);
    setOriginalUrl(url);

    // Check cache for this image first
    const checkCache = async () => {
      const cachedUrl = await ImageCache.get(originalImage);
      if (cachedUrl) {
        setTransformedUrl(cachedUrl);
        setIsTransformed(true);
        toast.success("Image loaded from cache!");
      } else {
        // Auto-transform if we have an API key
        if (apiKey) {
          handleTransform();
        }
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
    const cachedUrl = await ImageCache.get(originalImage);
    if (cachedUrl) {
      setTransformedUrl(cachedUrl);
      setIsTransformed(true);
      toast.success("Using cached transformation!");
      return;
    }

    setIsLoading(true);
    toast.info("Starting image transformation...");
    
    try {
      // Step 1: Send the image to the API and get prediction ID
      const predictionId = await transformToGhibli(originalImage, apiKey, isOptimized);
      
      // Step 2: Poll for the result
      const result = await pollForResult(predictionId, apiKey);
      
      if (result.output) {
        setTransformedUrl(result.output);
        setIsTransformed(true);
        
        // Store in cache
        await ImageCache.set(originalImage, result.output);
        
        toast.success("Your image has been Ghibli-fied!");
      } else {
        throw new Error("No output received from the API");
      }
    } catch (error) {
      console.error("Transformation error:", error);
      toast.error(`Failed to transform image: ${error instanceof Error ? error.message : 'API connection error'}`);
    } finally {
      setIsLoading(false);
    }
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
