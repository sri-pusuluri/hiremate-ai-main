import { useState, useRef, useEffect } from 'react';
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
  Briefcase,
  UploadCloud,
  Terminal,
  ArrowRight,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockJobs, mockCandidates } from '@/data/mockData';
import samplePayload from '../../samples/ats_import_payload.json';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [mockMode, setMockMode] = useState(() => localStorage.getItem('use_mock_supabase') === 'true');

  // AI Provider settings
  const [aiProvider, setAiProvider] = useState(localStorage.getItem('ai_provider') || 'openai');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_api_key') || (import.meta.env.VITE_OPENAI_API_KEY as string) || '');
  const [claudeKey, setClaudeKey] = useState(localStorage.getItem('claude_api_key') || (import.meta.env.VITE_CLAUDE_API_KEY as string) || '');
  const [selectedGeminiModel, setSelectedGeminiModel] = useState(localStorage.getItem('gemini_model') || 'gemini-1.5-pro');
  const [selectedOpenAIModel, setSelectedOpenAIModel] = useState(localStorage.getItem('openai_model') || 'gpt-4o');
  const [selectedClaudeModel, setSelectedClaudeModel] = useState(localStorage.getItem('claude_model') || 'claude-3-5-sonnet-latest');

  // ATS Ingest Simulator settings
  const [simulatingIngest, setSimulatingIngest] = useState(false);
  const [ingestLogs, setIngestLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPayloadFile, setSelectedPayloadFile] = useState<File | null>(null);
  const [payloadData, setPayloadData] = useState<any>(null);

  // AI Costing Logs state
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchAiLogs = async () => {
    setLoadingLogs(true);
    const useMock = localStorage.getItem('use_mock_supabase') === 'true';
    if (useMock) {
      const logsStr = localStorage.getItem('hiremate_ai_analysis_logs') || '[]';
      try {
        setAiLogs(JSON.parse(logsStr).reverse());
      } catch (err) {
        setAiLogs([]);
      }
      setLoadingLogs(false);
    } else {
      try {
        const { data, error } = await supabase
          .from('ai_analysis_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error("Error fetching AI logs:", error);
        } else {
          setAiLogs(data || []);
        }
      } catch (err) {
        console.error("Fetch AI logs exception:", err);
      } finally {
        setLoadingLogs(false);
      }
    }
  };

  useEffect(() => {
    fetchAiLogs();
  }, [mockMode]);

  const handlePayloadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPayloadFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setPayloadData(parsed);
        } catch (err) {
          toast({
            title: "Parsing Error",
            description: "Selected file is not a valid JSON document.",
            variant: "destructive"
          });
          setSelectedPayloadFile(null);
          setPayloadData(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTriggerATS = async () => {
    if (!payloadData || !payloadData.jobs || !payloadData.candidates) {
      toast({
        title: "Validation Error",
        description: "Please select a valid ATS Webhook JSON payload file to import.",
        variant: "destructive"
      });
      return;
    }

    setSimulatingIngest(true);
    setIngestLogs([]);

    const log = (msg: string) => {
      setIngestLogs(prev => [...prev, msg]);
    };

    try {
      log("🔄 [WebHook] Incoming Webhook import request received...");
      await new Promise(resolve => setTimeout(resolve, 800));

      const importedJobs = payloadData.jobs;
      const importedCandidates = payloadData.candidates;

      log(`📂 [Payload] Found ${importedJobs.length} job(s) and ${importedCandidates.length} candidate(s) to import.`);
      await new Promise(resolve => setTimeout(resolve, 800));

      // 1. Process and Insert/Upsert Jobs
      for (const job of importedJobs) {
        log(`💼 [Jobs] Upserting Job listing: "${job.title}" (ID: ${job.id})...`);
        const { error: jobError } = await supabase
          .from('jobs')
          .upsert({
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            salary: job.salary,
            description: job.description,
            requirements: job.requirements || [],
            responsibilities: job.responsibilities || [],
            hire_sort_enabled: false,
            ai_processing_status: 'pending'
          });

        if (jobError) throw jobError;
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      log("✅ [Jobs] All jobs ingested successfully!");
      await new Promise(resolve => setTimeout(resolve, 600));

      // 2. Process Candidates
      for (let i = 0; i < importedCandidates.length; i++) {
        const cand = importedCandidates[i];
        log(`\n👤 [Candidates] Ingesting candidate ${i+1}/${importedCandidates.length}: "${cand.full_name}"...`);

        // Check for existing Candidate
        const { data: existingCand } = await supabase
          .from('candidates')
          .select('id')
          .eq('email', cand.email)
          .eq('job_id', cand.job_id)
          .maybeSingle();

        let candData = existingCand;

        if (!existingCand) {
          const { data: newCand, error: dbError } = await supabase
            .from('candidates')
            .insert({
              job_id: cand.job_id,
              full_name: cand.full_name,
              email: cand.email,
              experience: cand.experience || 0,
              ai_score: 'medium'
            })
            .select()
            .single();

          if (dbError) throw dbError;
          candData = newCand;
          log(`💾 New Candidate saved with ID: ${candData.id}`);
        } else {
          log(`⏭️ Candidate ${cand.email} already exists, skipping insert.`);
        }
        
        if (!candData) continue;
        
        await new Promise(resolve => setTimeout(resolve, 400));

        // Invoke Edge Function
        log(`⚡ Invoking ingest-resume Edge Function to calculate embeddings...`);
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('ingest-resume', {
          body: {
            candidateId: candData.id,
            resumeText: cand.resume_text,
            jobId: cand.job_id
          }
        });

        if (edgeError) {
          console.warn("Edge function invocation failed, falling back to simulated analysis:", edgeError);
          log(`⚠️ Edge Function Error: ${edgeError.message || "Connection refused"}. Running local fallback...`);
          await new Promise(resolve => setTimeout(resolve, 800));

          // Fallback update
          await supabase.from('candidates').update({
            resume_text: cand.resume_text,
            ai_score: i % 2 === 0 ? 'high' : 'medium',
            cosine_similarity: i % 2 === 0 ? 0.89 : 0.62,
            predictive_insights: {
              interviewPassProb: i % 2 === 0 ? 92 : 68,
              offerAcceptanceProb: 80,
              retentionRisk: 'low',
              assessment: `Candidate ${cand.full_name} processed in Demo Mode (no API key configured).`
            }
          }).eq('id', candData.id);
        } else {
          log(`📐 Cosine similarity & predictive insights updated successfully!`);
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }

      log("\n🎉 [Success] ATS Webhook simulation complete! All jobs and candidates are populated.");
      toast({
        title: "Import Successful",
        description: `Imported ${importedJobs.length} Jobs and ${importedCandidates.length} Candidates.`
      });
    } catch (err: any) {
      console.error("Import failed:", err);
      log(`❌ [Error] Ingestion failed: ${err.message || err}`);
      toast({
        title: "Import Failed",
        description: err.message || "An error occurred during import.",
        variant: "destructive"
      });
    } finally {
      setSimulatingIngest(false);
    }
  };

  const [clearingDb, setClearingDb] = useState(false);

  const handleClearDatabase = async () => {
    if (!window.confirm("Are you sure you want to reset the database? This will clear the imported jobs (Full Stack Developer and Marketing Manager) and restore the 3 default ranked jobs.")) {
      return;
    }
    setClearingDb(true);
    try {
      // 1. Delete candidates belonging to last 2 jobs
      const lastTwoJobIds = ['e98c56c2-0731-482a-bc91-236b2f42a11b', 'f87b45b1-0620-471a-ab80-125a1e31a00a'];
      await supabase
        .from('candidates')
        .delete()
        .in('job_id', lastTwoJobIds);

      // 2. Delete last 2 jobs
      await supabase
        .from('jobs')
        .delete()
        .in('id', lastTwoJobIds);

      // 3. Ensure first 3 jobs exist and are ranked complete
      const firstThreeJobs = samplePayload.jobs.slice(0, 3);
      for (const job of firstThreeJobs) {
        await supabase
          .from('jobs')
          .upsert({
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            salary: job.salary,
            description: job.description,
            requirements: job.requirements || [],
            responsibilities: job.responsibilities || [],
            nice_to_have: job.niceToHave || [],
            hire_sort_enabled: true,
            ai_processing_status: 'complete',
            last_ranked_at: new Date().toISOString()
          });
      }

      // 4. Ensure candidates for first 3 jobs exist and are scored
      const firstThreeCandidates = samplePayload.candidates.filter(c => 
        c.job_id === '11111111-1111-1111-1111-111111111111' ||
        c.job_id === '22222222-2222-2222-2222-222222222222' ||
        c.job_id === '33333333-3333-3333-3333-333333333333'
      );

      for (const cand of firstThreeCandidates) {
        let score = 'medium';
        let similarity = 0.65;
        if (cand.full_name.includes('Priya') || cand.full_name.includes('David') || cand.full_name.includes('Elena')) {
          score = 'high';
          similarity = 0.88;
        } else if (cand.full_name.includes('Amit') || cand.full_name.includes('Sofia') || cand.full_name.includes('Hiroshi')) {
          score = 'low';
          similarity = 0.42;
        }

        await supabase
          .from('candidates')
          .upsert({
            job_id: cand.job_id,
            full_name: cand.full_name,
            email: cand.email,
            experience: cand.experience || 0,
            ai_score: score,
            cosine_similarity: similarity,
            resume_text: cand.resume_text,
            skills: cand.resume_text.match(/Skills: (.*)/)?.[1]?.split(', ') || [],
            matched_skills: cand.resume_text.match(/Skills: (.*)/)?.[1]?.split(', ')?.slice(0, 3) || [],
            predictive_insights: {
              interviewPassProb: score === 'high' ? 92 : (score === 'medium' ? 78 : 45),
              offerAcceptanceProb: score === 'high' ? 88 : (score === 'medium' ? 70 : 50),
              onboardingSuccessProb: score === 'high' ? 95 : (score === 'medium' ? 82 : 60),
              retentionRisk: score === 'high' ? 'low' : (score === 'medium' ? 'medium' : 'high'),
              retentionRiskFactor: score === 'high' ? 'Stable 3+ year average tenure' : 'Previous short tenure',
              timeToJoinEstimate: score === 'high' ? '15 days' : '30 days',
              assessment: `${cand.full_name} has strong experience alignment for this position. Mapped skills match job requirements.`
            }
          });
      }

      toast({
        title: "Database Reset Completed",
        description: "Cleared ATS sync data. Restored the 3 default ranked jobs with candidate records."
      });
      setSelectedPayloadFile(null);
      setPayloadData(null);
    } catch (err: any) {
      console.error("Reset database failed:", err);
      toast({
        title: "Reset Failed",
        description: err.message || "Failed to reset database.",
        variant: "destructive"
      });
    } finally {
      setClearingDb(false);
    }
  };

  const handleSaveAISettings = () => {
    localStorage.setItem('ai_provider', aiProvider);
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('claude_api_key', claudeKey);
    localStorage.setItem('gemini_model', selectedGeminiModel);
    localStorage.setItem('openai_model', selectedOpenAIModel);
    localStorage.setItem('claude_model', selectedClaudeModel);
    toast({
      title: 'AI Settings Saved',
      description: 'Your API preferences, models, and keys have been updated.',
    });
  };

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
          <TabsTrigger value="ats" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            ATS Ingest Simulator
          </TabsTrigger>
          <TabsTrigger value="ai-logs" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            AI Costing & Logs
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
                    <p className="font-medium">Sandbox Mode (Mock Database)</p>
                    <p className="text-sm text-muted-foreground">
                      Run in offline sandbox mode (local storage) instead of cloud Supabase
                    </p>
                  </div>
                  <Switch
                    checked={mockMode}
                    onCheckedChange={(checked) => {
                      setMockMode(checked);
                      if (checked) {
                        localStorage.setItem('use_mock_supabase', 'true');
                      } else {
                        localStorage.removeItem('use_mock_supabase');
                      }
                      toast({
                        title: checked ? "Sandbox Mode Enabled" : "Cloud Supabase Enabled",
                        description: checked ? "The app will now read/write locally." : "The app will query your live Supabase database.",
                      });
                    }}
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

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">AI Engine & API Keys</h3>

                  <div className="space-y-2">
                    <Label htmlFor="aiProvider">Select AI Provider</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'gemini', name: 'Google Gemini' },
                        { id: 'openai', name: 'OpenAI (ChatGPT)' },
                        { id: 'claude', name: 'Anthropic Claude' }
                      ].map((prov) => (
                        <Button
                          key={prov.id}
                          variant={aiProvider === prov.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAiProvider(prov.id)}
                          type="button"
                        >
                          {prov.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {aiProvider === 'gemini' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="geminiModel">Gemini Model</Label>
                        <select
                          id="geminiModel"
                          value={selectedGeminiModel}
                          onChange={(e) => setSelectedGeminiModel(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="gemini-1.5-pro">gemini-1.5-pro (Flagship reasoning)</option>
                          <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & lightweight)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="geminiKey">Gemini API Key</Label>
                        <Input
                          id="geminiKey"
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="Enter Google Gemini API Key"
                        />
                      </div>
                    </div>
                  )}

                  {aiProvider === 'openai' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="openaiModel">OpenAI Model</Label>
                        <select
                          id="openaiModel"
                          value={selectedOpenAIModel}
                          onChange={(e) => setSelectedOpenAIModel(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="gpt-5.6-sol">gpt-5.6-sol (Sol - Flagship Reasoning)</option>
                          <option value="gpt-5.6-terra">gpt-5.6-terra (Terra - Balanced)</option>
                          <option value="gpt-5.6-luna">gpt-5.6-luna (Luna - Cost-efficient)</option>
                          <option value="gpt-4o">gpt-4o (Legacy Flagship)</option>
                          <option value="gpt-4o-mini">gpt-4o-mini (Fast & lightweight)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="openaiKey">OpenAI API Key</Label>
                        <Input
                          id="openaiKey"
                          type="password"
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder="Enter OpenAI API Key (sk-...)"
                        />
                      </div>
                    </div>
                  )}

                  {aiProvider === 'claude' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="claudeModel">Claude Model</Label>
                        <select
                          id="claudeModel"
                          value={selectedClaudeModel}
                          onChange={(e) => setSelectedClaudeModel(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest (Flagship reasoning)</option>
                          <option value="claude-3-5-haiku-latest">claude-3-5-haiku-latest (Fast & lightweight)</option>
                          <option value="claude-3-opus-latest">claude-3-opus-latest (Complex analysis)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claudeKey">Anthropic Claude API Key</Label>
                        <Input
                          id="claudeKey"
                          type="password"
                          value={claudeKey}
                          onChange={(e) => setClaudeKey(e.target.value)}
                          placeholder="Enter Anthropic API Key"
                        />
                      </div>
                    </div>
                  )}
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
                <Button onClick={handleSaveAISettings}>
                  <Check className="w-4 h-4 mr-2" />
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

        {/* ATS Ingest Simulator Tab */}
        <TabsContent value="ats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                ATS Webhook Import Simulator
              </CardTitle>
              <CardDescription>
                Upload an external ATS webhook payload (JSON) to automatically register new active jobs and their applied candidate applicants at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide">
                  <Terminal className="w-4 h-4" />
                  Your Webhook Endpoint URL
                </div>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="https://api.hiresort.com/v1/ats/webhook/ingest?token=hs_live_948f93"
                    className="font-mono text-xs bg-card"
                  />
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText("https://api.hiresort.com/v1/ats/webhook/ingest?token=hs_live_948f93");
                    toast({ title: "Copied", description: "Webhook URL copied to clipboard." });
                  }}>Copy</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send a POST request with the candidate resume file & job title metadata to process applications programmatically.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Upload Webhook Import Payload</h3>
                
                <div 
                  className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-card cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePayloadFileChange}
                    className="hidden"
                    accept=".json"
                  />
                  <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    {selectedPayloadFile ? selectedPayloadFile.name : "Select ATS Webhook Payload (JSON)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPayloadFile ? `${(selectedPayloadFile.size / 1024).toFixed(2)} KB` : "Select a valid import JSON document"}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" type="button">
                    {selectedPayloadFile ? "Change File" : "Choose File"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-3 italic text-center max-w-md">
                    Tip: Select the template payload from the project's samples directory: <br />
                    <code className="text-primary font-mono bg-muted px-1.5 py-0.5 rounded font-bold">samples/ats_import_payload.json</code>
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={simulatingIngest ? undefined : handleTriggerATS}
                    disabled={simulatingIngest || !payloadData}
                    className="flex-1"
                    type="button"
                  >
                    {simulatingIngest ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing ATS webhook import...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Trigger Programmatic ATS Import Webhook
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={clearingDb ? undefined : handleClearDatabase}
                    disabled={clearingDb || simulatingIngest}
                    variant="destructive"
                    type="button"
                  >
                    {clearingDb ? "Clearing..." : "Clear Database"}
                  </Button>
                </div>
              </div>

              {ingestLogs.length > 0 && (
                <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-lg space-y-1.5 max-h-60 overflow-y-auto border border-slate-800">
                  {ingestLogs.map((log, index) => (
                    <div key={index} className="animate-fade-in">{log}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>AI Costing & Audit Logs</CardTitle>
                <CardDescription>
                  Audit token usage, costs, input prompts, and outputs for each candidate ranking.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAiLogs} 
                  disabled={loadingLogs}
                >
                  {loadingLogs ? "Loading..." : "Refresh Logs"}
                </Button>
                <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary">
                  Total Cost: ${aiLogs.reduce((acc, curr) => acc + (curr.input_cost_usd || 0) + (curr.output_cost_usd || 0), 0).toFixed(4)} USD
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  <Coins className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="font-semibold text-foreground">No AI Costing Logs Found</p>
                  <p className="text-sm mt-1">Run candidate ranking scan to log dynamic cost tracking parameters.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr className="text-xs text-muted-foreground font-semibold">
                        <th className="text-left px-4 py-3">Candidate</th>
                        <th className="text-left px-4 py-3">Model</th>
                        <th className="text-left px-4 py-3">Tokens (In / Out)</th>
                        <th className="text-left px-4 py-3">Cost (USD)</th>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-left px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {aiLogs.map((log, idx) => {
                        const totalCost = (log.input_cost_usd || 0) + (log.output_cost_usd || 0);
                        return (
                          <tr key={log.id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-foreground">
                              {log.candidate_name}
                            </td>
                            <td className="px-4 py-3.5 text-xs">
                              <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase mr-1.5">
                                {log.provider}
                              </span>
                              <span className="font-mono text-foreground">{log.model_name}</span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                              {log.input_tokens.toLocaleString()} / {log.output_tokens.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-emerald-500 tabular-nums">
                              ${totalCost.toFixed(6)}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 font-semibold text-primary hover:text-primary-hover"
                                onClick={() => setSelectedLog(log)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Log Detail Modal */}
              {selectedLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                  <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-in">
                    <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
                      <div>
                        <CardTitle className="text-xl">Costing Audit Log Details</CardTitle>
                        <CardDescription className="mt-1">
                          Candidate: <strong className="text-foreground">{selectedLog.candidate_name}</strong> | Model: <strong className="text-foreground">{selectedLog.model_name} ({selectedLog.provider})</strong>
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground font-bold text-lg"
                        onClick={() => setSelectedLog(null)}
                      >
                        ✕
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6 py-4">
                      {/* Summary Badges */}
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="bg-muted p-2.5 rounded-lg border">
                          <p className="text-xs text-muted-foreground font-medium">Input Tokens</p>
                          <p className="text-lg font-bold font-mono mt-0.5">{selectedLog.input_tokens.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted p-2.5 rounded-lg border">
                          <p className="text-xs text-muted-foreground font-medium">Output Tokens</p>
                          <p className="text-lg font-bold font-mono mt-0.5">{selectedLog.output_tokens.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted p-2.5 rounded-lg border">
                          <p className="text-xs text-muted-foreground font-medium">Input Cost (USD)</p>
                          <p className="text-lg font-bold text-emerald-500 font-mono mt-0.5">${selectedLog.input_cost_usd.toFixed(6)}</p>
                        </div>
                        <div className="bg-muted p-2.5 rounded-lg border">
                          <p className="text-xs text-muted-foreground font-medium">Output Cost (USD)</p>
                          <p className="text-lg font-bold text-emerald-500 font-mono mt-0.5">${selectedLog.output_cost_usd.toFixed(6)}</p>
                        </div>
                      </div>

                      {/* Tracked Content / Prompt Analyzed */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Terminal className="w-4 h-4 text-primary" />
                            1. Analyzed Prompt (Tracked Input Content)
                          </h4>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs font-semibold"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedLog.analyzed_prompt);
                              toast({ title: "Copied", description: "Prompt copied to clipboard." });
                            }}
                          >
                            Copy Prompt
                          </Button>
                        </div>
                        <div className="bg-slate-950 text-slate-300 font-mono text-xs p-4 rounded-lg border border-slate-800 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                          {selectedLog.analyzed_prompt}
                        </div>
                      </div>

                      {/* Output Received */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-ai-accent" />
                            2. Output Received (JSON Response)
                          </h4>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs font-semibold"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(selectedLog.output_received, null, 2));
                              toast({ title: "Copied", description: "JSON output copied to clipboard." });
                            }}
                          >
                            Copy JSON
                          </Button>
                        </div>
                        <pre className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-lg border border-slate-800 max-h-60 overflow-y-auto shadow-inner">
                          {JSON.stringify(selectedLog.output_received, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                    <div className="border-t p-4 flex justify-end bg-muted/30">
                      <Button onClick={() => setSelectedLog(null)} className="font-semibold">
                        Close Audit Log
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
