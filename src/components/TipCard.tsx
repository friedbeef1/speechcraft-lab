import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface TipCardProps {
  tip: string;
}

export function TipCard({ tip }: TipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of card */}
        <Card
          className={`backface-hidden ${
            isFlipped ? "invisible" : "visible"
          }`}
        >
          <CardContent className="flex items-center justify-center gap-3 py-6">
            <Lightbulb className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              Need a hint? Click here
            </span>
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card
          className={`absolute inset-0 backface-hidden rotate-y-180 ${
            isFlipped ? "visible" : "invisible"
          }`}
        >
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <p className="text-sm">{tip}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
