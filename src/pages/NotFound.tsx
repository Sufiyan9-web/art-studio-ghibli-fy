
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Layout from "@/components/Layout";
import GhibliDecoration from "@/components/GhibliDecoration";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <GhibliDecoration />
      <Layout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h1 className="text-8xl font-serif font-bold text-ghibli-blue mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Oops! It seems you've wandered into the spirit realm.
          </p>
          <div className="max-w-xs mx-auto">
            <Button asChild className="gap-2 w-full bg-ghibli-blue hover:bg-ghibli-navy">
              <a href="/">
                <Home size={16} />
                Return to the Human World
              </a>
            </Button>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default NotFound;
