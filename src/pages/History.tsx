import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, TrendingUp, MessageSquare, BarChart3, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getSessions, StoredSession } from "@/lib/storage";
interface PracticeSession extends StoredSession {}
const History = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetchSessions();
  }, []);
  const fetchSessions = async () => {
    try {
      setIsLoading(true);

      // Load sessions from localStorage
      const loadedSessions = getSessions();

      // If no sessions exist, add mock data for demonstration
      if (loadedSessions.length === 0) {
        const mockSessions: PracticeSession[] = [{
          id: "1",
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          fluencyScore: 78,
          wordCount: 145,
          speechRate: 138,
          fillerWordCount: 5,
          duration: 45,
          deliveryFeedback: [],
          contentFeedback: []
        }, {
          id: "2",
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          fluencyScore: 72,
          wordCount: 132,
          speechRate: 125,
          fillerWordCount: 8,
          duration: 40,
          deliveryFeedback: [],
          contentFeedback: []
        }, {
          id: "3",
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          fluencyScore: 65,
          wordCount: 120,
          speechRate: 118,
          fillerWordCount: 12,
          duration: 38,
          deliveryFeedback: [],
          contentFeedback: []
        }];
        setSessions(mockSessions);
      } else {
        setSessions(loadedSessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load practice history");
    } finally {
      setIsLoading(false);
    }
  };
  const handleViewSession = (sessionId: string) => {
    // In production, you would pass the session ID as a query param
    navigate(`/results?session=${sessionId}`);
  };
  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading your history...</p>
        </div>
      </div>;
  }
  return <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Practice History</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          Review your past sessions and track your progress
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fluency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.fluencyScore, 0) / sessions.length) : 0}
              /100
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.reduce((sum, s) => sum + s.wordCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Speech Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.speechRate, 0) / sessions.length) : 0}{" "}
              wpm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>Click on any session to view detailed results</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No practice sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start practicing to see your history here
              </p>
              <Button onClick={() => navigate("/prepare?mode=freestyle")}>
                Start First Session
              </Button>
            </div> : <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {sessions.map(session => <Card key={session.id} className="cursor-pointer hover:shadow-glass-lg transition-smooth" onClick={() => handleViewSession(session.id)}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground break-words">
                          {format(new Date(session.completedAt), "MMM d, yyyy")}
                        </p>
                        <Badge variant={getScoreBadgeVariant(session.fluencyScore)}>
                          {session.fluencyScore}/100
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Words</p>
                          <p className="font-semibold">{session.wordCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Speech Rate</p>
                          <p className="font-semibold">{session.speechRate} wpm</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Filler Words</p>
                          <p className="font-semibold text-destructive">{session.fillerWordCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Time</p>
                          <p className="font-semibold">
                            {format(new Date(session.completedAt), "h:mm a")}
                          </p>
                        </div>
                      </div>
                      
                    </CardContent>
                  </Card>)}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Fluency Score</TableHead>
                      <TableHead className="text-center">Words</TableHead>
                      <TableHead className="text-center">Speech Rate</TableHead>
                      <TableHead className="text-center">Filler Words</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(session => <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewSession(session.id)}>
                        <TableCell className="font-medium break-words min-w-[180px]">
                          {format(new Date(session.completedAt), "MMM d, yyyy 'at' h:mm a")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getScoreBadgeVariant(session.fluencyScore)}>
                            {session.fluencyScore}/100
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{session.wordCount}</TableCell>
                        <TableCell className="text-center">{session.speechRate} wpm</TableCell>
                        <TableCell className="text-center">
                          <span className="text-destructive font-semibold">
                            {session.fillerWordCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={e => {
                      e.stopPropagation();
                      handleViewSession(session.id);
                    }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </>}
        </CardContent>
      </Card>
    </div>;
};
export default History;