
"use client";

import { useState, useMemo } from 'react';
import type { ProcurementRequest, User, ProcurementCategory } from '@/lib/data';
import { procurementCategories } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsChartProps {
  requests: ProcurementRequest[];
  allUsers: User[];
  currentUser: User;
}

export function AnalyticsChart({ requests, allUsers, currentUser }: AnalyticsChartProps) {
  const [selectedTaluka, setSelectedTaluka] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<ProcurementCategory | 'all'>('all');

  const subordinateTalukas = useMemo(() => {
    if (currentUser.role === 'state') {
      return allUsers.filter(u => u.role === 'taluka');
    }
    if (currentUser.role === 'district') {
      return allUsers.filter(u => u.reportsTo === currentUser.id && u.role === 'taluka');
    }
    return [];
  }, [allUsers, currentUser]);

  const chartData = useMemo(() => {
    const approvedRequests = requests.filter(r => r.status === 'Approved');

    if (selectedTaluka === 'all') {
      // Logic for 'All Talukas' view
      return subordinateTalukas.map(taluka => {
        const talukaSubordinateBases = allUsers.filter(u => u.reportsTo === taluka.id).map(u => u.id);
        
        const relevantRequests = approvedRequests.filter(req => {
          const submittedByUser = allUsers.find(u => u.id === req.submittedBy);
          if (!submittedByUser) return false;
  
          const isInCategory = selectedCategory === 'all' || req.category === selectedCategory;
          return isInCategory && talukaSubordinateBases.includes(submittedByUser.id);
        });
  
        const totalCost = relevantRequests.reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);
        
        return {
          name: taluka.name,
          totalCost: totalCost,
        };
      });
    } else {
      // Logic for single Taluka view (by category)
      const talukaUser = allUsers.find(u => u.id === selectedTaluka);
      if (!talukaUser) return [];
      
      const talukaSubordinateBases = allUsers.filter(u => u.reportsTo === talukaUser.id).map(u => u.id);
      
      const relevantRequests = approvedRequests.filter(req => {
        const submittedByUser = allUsers.find(u => u.id === req.submittedBy);
        return submittedByUser && talukaSubordinateBases.includes(submittedByUser.id);
      });

      return procurementCategories.map(category => {
        const categoryCost = relevantRequests
          .filter(req => req.category === category)
          .reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);
        
        return {
          name: category,
          totalCost: categoryCost,
        };
      });
    }
  }, [requests, allUsers, currentUser, selectedCategory, selectedTaluka, subordinateTalukas]);

  if (currentUser.role !== 'district' && currentUser.role !== 'state') {
    return null;
  }

  const isSingleTalukaView = selectedTaluka !== 'all';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Approved Request Analytics</CardTitle>
                <CardDescription>
                  {isSingleTalukaView
                    ? `Total cost by category for ${allUsers.find(u => u.id === selectedTaluka)?.name}`
                    : 'Total cost of approved requests by Taluka.'}
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Select value={selectedTaluka} onValueChange={setSelectedTaluka}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Taluka" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Talukas</SelectItem>
                        {subordinateTalukas.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select 
                    value={selectedCategory} 
                    onValueChange={(value) => setSelectedCategory(value as ProcurementCategory | 'all')}
                    disabled={isSingleTalukaView}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {procurementCategories.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="w-full max-w-4xl mx-auto">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${Number(value).toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Total Cost']}
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                />
                <Legend />
                <Bar dataKey="totalCost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">No approved requests match the selected filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
