import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users, Mic, Coffee, MessageSquare, Pencil, Recycle, Leaf, Sprout, Home, Bike, ShoppingBag, TreePine } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { getScenarios, deleteScenario, StoredScenario } from "@/lib/storage";

// Map icon strings to components
const iconMap: Record<string, React.ElementType> = {
  mic: Mic,
  users: Users,
  coffee: Coffee,
  message: MessageSquare,
  recycle: Recycle,
  leaf: Leaf,
  sprout: Sprout,
  home: Home,
  bike: Bike,
  shopping: ShoppingBag,
  tree: TreePine
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
  neighborhood: [{
    id: "neighborhood-1",
    icon: Sprout,
    title: "Backyard Composting",
    description: "Your neighbor is curious about your compost bin. You both have different approaches to reducing food waste but love swapping tips!"
  }, {
    id: "neighborhood-2",
    icon: Users,
    title: "Carpool Plans",
    description: "Chatting over the fence about organizing a neighborhood carpool. Different schedules but everyone wants to reduce emissions together"
  }, {
    id: "neighborhood-3",
    icon: TreePine,
    title: "Community Garden",
    description: "Discussing starting a shared garden space. You prefer different veggies but both excited about local growing!"
  }],
  friends: [{
    id: "friends-1",
    icon: ShoppingBag,
    title: "Eco Product Debate",
    description: "Friendly discussion about best reusable products - metal straws vs bamboo? Everyone has their favorites!"
  }, {
    id: "friends-2",
    icon: Bike,
    title: "Green Weekend Trip",
    description: "Planning a sustainable weekend adventure. Camping vs biking vs train travel - lots of fun options to explore together"
  }, {
    id: "friends-3",
    icon: Recycle,
    title: "Waste Reduction Tips",
    description: "Swapping household tips over coffee. Different approaches to reducing plastic, but all making positive changes"
  }],
  workBreak: [{
    id: "work-1",
    icon: Bike,
    title: "Biking to Work",
    description: "Water cooler chat about commute options. Some bike, some bus, some carpool - comparing experiences and tips"
  }, {
    id: "work-2",
    icon: Recycle,
    title: "Office Recycling",
    description: "Discussing how to improve workplace sustainability. Different ideas but everyone wants to help!"
  }, {
    id: "work-3",
    icon: Coffee,
    title: "Lunch Container Choices",
    description: "Chatting about reusable containers and meal prep. Everyone has different systems that work for them"
  }]
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
  return <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Practice Scenarios</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          Choose a scenario to practice or create your own custom session
        </p>
      </div>

      {/* Pre-built Scenarios Section */}
      <Card className="hover:shadow-glass-lg transition-smooth">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Pre-built Scenarios</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Ready-to-use practice sessions organized by category</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="neighborhood">
              <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                    <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Neighborhood Chats</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Climate conversations with your neighbors
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 sm:pt-4">
                  {prebuiltScenarios.neighborhood.map(scenario => <button key={scenario.id} onClick={() => handleStartScenario(scenario.title)} className="w-full flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth text-left hover:scale-[1.01]">
                      <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                        <scenario.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                      </div>
                    </button>)}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="friends">
              <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Friend Hangouts</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Relaxed environmental discussions
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 sm:pt-4">
                  {prebuiltScenarios.friends.map(scenario => <button key={scenario.id} onClick={() => handleStartScenario(scenario.title)} className="w-full flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth text-left hover:scale-[1.01]">
                      <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                        <scenario.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                      </div>
                    </button>)}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="workBreak">
              <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                    <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base">Work Break Chats</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Casual climate topics at the office
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2 sm:pt-4">
                  {prebuiltScenarios.workBreak.map(scenario => <button key={scenario.id} onClick={() => handleStartScenario(scenario.title)} className="w-full flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth text-left hover:scale-[1.01]">
                      <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                        <scenario.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                      </div>
                    </button>)}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* My Scenarios Section */}
      <Card className="hover:shadow-glass-lg transition-smooth">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">My Scenarios</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Custom scenarios you've created</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="gap-2 glow-primary w-full sm:w-auto text-sm">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {userScenarios.length === 0 ? <div className="text-center py-8 sm:py-12 border-2 border-dashed border-border/50 rounded-lg glass-ultralight backdrop-blur-md px-3">
              <Pencil className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4 animate-float" />
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">No scenarios yet</h3>
              <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm">
                Create your first custom scenario to start practicing
              </p>
              
            </div> : <div className="space-y-3">
              {userScenarios.map(scenario => {
            const IconComponent = iconMap[scenario.icon] || Mic;
            return <div key={scenario.id} className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 glass-ultralight backdrop-blur-md hover:glass-light hover:shadow-glass transition-smooth">
                    <div className="p-1.5 sm:p-2 rounded-lg glass-medium backdrop-blur-md flex-shrink-0">
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 text-sm sm:text-base">{scenario.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(scenario.id)} className="h-8 w-8 sm:h-9 sm:w-9">
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(scenario.id)} className="h-8 w-8 sm:h-9 sm:w-9">
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>;
          })}
            </div>}
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
              <h3 className="font-semibold text-base sm:text-lg mb-1 text-foreground">Freestyle Practice</h3>
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
    </div>;
};
export default Index;