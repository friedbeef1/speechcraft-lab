import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Award, Clock, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Analytics = () => {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState([
    { label: "Total Sessions", value: "0", icon: Target, change: "--" },
    { label: "Average Score", value: "0", icon: Award, change: "--" },
    { label: "Practice Time", value: "0h", icon: Clock, change: "--" },
    { label: "Improvement", value: "--", icon: TrendingUp, change: "No data yet" },
  ]);
  const [sessionData, setSessionData] = useState<{ date: string; score: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [metricsData, setMetricsData] = useState<{ metric: string; score: number }[]>([]);

  useEffect(() => {
    if (!user || isGuest) {
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);

        // Fetch all sessions for this user
        const { data: sessions, error } = await supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
          setIsLoading(false);
          return;
        }

        // Calculate overview stats
        const totalSessions = sessions.length;
        const avgScore = (sessions.reduce((sum, s) => sum + s.fluency_score, 0) / totalSessions).toFixed(1);
        const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const practiceTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        // Calculate improvement (compare recent half vs older half)
        const midPoint = Math.floor(sessions.length / 2);
        const recentAvg = sessions.slice(0, midPoint).reduce((sum, s) => sum + s.fluency_score, 0) / midPoint;
        const olderAvg = sessions.slice(midPoint).reduce((sum, s) => sum + s.fluency_score, 0) / (sessions.length - midPoint);
        const improvement = sessions.length >= 2 ? `${((recentAvg - olderAvg) / olderAvg * 100).toFixed(0)}%` : "--";

        setOverviewStats([
          { label: "Total Sessions", value: totalSessions.toString(), icon: Target, change: `${sessions.length} total` },
          { label: "Average Score", value: avgScore, icon: Award, change: `out of 100` },
          { label: "Practice Time", value: practiceTime, icon: Clock, change: `${totalMinutes} min total` },
          { label: "Improvement", value: improvement, icon: TrendingUp, change: "Recent vs older" },
        ]);

        // Get last 7 days of data
        const last7Days = sessions.slice(0, 7).reverse();
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const scoresByDay = last7Days.map(s => ({
          date: daysOfWeek[new Date(s.completed_at).getDay()],
          score: s.fluency_score / 10 // Convert to 0-10 scale for better visualization
        }));
        setSessionData(scoresByDay);

        // Category distribution (if we have category data)
        const categoryCounts = sessions.reduce((acc, s) => {
          const cat = s.category || 'General';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];
        const categoryChartData = Object.entries(categoryCounts).map(([name, value], i) => ({
          name,
          value,
          color: colors[i % colors.length]
        }));
        setCategoryData(categoryChartData);

        // Skills assessment (using individual scores if available)
        const avgClarity = sessions.filter(s => s.clarity_score).reduce((sum, s) => sum + (s.clarity_score || 0), 0) / sessions.filter(s => s.clarity_score).length || 0;
        const avgConfidence = sessions.filter(s => s.confidence_score).reduce((sum, s) => sum + (s.confidence_score || 0), 0) / sessions.filter(s => s.confidence_score).length || 0;
        const avgEmpathy = sessions.filter(s => s.empathy_score).reduce((sum, s) => sum + (s.empathy_score || 0), 0) / sessions.filter(s => s.empathy_score).length || 0;
        const avgPacing = sessions.filter(s => s.pacing_score).reduce((sum, s) => sum + (s.pacing_score || 0), 0) / sessions.filter(s => s.pacing_score).length || 0;

        // If no individual scores, derive from overall fluency
        const skillsData = avgClarity > 0 ? [
          { metric: "Clarity", score: avgClarity },
          { metric: "Confidence", score: avgConfidence },
          { metric: "Empathy", score: avgEmpathy },
          { metric: "Pacing", score: avgPacing },
        ] : [
          { metric: "Fluency", score: parseFloat(avgScore) / 10 },
          { metric: "Word Count", score: sessions.reduce((sum, s) => sum + s.word_count, 0) / sessions.length / 20 },
          { metric: "Speech Rate", score: sessions.reduce((sum, s) => sum + s.speech_rate, 0) / sessions.length / 20 },
          { metric: "Filler Words", score: Math.max(0, 10 - sessions.reduce((sum, s) => sum + s.filler_word_count, 0) / sessions.length) },
        ];
        setMetricsData(skillsData);

      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, isGuest, navigate]);

  // Guest user view
  if (isGuest) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your progress and identify areas for improvement
            </p>
          </div>

          <Card className="glass-light border-primary/50">
            <CardContent className="p-8 text-center">
              <div className="inline-flex p-4 rounded-full glass-medium mb-4">
                <UserCircle className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sign up to track your progress!</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create an account to save your practice sessions, view detailed analytics, and track your improvement over time.
              </p>
              <Button onClick={() => navigate("/auth")} size="lg" className="glow-primary">
                Create Account
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-medium">
            <CardHeader>
              <CardTitle>What you'll get with an account:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full glass-light mt-1">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <strong>Session History</strong> - Keep track of all your practice sessions
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full glass-light mt-1">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <strong>Progress Tracking</strong> - See your improvement over time with charts
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full glass-light mt-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <strong>Detailed Analytics</strong> - Get insights into your strengths and areas to improve
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Unauthenticated user - redirect
  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your progress and identify areas for improvement
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat) => (
            <Card key={stat.label} className="glass-medium shadow-glass">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1 break-words">{stat.value}</p>
                    <p className="text-sm text-primary mt-1">{stat.change}</p>
                  </div>
                  <div className="p-3 rounded-lg glass-light">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="glass-medium">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card className="glass-medium shadow-glass">
              <CardHeader>
                <CardTitle className="text-foreground">Score Trend</CardTitle>
                <CardDescription>Your performance over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sessionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card className="glass-medium shadow-glass">
              <CardHeader>
                <CardTitle className="text-foreground">Practice Distribution</CardTitle>
                <CardDescription>Breakdown by conversation type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card className="glass-medium shadow-glass">
              <CardHeader>
                <CardTitle className="text-foreground">Skills Assessment</CardTitle>
                <CardDescription>Your strengths across different areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
