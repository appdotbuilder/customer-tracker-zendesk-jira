import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CustomerForm } from './CustomerForm';
import { useState } from 'react';
import { 
  Building2, 
  MessageSquare, 
  Calendar, 
  Edit, 
  Ticket, 
  Wrench,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Customer } from '../../../server/src/schema';

interface CustomerDetailsProps {
  customer: Customer;
  onCustomerUpdated: (customer: Customer) => void;
}

export function CustomerDetails({ customer, onCustomerUpdated }: CustomerDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState({ zendesk: false, jira: false });

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => setIsEditing(false);

  const handleSync = async (type: 'zendesk' | 'jira') => {
    setIsSyncing(prev => ({ ...prev, [type]: true }));
    try {
      if (type === 'zendesk') {
        await trpc.syncZendeskTickets.mutate({ id: customer.id });
      } else {
        await trpc.syncJiraIssues.mutate({ id: customer.id });
      }
    } catch (error) {
      console.error(`Failed to sync ${type}:`, error);
    } finally {
      setIsSyncing(prev => ({ ...prev, [type]: false }));
    }
  };

  if (isEditing) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Customer Details
          </CardTitle>
          <CardDescription>
            Update customer information and integration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <CustomerForm
            customer={customer}
            onCustomerUpdated={onCustomerUpdated}
            onCancel={handleCancelEdit}
            isEditing={true}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Overview */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {customer.company_name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <MessageSquare className="h-4 w-4" />
                {customer.slack_channel}
              </CardDescription>
            </div>
            <Button onClick={handleEdit} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Basic Information</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Company Name</span>
                  <p className="font-medium">{customer.company_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Slack Channel</span>
                  <p className="font-medium">{customer.slack_channel}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created</span>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {customer.created_at.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Integration Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Zendesk</span>
                  </div>
                  {customer.zendesk_subdomain ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not configured
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">JIRA</span>
                  </div>
                  {customer.jira_host ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not configured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Details */}
      {(customer.zendesk_subdomain || customer.jira_host) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zendesk Integration */}
          {customer.zendesk_subdomain && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg border-orange-200">
              <CardHeader className="bg-orange-50/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ticket className="h-5 w-5 text-orange-600" />
                  Zendesk Integration
                </CardTitle>
                <CardDescription>
                  Connected to Zendesk for ticket management
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Subdomain</span>
                    <p className="font-medium">{customer.zendesk_subdomain}</p>
                  </div>
                  {customer.zendesk_email && (
                    <div>
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="font-medium">{customer.zendesk_email}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500">API Token</span>
                    <p className="font-medium">••••••••••••</p>
                  </div>
                  <Separator />
                  <Button
                    onClick={() => handleSync('zendesk')}
                    disabled={isSyncing.zendesk}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing.zendesk ? 'animate-spin' : ''}`} />
                    {isSyncing.zendesk ? 'Syncing...' : 'Sync Tickets'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* JIRA Integration */}
          {customer.jira_host && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg border-blue-200">
              <CardHeader className="bg-blue-50/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  JIRA Integration
                </CardTitle>
                <CardDescription>
                  Connected to JIRA for issue tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Host</span>
                    <p className="font-medium">{customer.jira_host}</p>
                  </div>
                  {customer.jira_email && (
                    <div>
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="font-medium">{customer.jira_email}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500">API Token</span>
                    <p className="font-medium">••••••••••••</p>
                  </div>
                  <Separator />
                  <Button
                    onClick={() => handleSync('jira')}
                    disabled={isSyncing.jira}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing.jira ? 'animate-spin' : ''}`} />
                    {isSyncing.jira ? 'Syncing...' : 'Sync Issues'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Configuration Needed */}
      {!customer.zendesk_subdomain && !customer.jira_host && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg border-yellow-200">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                <Wrench className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Integration Setup Required</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Configure Zendesk and JIRA integrations to start tracking tickets and issues 
                for this customer.
              </p>
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Configure Integrations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}