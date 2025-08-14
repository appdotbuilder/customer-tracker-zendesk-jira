import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Ticket, 
  Wrench, 
  Plus, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { DailyDifferences as DailyDifferencesType } from '../../../server/src/schema';

interface DailyDifferencesProps {
  customerId: number;
}

export function DailyDifferences({ customerId }: DailyDifferencesProps) {
  const [differences, setDifferences] = useState<DailyDifferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const loadDifferences = useCallback(async (date?: string) => {
    setIsLoading(true);
    try {
      const result = await trpc.getDailyDifferences.query({
        customer_id: customerId,
        date: date || selectedDate
      });
      setDifferences(result);
    } catch (error) {
      console.error('Failed to load daily differences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, selectedDate]);

  useEffect(() => {
    loadDifferences();
  }, [loadDifferences]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadDifferences(date);
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'status_changed':
        return 'bg-yellow-100 text-yellow-800';
      case 'assignee_changed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'new':
        return <Plus className="h-3 w-3" />;
      case 'updated':
        return <RefreshCw className="h-3 w-3" />;
      case 'status_changed':
        return <ArrowRight className="h-3 w-3" />;
      case 'assignee_changed':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Changes Report
          </CardTitle>
          <CardDescription>
            View changes in Zendesk tickets and JIRA issues for a specific date
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-selector">Select Date</Label>
              <Input
                id="date-selector"
                type="date"
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
                className="w-fit"
              />
            </div>
            <Button
              onClick={() => loadDifferences()}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : differences ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zendesk Differences */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg border-orange-200">
            <CardHeader className="bg-orange-50/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-orange-600" />
                  Zendesk Tickets
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {differences.zendesk_differences.length} changes
                </Badge>
              </CardTitle>
              <CardDescription>
                Changes in Zendesk tickets for {new Date(differences.date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {differences.zendesk_differences.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes</h3>
                  <p className="text-gray-500">
                    No Zendesk ticket changes detected for this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {differences.zendesk_differences.map((diff, index) => (
                    <Card key={index} className="border border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {diff.subject}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              by {diff.requester}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {diff.last_update.toLocaleDateString()}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={getChangeTypeColor(diff.change_type)}
                          >
                            {getChangeTypeIcon(diff.change_type)}
                            <span className="ml-1 capitalize">{diff.change_type.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        {diff.change_type === 'status_changed' && diff.previous_status && (
                          <div className="flex items-center gap-2 text-sm mb-3">
                            <Badge variant="outline" className="bg-gray-50">
                              {diff.previous_status}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {diff.current_status}
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            #{diff.ticket_id}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(diff.ticket_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* JIRA Differences */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg border-blue-200">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  JIRA Issues
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {differences.jira_differences.length} changes
                </Badge>
              </CardTitle>
              <CardDescription>
                Changes in JIRA issues for {new Date(differences.date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {differences.jira_differences.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes</h3>
                  <p className="text-gray-500">
                    No JIRA issue changes detected for this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {differences.jira_differences.map((diff, index) => (
                    <Card key={index} className="border border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {diff.summary}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {diff.project}
                              </Badge>
                              {diff.assignee && (
                                <span>→ {diff.assignee}</span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={getChangeTypeColor(diff.change_type)}
                          >
                            {getChangeTypeIcon(diff.change_type)}
                            <span className="ml-1 capitalize">{diff.change_type.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        {(diff.change_type === 'status_changed' || diff.change_type === 'assignee_changed') && 
                         diff.previous_status && (
                          <div className="flex items-center gap-2 text-sm mb-3">
                            <Badge variant="outline" className="bg-gray-50">
                              {diff.previous_status}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {diff.current_status}
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs font-mono">
                            {diff.issue_key}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(diff.issue_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Unable to load daily differences for the selected date. This might be due to 
                incomplete backend implementation or missing snapshots.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}