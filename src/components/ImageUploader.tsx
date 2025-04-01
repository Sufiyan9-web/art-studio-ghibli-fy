
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  className?: string;
}

const ImageUploader = ({ onImageSelected, className }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Check if the file is an image
    if (!file.type.match('image.*')) {
      toast.error("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Please select an image under 10MB.");
      return;
    }

    onImageSelected(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="bg-muted rounded-full p-4">
          <ImagePlus className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-medium">
            Drop your image here
          </h3>
          <p className="text-muted-foreground mt-1">
            or click to browse from your device
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleClick}
          className="gap-2"
        >
          <Upload size={16} />
          Upload Image
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
