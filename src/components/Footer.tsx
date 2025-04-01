
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={cn("py-6 border-t", className)}>
      <div className="container">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-muted-foreground">
            Studio Ghibli-fy - Transform your images into Ghibli style art
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Created with Lovable ♥
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
