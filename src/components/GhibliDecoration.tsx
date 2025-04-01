
import { cn } from "@/lib/utils";

interface GhibliDecorationProps {
  className?: string;
}

const GhibliDecoration = ({ className }: GhibliDecorationProps) => {
  return (
    <div className={cn("pointer-events-none fixed inset-0 z-[-1] overflow-hidden", className)}>
      {/* Clouds */}
      <div className="absolute top-20 left-10 w-24 h-16 bg-ghibli-sky rounded-full opacity-20 animate-float" style={{animationDelay: '0s'}}></div>
      <div className="absolute top-40 right-20 w-32 h-20 bg-ghibli-sky rounded-full opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-40 left-1/4 w-20 h-14 bg-ghibli-sky rounded-full opacity-25 animate-float" style={{animationDelay: '2s'}}></div>
      
      {/* Abstract shapes */}
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-ghibli-amber opacity-10 blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full bg-ghibli-blue opacity-10 blur-3xl animate-float" style={{animationDelay: '2.5s'}}></div>
      <div className="absolute top-2/3 left-1/3 w-56 h-56 rounded-full bg-ghibli-forest opacity-10 blur-3xl animate-float" style={{animationDelay: '3.5s'}}></div>
    </div>
  );
};

export default GhibliDecoration;
