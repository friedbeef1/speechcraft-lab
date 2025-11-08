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

  // Mock data - in production, this would come from the recording session
  const mockTranscript = `Hello everyone, I'm here to talk about the importance of effective communication in the workplace. Um, good communication is essential for, uh, building strong teams and achieving success. When we communicate clearly, we can, like, share ideas better and work together more efficiently. Effective communication involves both speaking and listening. We need to, uh, be clear in our message and also, you know, understand what others are saying. This helps prevent misunderstandings and builds trust among team members.`;
  
  const mockDuration = 45; // seconds
  const mockFillerWords = ["um", "uh", "like", "you know"];

  // Generate mock vocal variation data
  const mockVocalData = Array.from({ length: 20 }, (_, i) => ({
    time: i * 2.25,
    pitch: 100 + Math.random() * 50 + Math.sin(i * 0.5) * 20,
    volume: 60 + Math.random() * 30 + Math.cos(i * 0.3) * 15,
    card: Math.floor(i / 4) + 1,
  }));

  const highlightFillerWords = (text: string) => {
    let highlighted = text;
    mockFillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `<mark class="bg-amber-200 dark:bg-amber-900/50 px-1 rounded">$&</mark>`);
    });
    return highlighted;
  };

  useEffect(() => {
    const analyzeRecording = async () => {
      try {
        setIsLoading(true);
        
        // Count filler words in transcript
        const fillerWordCount = mockFillerWords.reduce((count, word) => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          const matches = mockTranscript.match(regex);
          return count + (matches ? matches.length : 0);
        }, 0);

        const { data, error } = await supabase.functions.invoke('analyze-speech', {
          body: {
            transcript: mockTranscript,
            duration: mockDuration,
            fillerWordCount
          }
        });

        if (error) throw error;

        setAnalysisData(data);
        toast.success("Analysis complete!");
      } catch (error) {
        console.error('Error analyzing speech:', error);
        toast.error("Failed to analyze speech");
        
        // Fallback data if analysis fails
        setAnalysisData({
          metrics: {
            fluencyScore: 78,
            wordCount: mockTranscript.split(/\s+/).length,
            speechRate: Math.round((mockTranscript.split(/\s+/).length / mockDuration) * 60),
            fillerWordCount: 5
          },
          feedback: {
            delivery: [
              "Your speaking pace is good, maintaining around 140 words per minute",
              "Try to reduce filler words to sound more confident",
              "Consider adding more pauses for emphasis"
            ],
            content: [
              "Your main message about communication is clear",
              "Good use of examples to support your points",
              "Consider structuring with a stronger opening and closing"
            ]
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    analyzeRecording();
  }, []);

  const exportToPDF = () => {
    if (!analysisData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text("Speech Analysis Report", pageWidth / 2, 20, { align: "center" });
    
    // Key Metrics
    doc.setFontSize(16);
    doc.text("Key Metrics", 20, 40);
    doc.setFontSize(12);
    doc.text(`Fluency Score: ${analysisData.metrics.fluencyScore}/100`, 20, 50);
    doc.text(`Word Count: ${analysisData.metrics.wordCount}`, 20, 58);
    doc.text(`Speech Rate: ${analysisData.metrics.speechRate} wpm`, 20, 66);
    doc.text(`Filler Words: ${analysisData.metrics.fillerWordCount}`, 20, 74);
    
    // Delivery Feedback
    doc.setFontSize(16);
    doc.text("Delivery Feedback", 20, 90);
    doc.setFontSize(10);
    let y = 98;
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
      const transcriptLines = doc.splitTextToSize(mockTranscript, pageWidth - 40);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Analysis Complete
        </Badge>
      </div>

      <h1 className="text-4xl font-bold">Session Results</h1>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysisData.metrics.fluencyScore}/100</div>
            <Progress value={analysisData.metrics.fluencyScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Word Count</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysisData.metrics.wordCount}</div>
            <p className="text-xs text-muted-foreground mt-2">Total words spoken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Speech Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysisData.metrics.speechRate}</div>
            <p className="text-xs text-muted-foreground mt-2">Words per minute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filler Words</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {analysisData.metrics.fillerWordCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Um, uh, like, you know</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Feedback */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Feedback</CardTitle>
            <CardDescription>Pace, tone, and speaking style</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysisData.feedback.delivery.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Feedback</CardTitle>
            <CardDescription>Clarity, structure, and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysisData.feedback.content.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Vocal Variation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vocal Variation</CardTitle>
          <CardDescription>Pitch and volume throughout your speech</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockVocalData}>
              <defs>
                <linearGradient id="colorPitch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Level', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Area type="monotone" dataKey="pitch" stroke="hsl(217, 91%, 60%)" fillOpacity={1} fill="url(#colorPitch)" name="Pitch" />
              <Area type="monotone" dataKey="volume" stroke="hsl(173, 80%, 40%)" fillOpacity={1} fill="url(#colorVolume)" name="Volume" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-Card Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Card Breakdown</CardTitle>
          <CardDescription>Detailed analysis for each prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="card-1">
              <AccordionTrigger>Card 1: Introduction</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-lg font-semibold">15s</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Word Count</p>
                    <p className="text-lg font-semibold">35</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Filler Words</p>
                    <p className="text-lg font-semibold text-amber-500">2</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Transcript:</p>
                  <p className="text-sm text-muted-foreground">
                    "Hello everyone, I'm here to talk about the importance of effective communication in the workplace. Um, good communication is essential..."
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Play Segment
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Full Transcript and Recording */}
      <Card>
        <CardHeader>
          <CardTitle>Full Recording & Transcript</CardTitle>
          <CardDescription>Complete audio and text from your session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Button size="icon" variant="outline">
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Progress value={0} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground">0:00 / 0:45</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Transcript (filler words highlighted):</p>
            <div 
              className="text-sm leading-relaxed p-4 bg-muted/50 rounded-lg"
              dangerouslySetInnerHTML={{ __html: highlightFillerWords(mockTranscript) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button size="lg" onClick={() => navigate("/prepare?mode=freestyle")} className="flex-1">
          Practice Again
        </Button>
        <Button size="lg" variant="outline" onClick={exportToPDF} className="flex-1 gap-2">
          <Download className="h-4 w-4" />
          Export as PDF
        </Button>
      </div>
    </div>
  );
};

export default SessionResults;
