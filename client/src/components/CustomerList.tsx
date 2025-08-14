import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, MessageSquare, Calendar, ExternalLink } from 'lucide-react';
import type { Customer } from '../../../server/src/schema';

interface CustomerListProps {
  customers: Customer[];
  isLoading: boolean;
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer: Customer | null;
}

export function CustomerList({
  customers,
  isLoading,
  onCustomerSelect,
  selectedCustomer
}: CustomerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Get started by adding your first customer. You can track their Zendesk tickets 
              and JIRA issues all in one place.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Customer Directory
          </CardTitle>
          <CardDescription>
            {customers.length} customer{customers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
      </Card>

      {customers.map((customer: Customer) => (
        <Card
          key={customer.id}
          className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg transition-all duration-200 hover:shadow-xl cursor-pointer ${
            selectedCustomer?.id === customer.id
              ? 'ring-2 ring-blue-400 bg-blue-50/30'
              : 'hover:bg-white/90'
          }`}
          onClick={() => onCustomerSelect(customer)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {customer.company_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{customer.slack_channel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {customer.created_at.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {customer.zendesk_subdomain && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      📎 Zendesk
                    </Badge>
                  )}
                  {customer.jira_host && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      🎯 JIRA
                    </Badge>
                  )}
                  {!customer.zendesk_subdomain && !customer.jira_host && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600">
                      No integrations
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant={selectedCustomer?.id === customer.id ? 'default' : 'outline'}
                  size="sm"
                  className={
                    selectedCustomer?.id === customer.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      : ''
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}