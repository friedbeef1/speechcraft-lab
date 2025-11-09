import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, Bell, Shield, Database } from "lucide-react";
const Settings = () => {
  return <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass-medium w-full grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="glass-medium shadow-glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg glass-light">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Profile Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" placeholder="Your name" className="glass-light" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" className="glass-light" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences">
            <Card className="glass-medium shadow-glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg glass-light">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">App Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Practice Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get daily practice reminders
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable audio feedback
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Save Sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save practice sessions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card className="glass-medium shadow-glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg glass-light">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Privacy & Security</CardTitle>
                    <CardDescription>Control your data and privacy</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Share Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app with anonymous usage data
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Recording Storage</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep recordings for review
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pt-4 border-t border-border">
                  <Button variant="outline">Change Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data">
            <Card className="glass-medium shadow-glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg glass-light">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Data Management</CardTitle>
                    <CardDescription>Export or delete your data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Export Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download all your practice sessions and analytics
                    </p>
                    <Button variant="outline">Export All Data</Button>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-2">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* App Info */}
        <Card className="glass-medium shadow-glass">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Speech Coach v4.7.1</p>
              <p className="mt-1">© 2025 All rights reserved</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Settings;