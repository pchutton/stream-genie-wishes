import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Edit2, Save, AlertTriangle, RefreshCw, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface StreamingMapping {
  id: string;
  channel: string;
  platforms: string[];
  category: string | null;
  is_verified: boolean;
  report_count: number;
  last_updated: string;
  notes: string | null;
}

export default function StreamingMappings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [mappings, setMappings] = useState<StreamingMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlatforms, setEditPlatforms] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unverified' | 'flagged'>('all');

  const fetchMappings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('streaming_mappings')
      .select('*')
      .order('report_count', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading mappings',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMappings(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const startEdit = (mapping: StreamingMapping) => {
    setEditingId(mapping.id);
    setEditPlatforms(mapping.platforms.join(', '));
    setEditNotes(mapping.notes || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPlatforms('');
    setEditNotes('');
  };

  const saveEdit = async (id: string) => {
    setIsSaving(true);
    
    const platforms = editPlatforms
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (platforms.length === 0) {
      toast({
        title: 'Invalid platforms',
        description: 'Please enter at least one platform',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('streaming_mappings')
      .update({
        platforms,
        notes: editNotes || null,
        last_updated: new Date().toISOString(),
        is_verified: true, // Re-verify after manual edit
        report_count: 0,   // Reset report count after fix
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error saving',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Mapping updated',
        description: 'Changes saved successfully',
      });
      setEditingId(null);
      fetchMappings();
    }
    setIsSaving(false);
  };

  const toggleVerified = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('streaming_mappings')
      .update({ 
        is_verified: !currentValue,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMappings(prev => 
        prev.map(m => m.id === id ? { ...m, is_verified: !currentValue } : m)
      );
    }
  };

  const resetReportCount = async (id: string) => {
    const { error } = await supabase
      .from('streaming_mappings')
      .update({ 
        report_count: 0,
        is_verified: true,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error resetting',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Report count reset' });
      fetchMappings();
    }
  };

  const filteredMappings = mappings.filter(m => {
    if (filter === 'unverified') return !m.is_verified;
    if (filter === 'flagged') return m.report_count > 0;
    return true;
  });

  const stats = {
    total: mappings.length,
    unverified: mappings.filter(m => !m.is_verified).length,
    flagged: mappings.filter(m => m.report_count > 0).length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You must be logged in to access this page.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Streaming Mappings</h1>
              <p className="text-sm text-muted-foreground">Manage channel to platform mappings</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMappings} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card 
            className={cn("cursor-pointer transition-colors", filter === 'all' && "ring-2 ring-primary")}
            onClick={() => setFilter('all')}
          >
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Mappings</p>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-colors", filter === 'unverified' && "ring-2 ring-orange-500")}
            onClick={() => setFilter('unverified')}
          >
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.unverified}</p>
              <p className="text-xs text-muted-foreground">Unverified</p>
            </CardContent>
          </Card>
          <Card 
            className={cn("cursor-pointer transition-colors", filter === 'flagged' && "ring-2 ring-red-500")}
            onClick={() => setFilter('flagged')}
          >
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.flagged}</p>
              <p className="text-xs text-muted-foreground">Flagged by Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Mappings List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredMappings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No mappings found for this filter.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMappings.map((mapping) => (
              <Card 
                key={mapping.id} 
                className={cn(
                  "transition-all",
                  !mapping.is_verified && "border-orange-500/50 bg-orange-500/5",
                  mapping.report_count >= 5 && "border-red-500/50 bg-red-500/5"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Channel info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{mapping.channel}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {mapping.category || 'general'}
                        </Badge>
                        {mapping.report_count > 0 && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <Flag className="h-3 w-3" />
                            {mapping.report_count} reports
                          </Badge>
                        )}
                      </div>

                      {editingId === mapping.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editPlatforms}
                            onChange={(e) => setEditPlatforms(e.target.value)}
                            placeholder="Platforms (comma-separated)"
                            className="text-sm"
                          />
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {mapping.platforms.map((platform, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                          {mapping.notes && (
                            <p className="text-xs text-muted-foreground italic">{mapping.notes}</p>
                          )}
                        </>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {formatDistanceToNow(new Date(mapping.last_updated), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Verified toggle */}
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={mapping.is_verified}
                          onCheckedChange={() => toggleVerified(mapping.id, mapping.is_verified)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <span className="text-xs text-muted-foreground">
                          {mapping.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>

                      {/* Edit/Save buttons */}
                      {editingId === mapping.id ? (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            onClick={() => saveEdit(mapping.id)}
                            disabled={isSaving}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={cancelEdit}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => startEdit(mapping)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {mapping.report_count > 0 && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => resetReportCount(mapping.id)}
                              title="Reset report count"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
