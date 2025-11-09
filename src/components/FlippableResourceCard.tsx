import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface FlippableResourceCardProps {
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  tips: string[];
}

export function FlippableResourceCard({ title, description, category, icon: Icon, tips }: FlippableResourceCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative h-[280px] sm:h-[300px] cursor-pointer perspective-1000 transform-style-3d"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      {/* Front of card */}
      <Card
        className={`absolute inset-0 glass-medium shadow-glass hover:glass-light transition-all duration-500 backface-hidden ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        <CardHeader>
          <div className="p-3 rounded-lg glass-light w-fit mb-4">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-foreground break-words text-lg sm:text-2xl">{title}</CardTitle>
          <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="text-sm text-primary">{category}</span>
        </CardContent>
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
          Click to see tips
        </div>
      </Card>

      {/* Back of card */}
      <Card
        className={`absolute inset-0 glass-medium shadow-glass transition-all duration-500 backface-hidden rotate-y-180 ${
          isFlipped ? "rotate-y-0" : ""
        }`}
      >
        <CardHeader>
          <CardTitle className="text-foreground break-words text-lg sm:text-xl">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto max-h-[180px] sm:max-h-[200px]">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-2 text-sm sm:text-base">
              <span className="text-primary shrink-0">•</span>
              <span className="text-foreground">{tip}</span>
            </div>
          ))}
        </CardContent>
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
          Click to flip back
        </div>
      </Card>
    </div>
  );
}
