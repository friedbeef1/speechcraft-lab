import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome to AI Speech Coach! 🎙️",
    description: "Let's take a quick tour to help you get started with improving your communication skills.",
    image: "🎯",
  },
  {
    title: "Create or Choose Scenarios",
    description: "Start by creating your own custom scenarios or choose from pre-built practice sessions in Work, Social, or Love categories. Click 'Create New' to design your own!",
    image: "📝",
  },
  {
    title: "Add Speaking Prompts",
    description: "Add prompts you want to practice speaking about. You can drag and drop to reorder them, or use the inspiration buttons to auto-fill with current events topics.",
    image: "💡",
  },
  {
    title: "Record Your Speech",
    description: "Click the large microphone button to start recording. Watch the live waveform and timers as you speak. Filler words like 'um' and 'uh' will be detected and highlighted.",
    image: "🎤",
  },
  {
    title: "Get AI Feedback",
    description: "After recording, our AI analyzes your speech and provides personalized feedback on delivery, content, fluency, and more. Track your progress over time!",
    image: "📊",
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the tutorial
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setOpen(false);
    onComplete();
  };

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-8">
          <div className="text-8xl">{step.image}</div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
            <Progress value={progress} className="flex-1" />
          </div>

          <DialogFooter className="flex flex-row justify-between items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="mr-auto"
            >
              Skip Tutorial
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}

              <Button onClick={handleNext} className="gap-2">
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
