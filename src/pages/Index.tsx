import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Briefcase, 
  Users, 
  Heart, 
  Mic,
  Presentation,
  Phone,
  UserCheck,
  Coffee,
  MessageSquare,
  Sparkles
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { getScenarios, deleteScenario, StoredScenario } from "@/lib/storage";

// Map icon strings to components
const iconMap: Record<string, React.ElementType> = {
  mic: Mic,
  briefcase: Briefcase,
  users: Users,
  heart: Heart,
  coffee: Coffee,
  phone: Phone,
  presentation: Presentation,
  message: MessageSquare,
  usercheck: UserCheck,
};

// Types
interface Scenario {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

// Sample data for pre-built scenarios
const prebuiltScenarios: Record<string, Scenario[]> = {
  work: [
    {
      id: "work-1",
      icon: Presentation,
      title: "Team Presentation",
      description: "Practice delivering a quarterly review to your team with confidence and clarity"
    },
    {
      id: "work-2",
      icon: Phone,
      title: "Client Call",
      description: "Master the art of professional phone conversations with clients"
    },
    {
      id: "work-3",
      icon: UserCheck,
      title: "Job Interview",
      description: "Prepare for your next interview with common questions and best practices"
    },
  ],
  social: [
    {
      id: "social-1",
      icon: Coffee,
      title: "Networking Event",
      description: "Learn to introduce yourself and make meaningful connections"
    },
    {
      id: "social-2",
      icon: MessageSquare,
      title: "Small Talk",
      description: "Build confidence in casual conversations and breaking the ice"
    },
    {
      id: "social-3",
      icon: Users,
      title: "Group Discussion",
      description: "Practice contributing effectively in group settings"
    },
  ],
  love: [
    {
      id: "love-1",
      icon: Heart,
      title: "First Date",
      description: "Practice engaging conversation topics for your first date"
    },
    {
      id: "love-2",
      icon: MessageSquare,
      title: "Difficult Conversation",
      description: "Navigate sensitive topics with care and empathy"
    },
    {
      id: "love-3",
      icon: Heart,
      title: "Expressing Feelings",
      description: "Learn to articulate your emotions clearly and authentically"
    },
  ],
};

const Index = () => {
  const navigate = useNavigate();
  const [userScenarios, setUserScenarios] = useState<StoredScenario[]>([]);

  useEffect(() => {
    // Load scenarios from localStorage on mount
    const loadedScenarios = getScenarios();
    setUserScenarios(loadedScenarios);
  }, []);

  const handleCreateNew = () => {
    navigate("/prepare?mode=scenario");
  };

  const handleEdit = (id: string) => {
    toast.info(`Editing scenario ${id}`);
  };

  const handleDelete = (id: string) => {
    deleteScenario(id);
    setUserScenarios(prev => prev.filter(s => s.id !== id));
    toast.success("Scenario deleted");
  };

  const handleStartScenario = (title: string) => {
    toast.success(`Starting: ${title}`);
  };

  const handleFreestyle = () => {
    navigate("/prepare?mode=freestyle");
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Practice Scenarios</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          Choose a scenario to practice or create your own custom session
        </p>
      </div>

      {/* Your Scenarios Section */}
      <Card className="hover:shadow-glass-lg transition-smooth">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Your Scenarios</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Custom scenarios you've created</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="gap-2 glow-primary w-full sm:w-auto text-sm">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {userScenarios.length === 0 ? (
            <div className="text-center py-8 sm:py-12 border-2 border-dashed border-border/50 rounded-lg glass-ultralight backdrop-blur-md px-3">
              <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4 animate-float" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No scenarios yet</h3>
              <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm">
                Create your first custom scenario to start practicing
              </p>
              <Button onClick={handleCreateNew} variant="outline" className="gap-2 text-sm">
                <Plus className="h-4 w-4" />
                Create Your First Scenario
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userScenarios.map((scenario) => {
                const IconComponent = iconMap[scenario.icon] || Mic;
                return (
                  <div
                    key={scenario.id}
                    className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth"
                  >
                    <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(scenario.id)}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(scenario.id)}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-built Scenarios Section */}
      <Card className="hover:shadow-glass-lg transition-smooth">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Pre-built Scenarios</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Ready-to-use practice sessions organized by category</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="work">
              <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Work</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Professional communication scenarios
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 sm:pt-4">
                  {prebuiltScenarios.work.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleStartScenario(scenario.title)}
                      className="w-full flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth text-left hover:scale-[1.01]"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                        <scenario.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="social">
              <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Social</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Everyday social interactions
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 sm:pt-4">
                  {prebuiltScenarios.social.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleStartScenario(scenario.title)}
                      className="w-full flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth text-left hover:scale-[1.01]"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                        <scenario.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="love">
              <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Love</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Romantic and personal relationships
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 sm:pt-4">
                  {prebuiltScenarios.love.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleStartScenario(scenario.title)}
                      className="w-full flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth text-left hover:scale-[1.01]"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                        <scenario.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Freestyle Practice Button */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 glass-medium backdrop-blur-xl shadow-glass-lg hover:shadow-glass-lg hover:scale-[1.01] transition-smooth">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl glass-light backdrop-blur-md glow-primary animate-glow-pulse flex-shrink-0">
              <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg mb-1">Freestyle Practice</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start an open practice session with your own prompts and topics
              </p>
            </div>
            <Button onClick={handleFreestyle} size="lg" className="gap-2 glow-primary w-full sm:w-auto text-sm sm:text-base">
              <Mic className="h-4 w-4" />
              Start Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
