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
  Check,
  Loader2,
  Flag,
} from "lucide-react";
import { AudioRecorder } from "@/utils/AudioRecorder";
import { Waveform } from "@/components/Waveform";
import { CircularTimer } from "@/components/CircularTimer";
import { TipCard } from "@/components/TipCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RecordingData {
  cardIndex: number;
  prompt: string;
  audioBlob: string;
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'error';
  transcript?: string;
  duration?: number;
  fillerWordCount?: number;
}

// Fallback data if no scenario is loaded
const fallbackPrompts = [
  { text: "Share your thoughts on this topic and why it matters.", tips: ["Focus on personal connection", "Use specific examples", "Keep it conversational"] },
  { text: "Describe a recent experience related to this subject.", tips: ["Share concrete details", "Explain what you learned", "Connect to bigger picture"] },
  { text: "Explain your perspective in a way that's easy to understand.", tips: ["Use simple language", "Break down complex ideas", "Relate to common experiences"] },
];

const PracticeSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [prompts, setPrompts] = useState<Array<{ text: string; tips: string[] }>>([]);
  const [scenarioTitle, setScenarioTitle] = useState<string>('Practice Session');
  const [recordings, setRecordings] = useState<RecordingData[]>([]);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load scenario data from localStorage
    const activeScenarioData = localStorage.getItem('activeScenario');
    if (activeScenarioData) {
      const scenario = JSON.parse(activeScenarioData);
      setPrompts(scenario.prompts);
      setScenarioTitle(scenario.title);
    } else {
      // Fallback to sample prompts if no scenario loaded
      setPrompts(fallbackPrompts);
    }
  }, []);

  const currentPromptData = prompts[currentCardIndex];
  const currentPrompt = currentPromptData?.text || "";
  const currentTips = currentPromptData?.tips || [];
  const totalCards = prompts.length;

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
      const duration = recordingTime;
      
      setIsRecording(false);
      setAnalyser(null);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      console.log("Recording stopped, audio blob size:", audioBlob.size);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Add to recordings array with processing status
        const newRecording: RecordingData = {
          cardIndex: currentCardIndex,
          prompt: currentPrompt,
          audioBlob: base64Audio,
          status: 'processing',
          duration: duration
        };
        
        setRecordings(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(r => r.cardIndex === currentCardIndex);
          if (existingIndex >= 0) {
            updated[existingIndex] = newRecording;
          } else {
            updated.push(newRecording);
          }
          return updated;
        });
        
        toast.success("Recording saved! Processing in background...");
        
        // Start background processing (don't await)
        processRecordingInBackground(base64Audio, currentCardIndex, currentPrompt, duration);
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

  const processRecordingInBackground = async (
    base64Audio: string,
    cardIndex: number,
    prompt: string,
    duration: number
  ) => {
    try {
      // Call transcription service
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      // Check for rate limit error specifically
      if (error) {
        const errorMessage = error.message || JSON.stringify(error);
        if (errorMessage.includes('Rate limit exceeded')) {
          console.error("Rate limit hit:", error);
          
          // Update recording with error status
          setRecordings(prev => prev.map(r => 
            r.cardIndex === cardIndex
              ? { ...r, status: 'error' as const }
              : r
          ));
          
          toast.error(
            "Rate limit reached! Please sign in for unlimited recordings.",
            { duration: 6000 }
          );
          return;
        }
        throw error;
      }

      // Update recording with completed status
      setRecordings(prev => prev.map(r => 
        r.cardIndex === cardIndex
          ? {
              ...r,
              status: 'completed' as const,
              transcript: data.transcript,
              fillerWordCount: data.fillerWordCount
            }
          : r
      ));

      toast.success(`Card ${cardIndex + 1} transcription complete!`);
    } catch (error) {
      console.error("Transcription error:", error);
      
      // Update recording with error status
      setRecordings(prev => prev.map(r => 
        r.cardIndex === cardIndex
          ? { ...r, status: 'error' as const }
          : r
      ));
      
      toast.error(`Failed to transcribe card ${cardIndex + 1}`);
    }
  };

  const handleFinishSession = async () => {
    if (isRecording) {
      await stopRecording();
    }

    // Check if there are any recordings
    if (recordings.length === 0) {
      toast.error("No recordings found. Please record at least one card.");
      return;
    }

    // Wait for any processing recordings to complete
    const processingRecordings = recordings.filter(r => r.status === 'processing');
    if (processingRecordings.length > 0) {
      toast.info(`Waiting for ${processingRecordings.length} recording(s) to finish processing...`);
      
      // Wait up to 30 seconds for processing to complete
      const maxWait = 30000;
      const checkInterval = 500;
      let waited = 0;
      
      while (waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
        
        const stillProcessing = recordings.filter(r => r.status === 'processing').length;
        if (stillProcessing === 0) break;
      }
    }

    // Save session recordings to localStorage
    const completedRecordings = recordings.filter(r => r.status === 'completed');
    const errorRecordings = recordings.filter(r => r.status === 'error');
    
    if (completedRecordings.length === 0) {
      if (errorRecordings.length > 0) {
        toast.error(
          "All recordings failed. Please sign in to continue or try again later.",
          { duration: 6000 }
        );
      } else {
        toast.error("No completed recordings. Please wait for processing to finish.");
      }
      return;
    }
    
    if (errorRecordings.length > 0) {
      toast.info(
        `Showing results for ${completedRecordings.length} completed recording(s). ${errorRecordings.length} failed due to rate limits.`,
        { duration: 5000 }
      );
    }

    localStorage.setItem('sessionRecordings', JSON.stringify({
      recordings: completedRecordings,
      scenarioTitle: scenarioTitle
    }));

    toast.success("Session complete!");
    navigate("/results");
  };

  const getCardStatus = (index: number) => {
    const recording = recordings.find(r => r.cardIndex === index);
    return recording?.status || 'idle';
  };

  const nextCard = async () => {
    if (currentCardIndex < totalCards - 1) {
      if (isRecording) {
        await stopRecording();
      }
      setCurrentCardIndex((prev) => prev + 1);
      setRecordingTime(0);
      
      // Auto-start recording on new card
      setTimeout(() => {
        startRecording();
      }, 300);
    }
  };

  const previousCard = async () => {
    if (currentCardIndex > 0) {
      if (isRecording) {
        await stopRecording();
      }
      setCurrentCardIndex((prev) => prev - 1);
      setRecordingTime(0);
      
      // Auto-start recording on new card
      setTimeout(() => {
        startRecording();
      }, 300);
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

  const completedCount = recordings.filter(r => r.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs sm:text-sm lg:text-base px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 glass-medium backdrop-blur-md shadow-glass">
            {currentCardIndex + 1}/{totalCards}
          </Badge>
          {completedCount > 0 && (
            <Badge variant="default" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 glass-light">
              <Check className="h-3 w-3 mr-1" />
              {completedCount} done
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleFinishSession}
            className="gap-2 text-xs sm:text-sm"
            size="sm"
            disabled={recordings.length === 0}
          >
            <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
            Finish
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExit} className="glass-ultralight backdrop-blur-md hover:shadow-glass h-8 w-8 sm:h-10 sm:w-10">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* Prompt Card */}
      <Card className="border-2 border-primary/30 shadow-glass-lg hover:shadow-glass-lg transition-smooth relative">
        <CardContent className="py-6 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8">
          {getCardStatus(currentCardIndex) === 'completed' && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <Badge variant="default" className="gap-1 glass-light">
                <Check className="h-3 w-3" />
                Done
              </Badge>
            </div>
          )}
          {getCardStatus(currentCardIndex) === 'processing' && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <Badge variant="secondary" className="gap-1 glass-light">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing
              </Badge>
            </div>
          )}
          <p className="text-base sm:text-lg lg:text-2xl text-center leading-relaxed font-medium break-words">
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
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>
        <Button
          variant="outline"
          onClick={nextCard}
          disabled={currentCardIndex === totalCards - 1}
          className="gap-1 sm:gap-2 text-xs sm:text-sm"
          size="sm"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
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
              : "bg-gradient-to-br from-primary to-primary/80 glass-light backdrop-blur-xl border-2 border-border glow-primary hover:shadow-glass-lg"
          }`}
        >
          {isRecording ? (
            <Square className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground fill-primary-foreground" />
          ) : (
            <Mic className="h-8 w-8 sm:h-10 sm:w-10 text-gray-900 dark:text-white" />
          )}
        </button>
      </div>

      {/* Waveform and Timers */}
      {isRecording && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <Waveform
            analyser={analyser}
            isRecording={isRecording}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          </div>
        </div>
      )}

      {/* Tip Card */}
      <div className="max-w-2xl mx-auto">
        <TipCard tips={currentTips} />
      </div>
    </div>
  );
};

export default PracticeSession;
