import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2,
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Mail,
  Calendar,
  MoreVertical,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ClientTenant } from '@/types/hiresort';

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'super_admin' | 'admin' | 'client_admin' | 'recruiter';
  clientId?: string | null;
  clientName?: string | null;
}

export default function UserManagement() {
  const { isAdmin, isSuperAdmin, isClientAdmin, user, client: activeClient } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [clients, setClients] = useState<ClientTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'admin' | 'client_admin' | 'recruiter'>('recruiter');
  const [inviteClientId, setInviteClientId] = useState<string>(activeClient?.id || '00000000-0000-0000-0000-000000000001');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch clients list
      const { data: clientsData } = await supabase.from('clients').select('*');
      const loadedClients: ClientTenant[] = (clientsData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        themeColor: c.theme_color,
      }));
      setClients(loadedClients);

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        const userClientId = (userRole as any)?.client_id;
        const matchedClient = loadedClients.find(c => c.id === userClientId);

        const isRootAdmin = profile.email === 'admin@hiremate.ai' || userRole?.role === 'super_admin';
        const role = ((userRole?.role as any) || (isRootAdmin ? 'super_admin' : 'recruiter'));
        const isPlatformLevel = isRootAdmin || (role === 'admin' && !userClientId);

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          role,
          clientId: isPlatformLevel ? null : (userClientId || '00000000-0000-0000-0000-000000000001'),
          clientName: isPlatformLevel ? 'HireSort Platform' : (matchedClient?.name || 'Zool'),
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClient = async (userId: string, targetClientId: string) => {
    try {
      const targetClient = clients.find(c => c.id === targetClientId);
      const { error } = await supabase
        .from('user_roles')
        .update({ client_id: targetClientId } as any)
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, clientId: targetClientId, clientName: targetClient?.name || 'Zool' } : u
      ));

      toast({
        title: 'Workspace Assigned',
        description: `Assigned user to ${targetClient?.name || 'client'} workspace`,
      });
    } catch (err: any) {
      toast({
        title: 'Assignment Failed',
        description: err.message || 'Could not assign workspace.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'recruiter') => {
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins can change user roles',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map((u) => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Role Updated',
        description: `User role changed to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast({ title: 'Error', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    setIsInviting(true);
    try {
      const targetClientId = inviteRole === 'admin'
        ? null
        : (isSuperAdmin ? inviteClientId : (activeClient?.id || '00000000-0000-0000-0000-000000000001'));
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, role: inviteRole, clientId: targetClientId }
      });

      if (error) {
        // Supabase functions invoke returns a FunctionsHttpError on non-2xx, 
        // we can try to extract the real error message from the response if available.
        let errorMessage = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errBody = await error.context.json();
            if (errBody.error) errorMessage = errBody.error;
          }
        } catch (e) {}
        throw new Error(errorMessage);
      }

      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('recruiter');
      
      // Refresh the user list
      fetchUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Invitation Failed',
        description: error.message || 'Could not send invitation. They might already exist.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };
  const handleResendInvite = async (email: string, role: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, role }
      });
      
      if (error) {
        let errorMessage = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errBody = await error.context.json();
            if (errBody.error) errorMessage = errBody.error;
          }
        } catch (e) {}
        throw new Error(errorMessage);
      }
      toast({
        title: 'Invitation Resent',
        description: `A new invitation email was sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error resending invite:', error);
      toast({
        title: 'Resend Failed',
        description: error.message || 'Could not resend invitation. The user may have already completed signup.',
        variant: 'destructive',
      });
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset=true`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Password Reset Sent',
        description: `A password reset email has been sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: 'Failed to send reset email',
        description: error.message || 'An error occurred while sending the password reset email.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === 'admin@hiremate.ai') {
      toast({
        title: 'Action Prohibited',
        description: 'The root HireSort platform administrator account cannot be removed.',
        variant: 'destructive',
      });
      return;
    }

    if (userId === user?.id) {
      toast({
        title: 'Action Prohibited',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to completely remove ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      let functionSuccess = false;
      try {
        const { error } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });
        if (!error) functionSuccess = true;
      } catch (e) {
        functionSuccess = false;
      }

      // If edge function not active or returns error (e.g. mock mode or un-deployed edge function), delete profile & roles directly
      if (!functionSuccess) {
        await supabase.from('user_roles').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
      }
      
      toast({
        title: 'User Removed',
        description: `${email} has been removed.`,
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Could not remove the user.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    // If platform super admin
    if (isSuperAdmin) {
      if (selectedTenantFilter === 'platform') {
        if (u.clientId !== null) return false;
      } else if (selectedTenantFilter !== 'all') {
        if (u.clientId !== selectedTenantFilter) return false;
      }
    } else {
      // If client admin / recruiter, strictly isolate to their own company workspace!
      // They can never see HireSort platform admins or other client users.
      if (!activeClient?.id || u.clientId !== activeClient.id) {
        return false;
      }
    }

    // If role filter is applied
    if (roleFilter !== 'all' && u.role !== roleFilter) {
      return false;
    }

    return (
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!isAdmin && !isClientAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access user management. Only workspace administrators can view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
            {activeClient && (
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5 font-medium">
                <Building2 className="w-3 h-3 mr-1" />
                {isSuperAdmin ? 'Platform SuperAdmin (All Tenants)' : activeClient.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? 'Manage platform-wide team members across all enterprise client tenants'
              : `Manage team members, roles, and recruiting permissions for ${activeClient?.name || 'this workspace'}`}
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team. They'll receive an email with signup instructions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="client_admin">Client Admin</SelectItem>
                    {isSuperAdmin && <SelectItem value="admin">Platform Admin</SelectItem>}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Client Admins can manage workspace branding and team members. Recruiters manage jobs and candidates.
                </p>
              </div>

              {isSuperAdmin ? (
                clients.length > 0 && (
                  <div className="space-y-2">
                    <Label>Assign to Client Workspace</Label>
                    <Select value={inviteClientId} onValueChange={(v) => setInviteClientId(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              ) : (
                activeClient && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Assigned Workspace:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      {activeClient.name}
                    </span>
                  </div>
                )
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={isInviting}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={isInviting}>
                {isInviting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-ai-surface flex items-center justify-center">
                <Shield className="w-6 h-6 text-ai-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'recruiter').length}</p>
                <p className="text-sm text-muted-foreground">Recruiters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Workspace Filters */}
      <Card className="mb-6 border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tenant Filter for Platform Super Admins */}
            {isSuperAdmin && clients.length > 0 && (
              <div className="w-full sm:w-64 shrink-0">
                <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    <SelectValue placeholder="All Workspaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workspaces (Platform & Tenants)</SelectItem>
                    <SelectItem value="platform">HireSort Platform Team</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Role Filter */}
            <div className="w-full sm:w-44 shrink-0">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Platform Admin</SelectItem>
                  <SelectItem value="client_admin">Client Admin</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All users in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div 
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {u.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{u.full_name || 'Unknown'}</p>
                        {u.id === user?.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Workspace Tag */}
                    <Badge variant="outline" className="text-xs font-normal border-border flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-primary" />
                      {u.clientName || 'Zool'}
                    </Badge>

                    {/* Role Tag */}
                    <Badge 
                      variant={u.role === 'admin' || u.role === 'super_admin' ? 'default' : 'secondary'}
                      className={u.role === 'admin' || u.role === 'super_admin' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {u.role === 'client_admin' ? 'Client Admin' : u.role}
                    </Badge>
                    
                    {u.email === 'admin@hiremate.ai' ? (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        Platform Owner
                      </Badge>
                    ) : u.id === user?.id ? (
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                        Active Account
                      </Badge>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'recruiter' : 'admin')}
                          >
                            Change to {u.role === 'admin' ? 'Recruiter' : 'Admin'}
                          </DropdownMenuItem>

                          {/* Assign Workspace Submenu - only for platform super admins */}
                          {isSuperAdmin && clients.length > 0 && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Building2 className="w-4 h-4 mr-2" />
                                Assign Workspace
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {clients.map((c) => (
                                  <DropdownMenuItem 
                                    key={c.id} 
                                    onClick={() => handleAssignClient(u.id, c.id)}
                                  >
                                    {c.name} {u.clientId === c.id ? '✓' : ''}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleResendInvite(u.email || '', u.role)}
                          >
                            Resend Invitation
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSendPasswordReset(u.email || '')}
                          >
                            Send Password Reset
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(u.id, u.email || '')}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
