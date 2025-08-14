import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { Save, X, Building2, MessageSquare, Ticket, Wrench } from 'lucide-react';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../../../server/src/schema';

interface CustomerFormProps {
  customer?: Customer;
  onCustomerCreated?: (customer: Customer) => void;
  onCustomerUpdated?: (customer: Customer) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function CustomerForm({
  customer,
  onCustomerCreated,
  onCustomerUpdated,
  onCancel,
  isEditing = false
}: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerInput>({
    company_name: customer?.company_name || '',
    slack_channel: customer?.slack_channel || '',
    zendesk_subdomain: customer?.zendesk_subdomain || null,
    zendesk_api_token: customer?.zendesk_api_token || null,
    zendesk_email: customer?.zendesk_email || null,
    jira_host: customer?.jira_host || null,
    jira_api_token: customer?.jira_api_token || null,
    jira_email: customer?.jira_email || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && customer) {
        const updateData: UpdateCustomerInput = {
          id: customer.id,
          ...formData
        };
        const updatedCustomer = await trpc.updateCustomer.mutate(updateData);
        onCustomerUpdated?.(updatedCustomer);
      } else {
        const newCustomer = await trpc.createCustomer.mutate(formData);
        onCustomerCreated?.(newCustomer);
      }
      onCancel();
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateCustomerInput, value: string) => {
    setFormData((prev: CreateCustomerInput) => ({
      ...prev,
      [field]: value || null
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-gray-200">
        <CardHeader className="bg-blue-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Essential customer details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-sm font-medium">
              Company Name *
            </Label>
            <Input
              id="company_name"
              placeholder="e.g., Acme Corporation"
              value={formData.company_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('company_name', e.target.value)
              }
              required
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slack_channel" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Slack Channel *
            </Label>
            <Input
              id="slack_channel"
              placeholder="e.g., #customer-support"
              value={formData.slack_channel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('slack_channel', e.target.value)
              }
              required
              className="border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Zendesk Integration */}
      <Card className="border-orange-200">
        <CardHeader className="bg-orange-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5 text-orange-600" />
            Zendesk Integration
          </CardTitle>
          <CardDescription>
            Configure Zendesk API access for ticket synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zendesk_subdomain" className="text-sm font-medium">
              Subdomain
            </Label>
            <Input
              id="zendesk_subdomain"
              placeholder="e.g., mycompany (from mycompany.zendesk.com)"
              value={formData.zendesk_subdomain || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('zendesk_subdomain', e.target.value)
              }
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zendesk_email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="zendesk_email"
              type="email"
              placeholder="e.g., admin@company.com"
              value={formData.zendesk_email || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('zendesk_email', e.target.value)
              }
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zendesk_api_token" className="text-sm font-medium">
              API Token
            </Label>
            <Input
              id="zendesk_api_token"
              type="password"
              placeholder="Enter Zendesk API token..."
              value={formData.zendesk_api_token || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('zendesk_api_token', e.target.value)
              }
              className="border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* JIRA Integration */}
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-blue-600" />
            JIRA Integration
          </CardTitle>
          <CardDescription>
            Configure JIRA API access for issue tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jira_host" className="text-sm font-medium">
              JIRA Host
            </Label>
            <Input
              id="jira_host"
              placeholder="e.g., mycompany.atlassian.net"
              value={formData.jira_host || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('jira_host', e.target.value)
              }
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira_email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="jira_email"
              type="email"
              placeholder="e.g., admin@company.com"
              value={formData.jira_email || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('jira_email', e.target.value)
              }
              className="border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jira_api_token" className="text-sm font-medium">
              API Token
            </Label>
            <Input
              id="jira_api_token"
              type="password"
              placeholder="Enter JIRA API token..."
              value={formData.jira_api_token || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFormData('jira_api_token', e.target.value)
              }
              className="border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
}