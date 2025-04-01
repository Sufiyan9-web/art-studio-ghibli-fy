
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  return (
    <header className={cn("py-6", className)}>
      <div className="container">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-ghibli-blue to-ghibli-navy">
            Studio Ghibli-fy
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-md">
            Transform your photos into magical Ghibli-style art
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
