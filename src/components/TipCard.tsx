import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface TipCardProps {
  tips: string[];
}

export function TipCard({ tips }: TipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 cursor-pointer min-h-fit"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full min-h-fit transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of card */}
        <Card
          className={`backface-hidden shadow-glass hover:shadow-glass-lg transition-smooth ${
            isFlipped ? "invisible absolute inset-0" : "visible"
          }`}
        >
          <CardContent className="flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-6 px-3 sm:px-6">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-float flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              Need a hint? Click here
            </span>
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card
          className={`backface-hidden rotate-y-180 shadow-glass-lg ${
            isFlipped ? "visible" : "invisible absolute inset-0"
          }`}
        >
          <CardContent className="py-4 sm:py-6 px-3 sm:px-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
              <div className="text-xs sm:text-sm space-y-2">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span className="break-words flex-1">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
