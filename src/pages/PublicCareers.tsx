import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Job, ClientTenant } from '@/types/hiresort';
import { DEFAULT_ZOOL_CLIENT } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  MapPin, 
  Briefcase, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  CheckCircle,
  ExternalLink 
} from 'lucide-react';

export default function PublicCareers() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const { pathname } = useLocation();
  const slug = clientSlug || 'zool';
  const isEmbedMode = pathname.startsWith('/embed');

  const [client, setClient] = useState<ClientTenant>(DEFAULT_ZOOL_CLIENT);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  useEffect(() => {
    async function loadCareers() {
      try {
        setLoading(true);
        // 1. Fetch Client Tenant
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (clientData) {
          setClient({
            id: (clientData as any).id,
            name: (clientData as any).name,
            slug: (clientData as any).slug,
            logoUrl: (clientData as any).logo_url,
            themeColor: (clientData as any).theme_color || '#2563eb',
            subscriptionTier: (clientData as any).subscription_tier || 'pro',
          });
        } else {
          setClient({
            ...DEFAULT_ZOOL_CLIENT,
            name: slug.charAt(0).toUpperCase() + slug.slice(1),
            slug: slug,
          });
        }

        // 2. Fetch Public Jobs
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (jobsData && jobsData.length > 0) {
          const mapped: Job[] = jobsData.map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || 'General',
            location: j.location || 'Remote',
            type: j.type || 'full-time',
            salary: j.salary,
            description: j.description,
            responsibilities: j.responsibilities || [],
            requirements: j.requirements || [],
            niceToHave: j.nice_to_have || [],
            postedDate: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : '2026-02-01',
            candidateCount: 0,
            isPublic: true,
            slug: j.slug || j.id,
          }));
          setJobs(mapped);
        } else {
          // Fallback demo public jobs
          setJobs([
            {
              id: 'demo-1',
              title: 'Senior Frontend Engineer',
              department: 'Engineering',
              location: 'Bangalore, India (Hybrid)',
              type: 'full-time',
              salary: '₹30-45 LPA',
              description: 'Own our high-scale web products with React 18, TypeScript, and modern UI engineering.',
              postedDate: '2026-02-15',
              candidateCount: 14,
              isPublic: true,
              slug: 'senior-frontend-engineer',
            },
            {
              id: 'demo-2',
              title: 'Product Manager - AI Platform',
              department: 'Product',
              location: 'Remote / Bangalore',
              type: 'full-time',
              salary: '₹28-40 LPA',
              description: 'Drive generative AI features and predictive matching capabilities for our enterprise customers.',
              postedDate: '2026-02-18',
              candidateCount: 22,
              isPublic: true,
              slug: 'product-manager-ai',
            },
            {
              id: 'demo-3',
              title: 'Talent Acquisition Specialist',
              department: 'Human Resources',
              location: 'Bangalore, India',
              type: 'full-time',
              salary: '₹14-20 LPA',
              description: 'Lead candidate outreach, interviews, and partner directly with hiring managers.',
              postedDate: '2026-02-22',
              candidateCount: 9,
              isPublic: true,
              slug: 'talent-acquisition-specialist',
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading public careers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCareers();
  }, [slug]);

  const departments = Array.from(new Set(jobs.map(j => j.department)));

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || j.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className={isEmbedMode ? "bg-background text-foreground flex flex-col p-4 font-sans" : "min-h-screen bg-background text-foreground flex flex-col"}>
      {/* Header: Compact Widget in Embed Mode vs Full Brand Hero Header */}
      {isEmbedMode ? (
        <header className="pb-4 mb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" 
              style={{ backgroundColor: client.themeColor || '#2563eb' }}
            />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
                Careers at {client.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {jobs.length} open position{jobs.length === 1 ? '' : 's'} available
              </p>
            </div>
          </div>
          <a 
            href={`/careers/${slug}`} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-muted/60 px-2.5 py-1.5 rounded-md border border-border"
          >
            <span>Full Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </header>
      ) : (
        <header 
          className="relative border-b border-border py-16 px-6 overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${client.themeColor || '#2563eb'}22 0%, transparent 70%)`
          }}
        >
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/80 backdrop-blur shadow-sm">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: client.themeColor || '#2563eb' }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Careers at {client.name}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Build the future with us.
            </h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We are hiring ambitious innovators, engineers, and creators. Explore open roles and join our team.
            </p>

            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Fast-Track AI Screening
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Competitive Compensation
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Remote & Hybrid Flexibility
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Main Jobs Listing */}
      <main className={isEmbedMode ? "w-full flex-1 space-y-5" : "max-w-4xl mx-auto w-full px-6 py-10 flex-1 space-y-8"}>
        {/* Search & Dept Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title, skills, or location..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedDept === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDept('all')}
              className="rounded-lg text-xs"
            >
              All Roles ({jobs.length})
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept}
                variant={selectedDept === dept ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDept(dept)}
                className="rounded-lg text-xs shrink-0"
              >
                {dept}
              </Button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            <span>Open Opportunities ({filteredJobs.length})</span>
            <span>Powered by HireSort AI</span>
          </div>

          {filteredJobs.map((job) => (
            <Link 
              key={job.id} 
              to={`/careers/${client.slug}/${job.slug || job.id}`}
              target={isEmbedMode ? "_blank" : undefined}
              rel={isEmbedMode ? "noopener noreferrer" : undefined}
              className="block group"
            >
              <Card className="border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card">
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs capitalize font-medium">
                        {job.type}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="font-semibold text-foreground">
                          {job.salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground/80">
                        <Calendar className="w-3.5 h-3.5" />
                        Posted {job.postedDate}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button 
                      className="group-hover:bg-primary group-hover:text-primary-foreground gap-1.5"
                    >
                      Apply Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filteredJobs.length === 0 && !loading && (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold">No open roles found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for another keyword or department filter.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer (hidden in embed mode for clean host integration) */}
      {!isEmbedMode && (
        <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground mt-auto bg-muted/20">
          <p>© {new Date().getFullYear()} {client.name}. Powered by HireSortAi Multi-Tenant ATS.</p>
        </footer>
      )}
    </div>
  );
}
