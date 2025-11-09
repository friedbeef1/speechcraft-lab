import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Zap, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Practice = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "Sessions This Week", value: "3", icon: Target },
    { label: "Current Streak", value: "5 days", icon: TrendingUp },
    { label: "Total Practice Time", value: "2h 15m", icon: Zap },
  ];

  const practiceMode = [
    {
      title: "Freestyle Practice",
      description: "Practice any conversation without a specific scenario",
      icon: Mic,
      path: "/prepare",
    },
    {
      title: "Scenario Practice",
      description: "Choose from pre-defined conversation scenarios",
      icon: Target,
      path: "/prepare",
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Practice Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your practice mode and start improving
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass-medium shadow-glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg glass-light">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Practice Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practiceMode.map((mode) => (
            <Card
              key={mode.title}
              className="glass-medium shadow-glass hover:glass-light transition-smooth cursor-pointer"
              onClick={() => navigate(mode.path)}
            >
              <CardHeader>
                <div className="p-4 rounded-lg glass-light w-fit mb-4">
                  <mode.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Practice</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Action */}
        <Card className="glass-medium shadow-glass border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready to practice?
                </h3>
                <p className="text-muted-foreground">
                  Jump right in and start improving your conversation skills
                </p>
              </div>
              <Button size="lg" onClick={() => navigate("/prepare")}>
                <Mic className="mr-2 h-5 w-5" />
                Start Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Practice;
