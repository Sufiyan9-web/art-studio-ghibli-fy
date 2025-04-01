
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wand2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageTransformerProps {
  originalImage: File;
  onReset: () => void;
}

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

const ImageTransformer = ({ originalImage, onReset }: ImageTransformerProps) => {
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [transformedUrl, setTransformedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransformed, setIsTransformed] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  useEffect(() => {
    // Create object URL for the original image
    const url = URL.createObjectURL(originalImage);
    setOriginalUrl(url);

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

    setIsLoading(true);
    
    try {
      // Convert the image to base64
      const base64Image = await fileToBase64(originalImage);
      
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
            num_inference_steps: 30
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

  // Poll for result
  const pollForResult = async (id: string, apiKey: string): Promise<any> => {
    let result;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

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

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
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

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
