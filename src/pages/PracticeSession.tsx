import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Square,
  X,
} from "lucide-react";
import { AudioRecorder } from "@/utils/AudioRecorder";
import { Waveform } from "@/components/Waveform";
import { CircularTimer } from "@/components/CircularTimer";
import { TipCard } from "@/components/TipCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Sample prompts (in production, these would come from the previous screen)
const samplePrompts = [
  "Describe your ideal work environment and explain why it would help you be productive.",
  "Share a challenging situation you faced recently and how you overcame it.",
  "Explain a complex topic you're passionate about to someone who knows nothing about it.",
  "Discuss your thoughts on work-life balance and how you maintain it.",
  "Describe a time when you had to adapt quickly to a significant change.",
];

const tips = [
  "Take a deep breath before speaking. Pause for emphasis, not filler words.",
  "Focus on one main point. Structure your thoughts: beginning, middle, end.",
  "Use specific examples to make your points more memorable and engaging.",
  "Vary your pace and tone to keep your audience interested.",
  "If you lose your train of thought, it's okay to pause and collect yourself.",
];

const PracticeSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPrompt = samplePrompts[currentCardIndex];
  const currentTip = tips[currentCardIndex];
  const totalCards = samplePrompts.length;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recorderRef.current?.isRecording()) {
        recorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const recorder = new AudioRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setAnalyser(recorder.getAnalyser());
      setIsRecording(true);
      setRecordingTime(0);
      setFillerWordCount(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      const audioBlob = await recorderRef.current.stop();
      setIsRecording(false);
      setAnalyser(null);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      console.log("Recording stopped, audio blob size:", audioBlob.size);
      toast.info("Transcribing your speech...");

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // Call transcription service
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio }
          });

          if (error) throw error;

          // Store real data in localStorage
          localStorage.setItem('lastRecording', JSON.stringify({
            transcript: data.transcript,
            duration: recordingTime,
            audioBlob: base64Audio,
            fillerWordCount: data.fillerWordCount,
            prompt: currentPrompt
          }));

          toast.success("Transcription complete!");
          navigate("/results");
        } catch (error) {
          console.error("Transcription error:", error);
          toast.error("Failed to transcribe audio");
        }
      };

      reader.onerror = () => {
        console.error("Failed to read audio blob");
        toast.error("Failed to process recording");
      };
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast.error("Failed to stop recording");
    }
  };

  const handleFillerWord = () => {
    setFillerWordCount((prev) => prev + 1);
  };

  const nextCard = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const handleTimerComplete = () => {
    toast.info("Time's up for this card!");
    if (isRecording) {
      stopRecording();
    }
  };

  const handleExit = () => {
    if (isRecording) {
      stopRecording();
    }
    navigate("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-xs sm:text-sm lg:text-base px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 glass-medium backdrop-blur-md shadow-glass">
          {currentCardIndex + 1}/{totalCards}
        </Badge>
        <Button variant="ghost" size="icon" onClick={handleExit} className="glass-ultralight backdrop-blur-md hover:shadow-glass h-8 w-8 sm:h-10 sm:w-10">
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      {/* Prompt Card */}
      <Card className="border-2 border-primary/30 shadow-glass-lg hover:shadow-glass-lg transition-smooth">
        <CardContent className="py-6 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8">
          <p className="text-base sm:text-lg lg:text-2xl text-center leading-relaxed font-medium">
            {currentPrompt}
          </p>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          onClick={previousCard}
          disabled={currentCardIndex === 0}
          className="gap-1 sm:gap-2 text-xs sm:text-sm"
          size="sm"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Previous</span>
          <span className="xs:hidden">Prev</span>
        </Button>
        <Button
          variant="outline"
          onClick={nextCard}
          disabled={currentCardIndex === totalCards - 1}
          className="gap-1 sm:gap-2 text-xs sm:text-sm"
          size="sm"
        >
          <span className="hidden xs:inline">Next</span>
          <span className="xs:hidden">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Record Button */}
      <div className="flex justify-center py-2 sm:py-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-smooth shadow-glass-lg hover:scale-110 active:scale-95 ${
            isRecording
              ? "bg-gradient-to-br from-red-500 to-red-600 animate-glow-pulse glow-primary"
              : "bg-gradient-to-br from-primary to-primary/80 glass-light backdrop-blur-xl border-2 border-white/20 glow-primary hover:shadow-glass-lg"
          }`}
        >
          {isRecording ? (
            <Square className="h-8 w-8 sm:h-10 sm:w-10 text-white fill-white" />
          ) : (
            <Mic className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          )}
        </button>
      </div>

      {/* Waveform and Timers */}
      {isRecording && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <Waveform
            analyser={analyser}
            isRecording={isRecording}
            onFillerWord={handleFillerWord}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Standard Timer */}
            <Card className="shadow-glass hover:shadow-glass-lg transition-smooth">
              <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                    Recording
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono">
                    {formatTime(recordingTime)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Circular Countdown Timer */}
            <div className="text-center glass-ultralight backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-glass">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Remaining
              </p>
              <CircularTimer
                seconds={60}
                isActive={isRecording}
                onComplete={handleTimerComplete}
              />
            </div>

            {/* Filler Word Counter */}
            <Card className="shadow-glass hover:shadow-glass-lg transition-smooth">
              <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                    Fillers
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-500">
                    {fillerWordCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tip Card */}
      <div className="max-w-2xl mx-auto">
        <TipCard tip={currentTip} />
      </div>
    </div>
  );
};

export default PracticeSession;
