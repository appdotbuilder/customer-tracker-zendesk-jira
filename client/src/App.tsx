import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CustomerForm } from './components/CustomerForm';
import { CustomerList } from './components/CustomerList';
import { CustomerDetails } from './components/CustomerDetails';
import { DailyDifferences } from './components/DailyDifferences';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Building2, Users, Activity, Calendar } from 'lucide-react';
import type { Customer } from '../../server/src/schema';

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getCustomers.query();
      setCustomers(result);
      setFilteredCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    try {
      const results = await trpc.searchCustomers.query({ query: query.trim() });
      setFilteredCustomers(results);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to client-side filtering
      const filtered = customers.filter((customer: Customer) =>
        customer.company_name.toLowerCase().includes(query.toLowerCase()) ||
        customer.slack_channel.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customers]);

  const handleCustomerCreated = useCallback((newCustomer: Customer) => {
    setCustomers((prev: Customer[]) => [...prev, newCustomer]);
    setFilteredCustomers((prev: Customer[]) => [...prev, newCustomer]);
    setShowAddForm(false);
  }, []);

  const handleCustomerUpdated = useCallback((updatedCustomer: Customer) => {
    setCustomers((prev: Customer[]) =>
      prev.map((c: Customer) => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
    setFilteredCustomers((prev: Customer[]) =>
      prev.map((c: Customer) => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
    if (selectedCustomer && selectedCustomer.id === updatedCustomer.id) {
      setSelectedCustomer(updatedCustomer);
    }
  }, [selectedCustomer]);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('details');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Customer Tracker 🚀
                </h1>
                <p className="text-sm text-gray-600">Manage customers, Zendesk tickets, and JIRA issues</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Users className="h-3 w-3 mr-1" />
                {customers.length} Customers
              </Badge>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="customers" className="data-[state=active]:bg-white">
              <Building2 className="h-4 w-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedCustomer} className="data-[state=active]:bg-white">
              <Users className="h-4 w-4 mr-2" />
              Customer Details
            </TabsTrigger>
            <TabsTrigger value="tickets" disabled={!selectedCustomer} className="data-[state=active]:bg-white">
              <Activity className="h-4 w-4 mr-2" />
              Tickets & Issues
            </TabsTrigger>
            <TabsTrigger value="differences" disabled={!selectedCustomer} className="data-[state=active]:bg-white">
              <Calendar className="h-4 w-4 mr-2" />
              Daily Changes
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Customers
                </CardTitle>
                <CardDescription>
                  Search by company name or Slack channel to find customers quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    className="pl-10 bg-white border-gray-200 focus:border-blue-400"
                  />
                </div>
              </CardContent>
            </Card>

            <CustomerList
              customers={filteredCustomers}
              isLoading={isLoading}
              onCustomerSelect={handleCustomerSelect}
              selectedCustomer={selectedCustomer}
            />
          </TabsContent>

          {/* Customer Details Tab */}
          <TabsContent value="details">
            {selectedCustomer && (
              <CustomerDetails
                customer={selectedCustomer}
                onCustomerUpdated={handleCustomerUpdated}
              />
            )}
          </TabsContent>

          {/* Tickets & Issues Tab */}
          <TabsContent value="tickets">
            {selectedCustomer && (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <span>📎 Zendesk Tickets & 🎯 JIRA Issues</span>
                      <Badge variant="outline" className="bg-white">
                        {selectedCustomer.company_name}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      All current tickets and issues for this customer
                    </CardDescription>
                  </CardHeader>
                </Card>
                {/* Tickets and Issues components will be rendered here */}
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Tickets and issues will be displayed here once the backend handlers are implemented.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Daily Differences Tab */}
          <TabsContent value="differences">
            {selectedCustomer && (
              <DailyDifferences customerId={selectedCustomer.id} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Customer
              </CardTitle>
              <CardDescription>
                Create a new customer profile with integration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <CustomerForm
                onCustomerCreated={handleCustomerCreated}
                onCancel={() => setShowAddForm(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default App;