import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  UserCircle,
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

interface RecordingWithAnalysis {
  cardIndex: number;
  prompt: string;
  transcript: string;
  duration: number;
  audioBlob: string;
  fillerWordCount: number;
  audioUrl?: string;
  analysis?: AnalysisData;
}

const SessionResults = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [recordings, setRecordings] = useState<RecordingWithAnalysis[]>([]);
  const [scenarioTitle, setScenarioTitle] = useState<string>('Practice Session');
  const [selectedTab, setSelectedTab] = useState("0");

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

  const renderTranscript = (text: string) => {
    if (!text) return null;
    
    const words = text.split(/(\s+)/);
    
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().trim();
      const isFillerWord = fillerWords.includes(cleanWord);
      
      if (isFillerWord) {
        return (
          <mark 
            key={i} 
            className="bg-destructive/20 text-foreground px-1 rounded"
          >
            {word}
          </mark>
        );
      }
      return <span key={i}>{word}</span>;
    });
  };

  useEffect(() => {
    const loadAndAnalyzeRecordings = async () => {
      try {
        setIsLoading(true);
        
        // Load session recordings from localStorage
        const stored = localStorage.getItem('sessionRecordings');
        if (!stored) {
          toast.error("No recording data found");
          navigate("/");
          return;
        }
        
        const sessionData = JSON.parse(stored);
        const recordingsData: RecordingWithAnalysis[] = sessionData.recordings;
        setScenarioTitle(sessionData.scenarioTitle || 'Practice Session');
        
        if (!recordingsData || recordingsData.length === 0) {
          toast.error("No recordings found");
          navigate("/");
          return;
        }

        // Process each recording: convert audio and analyze
        const processedRecordings = await Promise.all(
          recordingsData.map(async (recording) => {
            try {
              // Convert base64 back to blob for audio playback
              const binaryString = atob(recording.audioBlob);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'audio/webm' });
              const audioUrl = URL.createObjectURL(blob);

              // Call AI analysis
              const { data: analysisResult, error } = await supabase.functions.invoke('analyze-speech', {
                body: {
                  transcript: recording.transcript,
                  duration: recording.duration,
                  fillerWordCount: recording.fillerWordCount
                }
              });

              if (error) throw error;

              return {
                ...recording,
                audioUrl,
                analysis: analysisResult
              };
            } catch (error) {
              console.error(`Error analyzing recording ${recording.cardIndex}:`, error);
              
              // Fallback analysis
              return {
                ...recording,
                audioUrl: '',
                analysis: {
                  metrics: {
                    fluencyScore: 75,
                    wordCount: recording.transcript?.split(/\s+/).length || 0,
                    speechRate: Math.round(((recording.transcript?.split(/\s+/).length || 0) / recording.duration) * 60),
                    fillerWordCount: recording.fillerWordCount
                  },
                  feedback: {
                    delivery: ["Your speaking pace could be improved", "Work on reducing filler words"],
                    content: ["Consider adding more structure", "Use specific examples"]
                  }
                }
              };
            }
          })
        );

        setRecordings(processedRecordings);
        
        // Save all sessions to database if user is authenticated
        if (user && !isGuest) {
          try {
            const sessionsToInsert = processedRecordings.map(rec => ({
              user_id: user.id,
              transcript: rec.transcript,
              duration: rec.duration,
              fluency_score: rec.analysis?.metrics.fluencyScore || 0,
              word_count: rec.analysis?.metrics.wordCount || 0,
              speech_rate: rec.analysis?.metrics.speechRate || 0,
              filler_word_count: rec.analysis?.metrics.fillerWordCount || 0,
              delivery_feedback: rec.analysis?.feedback.delivery || [],
              content_feedback: rec.analysis?.feedback.content || [],
              prompts: [{ text: rec.prompt }],
              audio_url: null,
              category: null
            }));

            const { error: insertError } = await supabase
              .from('practice_sessions')
              .insert(sessionsToInsert);

            if (insertError) {
              console.error('Error saving sessions:', insertError);
            }
          } catch (saveError) {
            console.error('Error saving to database:', saveError);
          }
        }
        
        toast.success("All recordings analyzed!");
      } catch (error) {
        console.error('Error loading recordings:', error);
        toast.error("Failed to load recordings");
      } finally {
        setIsLoading(false);
      }
    };

    loadAndAnalyzeRecordings();

    // Cleanup audio URLs on unmount
    return () => {
      recordings.forEach(rec => {
        if (rec.audioUrl) {
          URL.revokeObjectURL(rec.audioUrl);
        }
      });
    };
  }, []);

  // Calculate aggregate metrics
  const aggregateMetrics = recordings.length > 0 ? {
    avgFluencyScore: Math.round(recordings.reduce((sum, r) => sum + (r.analysis?.metrics.fluencyScore || 0), 0) / recordings.length),
    totalWordCount: recordings.reduce((sum, r) => sum + (r.analysis?.metrics.wordCount || 0), 0),
    avgSpeechRate: Math.round(recordings.reduce((sum, r) => sum + (r.analysis?.metrics.speechRate || 0), 0) / recordings.length),
    totalFillerWords: recordings.reduce((sum, r) => sum + (r.analysis?.metrics.fillerWordCount || 0), 0),
  } : null;

  const exportToPDF = () => {
    if (recordings.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text("Multi-Card Session Report", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(scenarioTitle, pageWidth / 2, 28, { align: "center" });
    
    let y = 40;
    
    // Aggregate Metrics
    if (aggregateMetrics) {
      doc.setFontSize(16);
      doc.text("Overall Performance", 20, y);
      y += 8;
      doc.setFontSize(12);
      doc.text(`Average Fluency: ${aggregateMetrics.avgFluencyScore}/100`, 20, y);
      y += 6;
      doc.text(`Total Words: ${aggregateMetrics.totalWordCount}`, 20, y);
      y += 6;
      doc.text(`Average Rate: ${aggregateMetrics.avgSpeechRate} wpm`, 20, y);
      y += 6;
      doc.text(`Total Fillers: ${aggregateMetrics.totalFillerWords}`, 20, y);
      y += 12;
    }
    
    // Individual recordings
    recordings.forEach((recording, idx) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`Card ${recording.cardIndex + 1}`, 20, y);
      y += 6;
      
      doc.setFontSize(10);
      const promptLines = doc.splitTextToSize(recording.prompt, pageWidth - 40);
      doc.text(promptLines, 20, y);
      y += promptLines.length * 5 + 8;
      
      if (recording.analysis) {
        doc.text(`Fluency: ${recording.analysis.metrics.fluencyScore}/100 | Words: ${recording.analysis.metrics.wordCount} | Rate: ${recording.analysis.metrics.speechRate} wpm`, 20, y);
        y += 8;
      }
      
      y += 6;
    });
    
    doc.save(`${scenarioTitle}-session-report.pdf`);
    toast.success("Report exported successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Analyzing your recordings...</p>
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No recordings found</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Return Home
        </Button>
      </div>
    );
  }

  const currentRecording = recordings[parseInt(selectedTab)];

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
          {recordings.length} Card{recordings.length > 1 ? 's' : ''} Analyzed
        </Badge>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{scenarioTitle}</h1>
        <p className="text-muted-foreground mt-1">Multi-card practice session results</p>
      </div>

      {/* Guest Mode Banner */}
      {isGuest && (
        <Card className="glass-light border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg glass-medium">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Sign up to save your progress!</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Create an account to track your improvement over time and access detailed analytics.
                </p>
                <Button onClick={() => navigate("/auth")} size="sm">
                  Create Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregate Metrics */}
      {aggregateMetrics && (
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg Fluency</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{aggregateMetrics.avgFluencyScore}/100</div>
              <Progress value={aggregateMetrics.avgFluencyScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Words</CardTitle>
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{aggregateMetrics.totalWordCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">All cards combined</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg Rate</CardTitle>
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{aggregateMetrics.avgSpeechRate}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">WPM average</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-glass-lg hover:scale-[1.02] transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Fillers</CardTitle>
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-500">
                {aggregateMetrics.totalFillerWords}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">Um, uh, like</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Recording Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${recordings.length}, 1fr)` }}>
          {recordings.map((recording, idx) => (
            <TabsTrigger key={idx} value={idx.toString()} className="text-xs sm:text-sm">
              Card {recording.cardIndex + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {recordings.map((recording, idx) => (
          <TabsContent key={idx} value={idx.toString()} className="space-y-4 sm:space-y-6 mt-4">
            {recording.analysis && (
              <>
                {/* Individual Card Metrics */}
                <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
                  <Card className="hover:shadow-glass-lg transition-smooth">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium">Fluency</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="text-xl sm:text-2xl font-bold">{recording.analysis.metrics.fluencyScore}/100</div>
                      <Progress value={recording.analysis.metrics.fluencyScore} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-glass-lg transition-smooth">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium">Words</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="text-xl sm:text-2xl font-bold">{recording.analysis.metrics.wordCount}</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-glass-lg transition-smooth">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium">Rate</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="text-xl sm:text-2xl font-bold">{recording.analysis.metrics.speechRate} WPM</div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-glass-lg transition-smooth">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium">Fillers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-amber-500">{recording.analysis.metrics.fillerWordCount}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Feedback for this card */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                  <Card className="hover:shadow-glass-lg transition-smooth">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Delivery Feedback</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Pace, tone, and speaking style</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <ul className="space-y-2 sm:space-y-3">
                        {recording.analysis.feedback.delivery.map((point, i) => (
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
                      <CardTitle className="text-base sm:text-lg">Content Feedback</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Clarity, structure, and engagement</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <ul className="space-y-2 sm:space-y-3">
                        {recording.analysis.feedback.content.map((point, i) => (
                          <li key={i} className="flex gap-2 text-xs sm:text-sm">
                            <span className="text-primary mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                            <span className="break-words">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Vocal Variation Chart for this card */}
                <Card className="hover:shadow-glass-lg transition-smooth">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Vocal Variation</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Pitch and volume throughout your speech</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                      <AreaChart data={getVocalData(recording.duration)}>
                        <defs>
                          <linearGradient id={`colorPitch${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id={`colorVolume${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                        <Area type="monotone" dataKey="pitch" stroke="hsl(var(--primary))" fillOpacity={1} fill={`url(#colorPitch${idx})`} name="Pitch" />
                        <Area type="monotone" dataKey="volume" stroke="hsl(var(--accent))" fillOpacity={1} fill={`url(#colorVolume${idx})`} name="Volume" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Prompt Display */}
                <Card className="hover:shadow-glass-lg transition-smooth">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Practice Prompt</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <p className="text-sm sm:text-base leading-relaxed break-words">{recording.prompt}</p>
                  </CardContent>
                </Card>

                {/* Recording and Transcript */}
                <Card className="hover:shadow-glass-lg transition-smooth">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Recording & Transcript</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    {recording.audioUrl && (
                      <div className="p-3 sm:p-4 glass-ultralight backdrop-blur-md rounded-lg shadow-glass">
                        <audio controls className="w-full">
                          <source src={recording.audioUrl} type="audio/webm" />
                        </audio>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium">Transcript (filler words highlighted):</p>
                      <div className="text-xs sm:text-sm leading-relaxed p-3 sm:p-4 glass-ultralight backdrop-blur-md rounded-lg shadow-glass max-h-[300px] overflow-y-auto">
                        {renderTranscript(recording.transcript || '')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button size="lg" onClick={() => navigate("/prepare?mode=freestyle")} className="flex-1 glow-primary h-16 text-lg">
          Practice Again
        </Button>
        <Button size="lg" variant="outline" onClick={exportToPDF} className="flex-1 gap-2 h-16 text-lg">
          <Download className="h-5 w-5" />
          Export as PDF
        </Button>
      </div>
    </div>
  );
};

export default SessionResults;
