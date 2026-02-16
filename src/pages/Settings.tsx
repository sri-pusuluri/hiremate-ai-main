import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Bell, 
  Shield, 
  Sparkles, 
  Building2,
  Loader2,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { profile, user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Profile settings
  const [fullName, setFullName] = useState(profile?.full_name || '');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [applicationAlerts, setApplicationAlerts] = useState(true);
  const [aiRankingAlerts, setAiRankingAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  
  // AI settings
  const [autoRankEnabled, setAutoRankEnabled] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState('medium');

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Hiresort GenAI
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organization
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-medium text-primary">
                    {fullName?.split(' ').map(n => n[0]).join('') || '?'}
                  </span>
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Application Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new candidates apply
                    </p>
                  </div>
                  <Switch 
                    checked={applicationAlerts} 
                    onCheckedChange={setApplicationAlerts} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Ranking Complete</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when Hiresort GenAI finishes ranking
                    </p>
                  </div>
                  <Switch 
                    checked={aiRankingAlerts} 
                    onCheckedChange={setAiRankingAlerts} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">
                      Summary of hiring activity every Monday
                    </p>
                  </div>
                  <Switch 
                    checked={weeklyDigest} 
                    onCheckedChange={setWeeklyDigest} 
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => toast({ title: 'Preferences Saved' })}>
                  <Check className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-ai-accent" />
                Hiresort GenAI Settings
              </CardTitle>
              <CardDescription>
                Customize how AI assists your hiring process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-rank New Candidates</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically rank candidates when they apply
                    </p>
                  </div>
                  <Switch 
                    checked={autoRankEnabled} 
                    onCheckedChange={setAutoRankEnabled} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Suggestions</p>
                    <p className="text-sm text-muted-foreground">
                      Show AI-powered shortlist suggestions
                    </p>
                  </div>
                  <Switch 
                    checked={aiSuggestions} 
                    onCheckedChange={setAiSuggestions} 
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Confidence Threshold for Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Only show candidates above this match level
                  </p>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((level) => (
                      <Button
                        key={level}
                        variant={confidenceThreshold === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setConfidenceThreshold(level)}
                        className="capitalize"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-ai-surface border border-ai-accent/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-ai-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">AI Ethics & Transparency</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hiresort GenAI is designed to assist, not replace, human decision-making. 
                      All rankings are explainable and overridable. We never auto-reject candidates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => toast({ title: 'AI Settings Saved' })}>
                  <Check className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Organization Settings
                </CardTitle>
                <CardDescription>
                  Manage your organization's global settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      defaultValue="Hiresort Technologies"
                      placeholder="Your organization name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Email Domain</Label>
                    <Input
                      id="domain"
                      defaultValue="hiresort.io"
                      placeholder="company.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only emails from this domain can sign up.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Security Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require Two-Factor Auth</p>
                      <p className="text-sm text-muted-foreground">
                        All users must enable 2FA
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">
                        Auto logout after 8 hours of inactivity
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast({ title: 'Organization Settings Saved' })}>
                    <Check className="w-4 h-4" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
