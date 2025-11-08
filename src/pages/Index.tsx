import { useState } from "react";
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

// Types
interface Scenario {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

interface UserScenario extends Scenario {
  createdAt: Date;
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
  const [userScenarios, setUserScenarios] = useState<UserScenario[]>([]);

  const handleCreateNew = () => {
    navigate("/prepare?mode=scenario");
  };

  const handleEdit = (id: string) => {
    toast.info(`Editing scenario ${id}`);
  };

  const handleDelete = (id: string) => {
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Practice Scenarios</h1>
        <p className="text-muted-foreground text-lg">
          Choose a scenario to practice or create your own custom session
        </p>
      </div>

      {/* Your Scenarios Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Scenarios</CardTitle>
              <CardDescription>Custom scenarios you've created</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {userScenarios.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scenarios yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom scenario to start practicing
              </p>
              <Button onClick={handleCreateNew} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Scenario
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <scenario.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-1">{scenario.title}</h4>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(scenario.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(scenario.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-built Scenarios Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-built Scenarios</CardTitle>
          <CardDescription>Ready-to-use practice sessions organized by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="work">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Work</div>
                    <div className="text-sm text-muted-foreground">
                      Professional communication scenarios
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-4">
                  {prebuiltScenarios.work.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleStartScenario(scenario.title)}
                      className="w-full flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-accent">
                        <scenario.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1">{scenario.title}</h4>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="social">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/50">
                    <Users className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Social</div>
                    <div className="text-sm text-muted-foreground">
                      Everyday social interactions
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-4">
                  {prebuiltScenarios.social.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleStartScenario(scenario.title)}
                      className="w-full flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-accent">
                        <scenario.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1">{scenario.title}</h4>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="love">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Heart className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Love</div>
                    <div className="text-sm text-muted-foreground">
                      Romantic and personal relationships
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-4">
                  {prebuiltScenarios.love.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleStartScenario(scenario.title)}
                      className="w-full flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <div className="p-2 rounded-lg bg-accent">
                        <scenario.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1">{scenario.title}</h4>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
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
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Freestyle Practice</h3>
              <p className="text-sm text-muted-foreground">
                Start an open practice session with your own prompts and topics
              </p>
            </div>
            <Button onClick={handleFreestyle} size="lg" className="gap-2">
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
