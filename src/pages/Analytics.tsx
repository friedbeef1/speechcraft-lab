import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Award, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const overviewStats = [
    { label: "Total Sessions", value: "24", icon: Target, change: "+12%" },
    { label: "Average Score", value: "8.2", icon: Award, change: "+0.5" },
    { label: "Practice Time", value: "12h", icon: Clock, change: "+3h" },
    { label: "Improvement", value: "+15%", icon: TrendingUp, change: "This month" },
  ];

  const sessionData = [
    { date: "Mon", score: 7.5 },
    { date: "Tue", score: 8.0 },
    { date: "Wed", score: 7.8 },
    { date: "Thu", score: 8.5 },
    { date: "Fri", score: 8.2 },
    { date: "Sat", score: 8.7 },
    { date: "Sun", score: 8.9 },
  ];

  const categoryData = [
    { name: "Work", value: 45, color: "hsl(var(--primary))" },
    { name: "Social", value: 35, color: "hsl(var(--accent))" },
    { name: "Love", value: 20, color: "hsl(var(--secondary))" },
  ];

  const metricsData = [
    { metric: "Clarity", score: 8.5 },
    { metric: "Confidence", score: 7.8 },
    { metric: "Empathy", score: 8.2 },
    { metric: "Pacing", score: 7.5 },
  ];

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
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
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
