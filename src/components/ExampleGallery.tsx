
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExampleGalleryProps {
  className?: string;
}

// In a real application, these would be actual before/after examples
const examples = [
  {
    id: 1,
    beforeImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    afterImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Mountain landscape"
  },
  {
    id: 2,
    beforeImage: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    afterImage: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Cat portrait"
  },
  {
    id: 3,
    beforeImage: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    afterImage: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "City skyline"
  }
];

const ExampleGallery = ({ className }: ExampleGalleryProps) => {
  return (
    <div className={cn("py-12", className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold">Example Transformations</h2>
        <p className="text-muted-foreground mt-2">See the magic of Ghibli-style transformations</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {examples.map((example) => (
          <Card key={example.id} className="ghibli-card overflow-hidden">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original</p>
                  <div className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img 
                      src={example.beforeImage} 
                      alt="Original" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ghibli Style</p>
                  <div className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img 
                      src={example.afterImage} 
                      alt="Ghibli Style" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-center mt-2">{example.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExampleGallery;
