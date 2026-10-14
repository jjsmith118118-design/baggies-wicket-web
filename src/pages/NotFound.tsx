import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

const NotFound = () => {
  usePageMeta({ title: "Page not found | Kingston Bagpuize Cricket Club", noIndex: true });

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-background">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-3xl font-bold mb-3">Bowled! That page isn't here</h1>
        <p className="text-muted-foreground mb-8">
          The page you were looking for may have moved. Try one of these instead.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild><Link to="/">Home</Link></Button>
          <Button asChild variant="outline"><Link to="/juniors">Junior cricket</Link></Button>
          <Button asChild variant="outline"><Link to="/adult-cricket">Adult cricket</Link></Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
