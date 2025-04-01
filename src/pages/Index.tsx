
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/Layout";
import ImageUploader from "@/components/ImageUploader";
import ImageTransformer from "@/components/ImageTransformer";
import ExampleGallery from "@/components/ExampleGallery";
import GhibliDecoration from "@/components/GhibliDecoration";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageSelected = (file: File) => {
    setSelectedImage(file);
  };

  const handleReset = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <GhibliDecoration />
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card className="ghibli-card shadow-lg mb-12">
            <CardContent className="p-6 md:p-8">
              {selectedImage ? (
                <ImageTransformer originalImage={selectedImage} onReset={handleReset} />
              ) : (
                <ImageUploader onImageSelected={handleImageSelected} />
              )}
            </CardContent>
          </Card>

          <Separator className="my-12" />
          
          <div className="prose max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-serif font-bold text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-ghibli-blue text-white flex items-center justify-center font-bold text-lg mb-3">1</div>
                <h3 className="font-serif font-medium text-lg">Upload</h3>
                <p className="text-muted-foreground">Upload any photo from your device</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-ghibli-blue text-white flex items-center justify-center font-bold text-lg mb-3">2</div>
                <h3 className="font-serif font-medium text-lg">Transform</h3>
                <p className="text-muted-foreground">Our AI transforms it to Ghibli style</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-ghibli-blue text-white flex items-center justify-center font-bold text-lg mb-3">3</div>
                <h3 className="font-serif font-medium text-lg">Download</h3>
                <p className="text-muted-foreground">Download and share your Ghibli art</p>
              </div>
            </div>
          </div>

          <ExampleGallery />
        </div>
      </Layout>
    </>
  );
};

export default Index;
