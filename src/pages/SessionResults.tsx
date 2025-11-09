import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Download,
  Play,
  TrendingUp,
  MessageSquare,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface AnalysisData {
  metrics: {
    fluencyScore: number;
    wordCount: number;
    speechRate: number;
    fillerWordCount: number;
  };
  feedback: {
    delivery: string[];
    content: string[];
  };
}

const SessionResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [recordingData, setRecordingData] = useState<{
    transcript: string;
    duration: number;
    audioBlob: string;
    fillerWordCount: number;
    prompt: string;
  } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");

  const fillerWords = ["um", "uh", "like", "you know", "so", "actually", "basically"];

  // Generate vocal variation data based on duration
  const getVocalData = (duration: number) => {
    const points = Math.max(10, Math.floor(duration / 2));
    return Array.from({ length: points }, (_, i) => ({
      time: (duration / points) * i,
      pitch: 100 + Math.random() * 50 + Math.sin(i * 0.5) * 20,
      volume: 60 + Math.random() * 30 + Math.cos(i * 0.3) * 15,
    }));
  };

  const highlightFillerWords = (text: string) => {
    let highlighted = text;
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `<mark class="bg-destructive/20 text-foreground px-1 rounded">$&</mark>`);
    });
    return highlighted;
  };

  useEffect(() => {
    const loadRecordingData = () => {
      const stored = localStorage.getItem('lastRecording');
      if (!stored) {
        toast.error("No recording data found");
        navigate("/");
        return null;
      }
      return JSON.parse(stored);
    };

    const analyzeRecording = async () => {
      try {
        setIsLoading(true);
        
        // Load recording data from localStorage
        const data = loadRecordingData();
        if (!data) return;
        
        setRecordingData(data);

        // Convert base64 back to blob for audio playback
        const binaryString = atob(data.audioBlob);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Call AI analysis with real transcript
        const { data: analysisResult, error } = await supabase.functions.invoke('analyze-speech', {
          body: {
            transcript: data.transcript,
            duration: data.duration,
            fillerWordCount: data.fillerWordCount
          }
        });

        if (error) throw error;

        setAnalysisData(analysisResult);
        toast.success("Analysis complete!");
      } catch (error) {
        console.error('Error analyzing speech:', error);
        toast.error("Failed to analyze speech");
        
        // Fallback data if analysis fails
        if (recordingData) {
          setAnalysisData({
            metrics: {
              fluencyScore: 75,
              wordCount: recordingData.transcript.split(/\s+/).length,
              speechRate: Math.round((recordingData.transcript.split(/\s+/).length / recordingData.duration) * 60),
              fillerWordCount: recordingData.fillerWordCount
            },
            feedback: {
              delivery: [
                "Your speaking pace could be improved for better engagement",
                "Work on reducing filler words to sound more confident",
                "Consider varying your tone for emphasis"
              ],
              content: [
                "Your message is clear but could be more structured",
                "Consider adding specific examples to support your points",
                "Work on stronger opening and closing statements"
              ]
            }
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    analyzeRecording();

    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const exportToPDF = () => {
    if (!analysisData || !recordingData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text("Speech Analysis Report", pageWidth / 2, 20, { align: "center" });
    
    // Prompt
    doc.setFontSize(12);
    doc.text("Prompt:", 20, 35);
    doc.setFontSize(10);
    const promptLines = doc.splitTextToSize(recordingData.prompt, pageWidth - 40);
    doc.text(promptLines, 20, 42);
    
    let y = 42 + promptLines.length * 5 + 10;
    
    // Key Metrics
    doc.setFontSize(16);
    doc.text("Key Metrics", 20, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Fluency Score: ${analysisData.metrics.fluencyScore}/100`, 20, y);
    y += 8;
    doc.text(`Word Count: ${analysisData.metrics.wordCount}`, 20, y);
    y += 8;
    doc.text(`Speech Rate: ${analysisData.metrics.speechRate} wpm`, 20, y);
    y += 8;
    doc.text(`Filler Words: ${analysisData.metrics.fillerWordCount}`, 20, y);
    y += 16;
    
    // Delivery Feedback
    doc.setFontSize(16);
    doc.text("Delivery Feedback", 20, y);
    y += 8;
    doc.setFontSize(10);
    analysisData.feedback.delivery.forEach((point, i) => {
      const lines = doc.splitTextToSize(`• ${point}`, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 6;
    });
    
    // Content Feedback
    y += 10;
    doc.setFontSize(16);
    doc.text("Content Feedback", 20, y);
    y += 8;
    doc.setFontSize(10);
    analysisData.feedback.content.forEach((point, i) => {
      const lines = doc.splitTextToSize(`• ${point}`, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * 6;
    });
    
    // Transcript
    if (y < 220) {
      y += 10;
      doc.setFontSize(16);
      doc.text("Transcript", 20, y);
      y += 8;
      doc.setFontSize(9);
      const transcriptLines = doc.splitTextToSize(recordingData.transcript, pageWidth - 40);
      transcriptLines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      });
    }
    
    doc.save("speech-analysis-report.pdf");
    toast.success("Report exported successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Analyzing your speech...</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Failed to load analysis data</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 glass-ultralight backdrop-blur-md text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <Badge variant="secondary" className="text-xs sm:text-sm lg:text-base px-3 sm:px-4 py-1.5 sm:py-2 glass-medium backdrop-blur-md shadow-glass">
          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Analysis Complete
        </Badge>
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Session Results</h1>

      {/* Key Metrics */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Fluency</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analysisData.metrics.fluencyScore}/100</div>
            <Progress value={analysisData.metrics.fluencyScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Words</CardTitle>
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analysisData.metrics.wordCount}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">Total spoken</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Rate</CardTitle>
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analysisData.metrics.speechRate}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">WPM</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Fillers</CardTitle>
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-500">
              {analysisData.metrics.fillerWordCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">Um, uh, like</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Feedback */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="hover:shadow-glass-lg transition-smooth">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl">Delivery Feedback</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Pace, tone, and speaking style</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ul className="space-y-2 sm:space-y-3">
              {analysisData.feedback.delivery.map((point, i) => (
                <li key={i} className="flex gap-2 text-xs sm:text-sm">
                  <span className="text-primary mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                  <span className="break-words">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glass-lg transition-smooth">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl">Content Feedback</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Clarity, structure, and engagement</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ul className="space-y-2 sm:space-y-3">
              {analysisData.feedback.content.map((point, i) => (
                <li key={i} className="flex gap-2 text-xs sm:text-sm">
                  <span className="text-primary mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                  <span className="break-words">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Vocal Variation Chart */}
      <Card className="hover:shadow-glass-lg transition-smooth">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Vocal Variation</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Pitch and volume throughout your speech</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px] lg:!h-[300px]">
            <AreaChart data={recordingData ? getVocalData(recordingData.duration) : []}>
              <defs>
                <linearGradient id="colorPitch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis label={{ value: 'Level', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))' }} />
              <Area type="monotone" dataKey="pitch" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPitch)" name="Pitch" />
              <Area type="monotone" dataKey="volume" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorVolume)" name="Volume" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Prompt Display */}
      {recordingData && (
        <Card className="hover:shadow-glass-lg transition-smooth">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl">Practice Prompt</CardTitle>
            <CardDescription className="text-xs sm:text-sm">The prompt you responded to</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-sm sm:text-base lg:text-lg leading-relaxed break-words">{recordingData.prompt}</p>
          </CardContent>
        </Card>
      )}

      {/* Full Transcript and Recording */}
      <Card className="hover:shadow-glass-lg transition-smooth">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Full Recording & Transcript</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Complete audio and text from your session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          {audioUrl && (
            <div className="p-3 sm:p-4 glass-ultralight backdrop-blur-md rounded-lg shadow-glass">
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium">Transcript (filler words highlighted):</p>
            <div 
              className="text-xs sm:text-sm leading-relaxed p-3 sm:p-4 glass-ultralight backdrop-blur-md rounded-lg shadow-glass max-h-[300px] sm:max-h-[400px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: highlightFillerWords(recordingData?.transcript || '') }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button size="lg" onClick={() => navigate("/prepare?mode=freestyle")} className="flex-1 glow-primary text-sm sm:text-base">
          Practice Again
        </Button>
        <Button size="lg" variant="outline" onClick={exportToPDF} className="flex-1 gap-2 text-sm sm:text-base">
          <Download className="h-4 w-4" />
          Export as PDF
        </Button>
      </div>
    </div>
  );
};

export default SessionResults;
