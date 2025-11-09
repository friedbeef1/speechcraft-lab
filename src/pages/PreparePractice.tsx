import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Pencil, Globe, MapPin, Save, Play, Mic, Briefcase, Users, Heart, Coffee, Phone, Presentation, MessageSquare, UserCheck } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveScenario, StoredScenario } from "@/lib/storage";

// Icon options for scenario creation
const iconOptions = [{
  value: "mic",
  label: "Microphone",
  icon: Mic
}, {
  value: "briefcase",
  label: "Briefcase",
  icon: Briefcase
}, {
  value: "users",
  label: "Users",
  icon: Users
}, {
  value: "heart",
  label: "Heart",
  icon: Heart
}, {
  value: "coffee",
  label: "Coffee",
  icon: Coffee
}, {
  value: "phone",
  label: "Phone",
  icon: Phone
}, {
  value: "presentation",
  label: "Presentation",
  icon: Presentation
}, {
  value: "message",
  label: "Message",
  icon: MessageSquare
}, {
  value: "usercheck",
  label: "User Check",
  icon: UserCheck
}];
interface Prompt {
  id: string;
  text: string;
}

// Sortable prompt item component
function SortablePromptItem({
  prompt,
  onUpdate,
  onDelete
}: {
  prompt: Prompt;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: prompt.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className="flex items-start gap-1 sm:gap-2 group animate-fade-in">
      <button className="mt-2 cursor-grab active:cursor-grabbing p-1 sm:p-2 hover:bg-accent rounded-md transition-colors flex-shrink-0" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
      </button>
      <Textarea value={prompt.text} onChange={e => onUpdate(prompt.id, e.target.value)} placeholder="Enter a speaking prompt..." className="flex-1 min-h-[80px] resize-none text-sm sm:text-base" />
      <Button variant="ghost" size="icon" onClick={() => onDelete(prompt.id)} className="mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
      </Button>
    </div>;
}
const PreparePractice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "freestyle"; // 'freestyle' or 'scenario'
  const isScenarioMode = mode === "scenario";

  // Scenario metadata (only for scenario mode)
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("mic");

  // Prompts list
  const [prompts, setPrompts] = useState<Prompt[]>([{
    id: "1",
    text: ""
  }]);

  // Drag and drop sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      setPrompts(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  const addPrompt = () => {
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      text: ""
    };
    setPrompts([...prompts, newPrompt]);
  };
  const updatePrompt = (id: string, text: string) => {
    setPrompts(prompts.map(p => p.id === id ? {
      ...p,
      text
    } : p));
  };
  const deletePrompt = (id: string) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter(p => p.id !== id));
    } else {
      toast.error("You need at least one prompt");
    }
  };
  const fillWithInspiration = (type: "world" | "local") => {
    const worldNewsPrompts = ["Discuss the impact of rising global temperatures on coastal communities and ecosystems", "Explain your perspective on international climate agreements and their effectiveness", "Share your thoughts on renewable energy transition and its economic implications", "Discuss the role of deforestation in biodiversity loss and climate change", "Talk about ocean acidification and its effects on marine life"];
    const localNewsPrompts = ["Describe environmental challenges facing your local community", "Discuss local sustainability initiatives or green projects you support", "Share your opinion on improving public transportation to reduce emissions", "Talk about local renewable energy adoption and community solar programs", "Discuss waste reduction, recycling efforts, and circular economy in your area"];
    const selectedPrompts = type === "world" ? worldNewsPrompts : localNewsPrompts;
    const newPrompts = selectedPrompts.map((text, index) => ({
      id: Date.now() + index + "",
      text
    }));
    setPrompts(newPrompts);
    toast.success(`Filled with ${type === "world" ? "World" : "Local"} News prompts`);
  };
  const handleStartPractice = () => {
    const filledPrompts = prompts.filter(p => p.text.trim() !== "");
    if (filledPrompts.length === 0) {
      toast.error("Please add at least one prompt");
      return;
    }
    navigate("/session");
  };
  const handleSaveScenario = () => {
    if (!scenarioTitle.trim()) {
      toast.error("Please enter a scenario title");
      return;
    }
    if (!scenarioDescription.trim()) {
      toast.error("Please enter a scenario description");
      return;
    }
    const filledPrompts = prompts.filter(p => p.text.trim() !== "");
    if (filledPrompts.length === 0) {
      toast.error("Please add at least one prompt");
      return;
    }
    const newScenario: StoredScenario = {
      id: Date.now().toString(),
      title: scenarioTitle,
      description: scenarioDescription,
      icon: selectedIcon,
      prompts: filledPrompts,
      createdAt: new Date().toISOString()
    };
    saveScenario(newScenario);
    toast.success("Scenario saved successfully!");
    navigate("/");
  };
  const SelectedIconComponent = iconOptions.find(opt => opt.value === selectedIcon)?.icon || Mic;
  return <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {isScenarioMode ? "Create Scenario" : "Freestyle Practice"}
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          {isScenarioMode ? "Design a custom practice scenario with prompts and details" : "Set up your practice session with custom prompts"}
        </p>
      </div>

      {/* Scenario Metadata (only in scenario mode) */}
      {isScenarioMode && <Card>
          <CardHeader>
            <CardTitle>Scenario Details</CardTitle>
            <CardDescription>Basic information about your practice scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g., Job Interview Practice" value={scenarioTitle} onChange={e => setScenarioTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                  <SelectTrigger id="icon">
                    <SelectValue>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <SelectedIconComponent className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{iconOptions.find(opt => opt.value === selectedIcon)?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(option => <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <option.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{option.label}</span>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief description of what this scenario helps you practice..." value={scenarioDescription} onChange={e => setScenarioDescription(e.target.value)} className="min-h-[80px]" />
            </div>
          </CardContent>
        </Card>}

      {/* Prompts Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <CardTitle>Practice Prompts</CardTitle>
              <CardDescription>Add, edit, and reorder your speaking prompts about the environment</CardDescription>
            </div>
            {!isScenarioMode && <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={() => fillWithInspiration("world")} className="gap-2 w-full sm:w-auto">
                  <Globe className="h-4 w-4" />
                  World News
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillWithInspiration("local")} className="gap-2 w-full sm:w-auto">
                  <MapPin className="h-4 w-4" />
                  Local News
                </Button>
              </div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={prompts.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {prompts.map(prompt => <SortablePromptItem key={prompt.id} prompt={prompt} onUpdate={updatePrompt} onDelete={deletePrompt} />)}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="outline" className="w-full gap-2" onClick={addPrompt}>
            <Plus className="h-4 w-4" />
            Add Another Prompt
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-6 sm:pb-8">
        <Button variant="outline" size="lg" className="flex-1 w-full h-16 text-lg" onClick={() => navigate("/")}>
          Cancel
        </Button>
        {isScenarioMode ? <Button size="lg" className="flex-1 gap-2 w-full h-16 text-lg" onClick={handleSaveScenario}>
            <Save className="h-5 w-5" />
            Save Scenario
          </Button> : <Button size="lg" className="flex-1 gap-2 w-full h-16 text-lg" onClick={handleStartPractice}>
            <Play className="h-5 w-5" />
            Start Practice
          </Button>}
      </div>
    </div>;
};
export default PreparePractice;