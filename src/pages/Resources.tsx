import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Video, FileText, Lightbulb } from "lucide-react";

const Resources = () => {
  const tips = [
    {
      title: "Active Listening",
      description: "Learn to truly hear what others are saying and respond thoughtfully",
      category: "Communication",
      icon: Lightbulb,
    },
    {
      title: "Body Language",
      description: "Master non-verbal cues to enhance your message",
      category: "Presence",
      icon: Lightbulb,
    },
    {
      title: "Difficult Conversations",
      description: "Navigate challenging discussions with confidence",
      category: "Advanced",
      icon: Lightbulb,
    },
  ];

  const guides = [
    {
      title: "Workplace Communication Guide",
      description: "Complete guide to professional conversations and meetings",
      type: "Guide",
      icon: BookOpen,
    },
    {
      title: "Social Confidence Builder",
      description: "Step-by-step approach to improving social interactions",
      type: "Guide",
      icon: BookOpen,
    },
    {
      title: "Relationship Communication",
      description: "Strengthen personal connections through better dialogue",
      type: "Guide",
      icon: BookOpen,
    },
  ];

  const articles = [
    {
      title: "The Power of Pausing",
      description: "Why taking a moment before speaking can transform conversations",
      readTime: "5 min read",
      icon: FileText,
    },
    {
      title: "Empathy in Action",
      description: "Practical techniques for showing you understand",
      readTime: "7 min read",
      icon: FileText,
    },
    {
      title: "Overcoming Speaking Anxiety",
      description: "Evidence-based strategies to reduce nervousness",
      readTime: "6 min read",
      icon: FileText,
    },
  ];

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
              />
            </div>
          </div>
        </div>

        {/* Resources Tabs */}
        <Tabs defaultValue="tips" className="space-y-6">
          <TabsList className="glass-medium">
            <TabsTrigger value="tips">Tips</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tips.map((tip) => (
                <Card
                  key={tip.title}
                  className="glass-medium shadow-glass hover:glass-light transition-smooth cursor-pointer"
                >
                  <CardHeader>
                    <div className="p-3 rounded-lg glass-light w-fit mb-4">
                      <tip.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-foreground">{tip.title}</CardTitle>
                    <CardDescription>{tip.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary">{tip.category}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guides" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Card
                  key={guide.title}
                  className="glass-medium shadow-glass hover:glass-light transition-smooth cursor-pointer"
                >
                  <CardHeader>
                    <div className="p-3 rounded-lg glass-light w-fit mb-4">
                      <guide.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-foreground">{guide.title}</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary">{guide.type}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="articles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card
                  key={article.title}
                  className="glass-medium shadow-glass hover:glass-light transition-smooth cursor-pointer"
                >
                  <CardHeader>
                    <div className="p-3 rounded-lg glass-light w-fit mb-4">
                      <article.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-foreground">{article.title}</CardTitle>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-muted-foreground">{article.readTime}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Resources;
