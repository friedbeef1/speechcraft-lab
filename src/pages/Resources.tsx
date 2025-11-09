import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Lightbulb, MessageCircle, Users, TreePine, Wind, Droplets } from "lucide-react";
import { FlippableResourceCard } from "@/components/FlippableResourceCard";

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const tips = [
    {
      title: "Discussing Climate Science",
      description: "Explain climate data without overwhelming your audience",
      category: "Communication",
      icon: Lightbulb,
      tips: [
        "Use relatable local examples instead of global statistics",
        "Focus on solutions and positive actions, not just problems",
        "Acknowledge emotions and concerns before diving into facts",
        "Use visual aids and analogies to explain complex concepts"
      ]
    },
    {
      title: "Responding to Climate Skepticism",
      description: "Navigate conversations with those who question climate change",
      category: "Advanced",
      icon: MessageCircle,
      tips: [
        "Listen first to understand their specific concerns",
        "Find common ground on shared values like health or economy",
        "Share credible sources without being preachy",
        "Avoid debates; focus on dialogue and understanding"
      ]
    },
    {
      title: "Climate Anxiety Conversations",
      description: "Support others experiencing eco-anxiety and climate grief",
      category: "Emotional Support",
      icon: Wind,
      tips: [
        "Validate their feelings - climate anxiety is a rational response",
        "Balance urgency with hope by discussing tangible solutions",
        "Share resources for climate mental health support",
        "Encourage action as an antidote to helplessness"
      ]
    },
    {
      title: "Talking About Extreme Weather",
      description: "Connect weather events to climate change respectfully",
      category: "Communication",
      icon: Droplets,
      tips: [
        "Show empathy first when discussing disasters affecting communities",
        "Explain the connection between climate and weather patterns",
        "Focus on adaptation and resilience strategies",
        "Avoid saying 'I told you so' - build bridges, not walls"
      ]
    },
    {
      title: "Personal Carbon Footprint Discussions",
      description: "Talk about individual actions without shaming",
      category: "Practical",
      icon: TreePine,
      tips: [
        "Emphasize that systemic change matters more than individual perfection",
        "Share your own journey and struggles, not just successes",
        "Focus on accessible actions that fit different lifestyles",
        "Celebrate small wins and gradual progress"
      ]
    },
    {
      title: "Discussing Climate Policy",
      description: "Engage in political conversations about environmental action",
      category: "Advanced",
      icon: Users,
      tips: [
        "Frame policies by their co-benefits (jobs, health, economy)",
        "Use bipartisan examples of successful climate action",
        "Discuss local and regional impacts of policies",
        "Keep it solution-focused rather than partisan"
      ]
    }
  ];

  const guides = [
    {
      title: "Climate Conversations at Work",
      description: "Navigate sustainability discussions in professional settings",
      category: "Guide",
      icon: BookOpen,
      tips: [
        "Frame sustainability as efficiency, innovation, and risk management",
        "Use business case studies and ROI examples from your industry",
        "Build coalitions with colleagues before formal proposals",
        "Start with small wins to build momentum for bigger changes"
      ]
    },
    {
      title: "Family Climate Discussions",
      description: "Bridge generational divides on environmental issues",
      category: "Guide",
      icon: Users,
      tips: [
        "Find shared family values that connect to climate action",
        "Share stories about how the environment has changed in their lifetime",
        "Focus on legacy - what world do we want for future generations?",
        "Make it practical with family activities like gardening or energy savings"
      ]
    },
    {
      title: "Community Climate Action Guide",
      description: "Organize and mobilize your neighborhood for environmental causes",
      category: "Guide",
      icon: TreePine,
      tips: [
        "Start with issues people can see and feel locally",
        "Create inclusive spaces where all voices are heard",
        "Celebrate community wins and recognize contributors",
        "Connect climate action to local culture and traditions"
      ]
    }
  ];

  const filteredTips = useMemo(() => {
    if (!searchQuery.trim()) return tips;
    const query = searchQuery.toLowerCase();
    return tips.filter(tip => 
      tip.title.toLowerCase().includes(query) ||
      tip.description.toLowerCase().includes(query) ||
      tip.category.toLowerCase().includes(query) ||
      tip.tips.some(t => t.toLowerCase().includes(query))
    );
  }, [searchQuery, tips]);

  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return guides;
    const query = searchQuery.toLowerCase();
    return guides.filter(guide => 
      guide.title.toLowerCase().includes(query) ||
      guide.description.toLowerCase().includes(query) ||
      guide.category.toLowerCase().includes(query) ||
      guide.tips.some(t => t.toLowerCase().includes(query))
    );
  }, [searchQuery, guides]);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Learning Resources
          </h1>
          <p className="text-muted-foreground text-lg">
            Expand your skills with curated guides and insights
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                className="pl-10 glass-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Resources Tabs */}
        <Tabs defaultValue="tips" className="space-y-6">
          <TabsList className="glass-medium">
            <TabsTrigger value="tips">Tips</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTips.map((tip) => (
                <FlippableResourceCard
                  key={tip.title}
                  title={tip.title}
                  description={tip.description}
                  category={tip.category}
                  icon={tip.icon}
                  tips={tip.tips}
                />
              ))}
            </div>
            {filteredTips.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No tips found matching "{searchQuery}"
              </p>
            )}
          </TabsContent>

          <TabsContent value="guides" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide) => (
                <FlippableResourceCard
                  key={guide.title}
                  title={guide.title}
                  description={guide.description}
                  category={guide.category}
                  icon={guide.icon}
                  tips={guide.tips}
                />
              ))}
            </div>
            {filteredGuides.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No guides found matching "{searchQuery}"
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Resources;
