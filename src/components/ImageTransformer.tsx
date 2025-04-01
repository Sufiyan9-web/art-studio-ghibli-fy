
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

const ImageTransformer = ({ originalImage, onReset }: ImageTransformerProps) => {
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [transformedUrl, setTransformedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransformed, setIsTransformed] = useState<boolean>(false);

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
    setIsLoading(true);
    
    try {
      // Simulating API call with a timeout since we'll connect to a real API later
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we're just using the same image
      // In a real implementation, this would be replaced with the actual API call result
      setTransformedUrl(originalUrl);
      setIsTransformed(true);
      toast.success("Your image has been Ghibli-fied!");
    } catch (error) {
      toast.error("Failed to transform image. Please try again.");
      console.error(error);
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
                <p className="text-sm">This may take a moment</p>
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
