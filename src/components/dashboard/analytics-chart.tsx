
"use client";

import { useMemo, useState } from 'react';
import type { ProcurementRequest, User, ProcurementCategory } from '@/lib/data';
import { procurementCategories } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsChartProps {
  requests: ProcurementRequest[];
  allUsers: User[];
  currentUser: User;
  selectedFilterId: string;
  onFilterChange: (id: string) => void;
}

export function AnalyticsChart({ requests, allUsers, currentUser, selectedFilterId, onFilterChange }: AnalyticsChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProcurementCategory | 'all'>('all');

  const isStateUser = currentUser.role === 'state';

  const subordinateDistricts = useMemo(() => {
    if (isStateUser) {
      return allUsers.filter(u => u.role === 'district');
    }
    return [];
  }, [allUsers, isStateUser]);

  const subordinateTalukas = useMemo(() => {
    if (currentUser.role === 'district') {
      return allUsers.filter(u => u.reportsTo === currentUser.id && u.role === 'taluka');
    }
    return [];
  }, [allUsers, currentUser]);

  const chartData = useMemo(() => {
    const approvedRequests = requests.filter(r => r.status === 'Approved');

    if (selectedFilterId === 'all') {
      if (isStateUser) {
        // State user, 'All Districts' view: Show cost per district
        return subordinateDistricts.map(district => {
          const districtSubordinateTalukas = allUsers.filter(u => u.reportsTo === district.id).map(u => u.id);
          const districtSubordinateBases = allUsers.filter(u => districtSubordinateTalukas.includes(u.reportsTo || '')).map(u => u.id);

          const relevantRequests = approvedRequests.filter(req => {
            const submittedByUser = allUsers.find(u => u.id === req.submittedBy);
            if (!submittedByUser) return false;
            const isInCategory = selectedCategory === 'all' || req.category === selectedCategory;
            return isInCategory && districtSubordinateBases.includes(submittedByUser.id);
          });
          const totalCost = relevantRequests.reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);
          return { name: district.name, totalCost };
        });
      } else {
        // District user, 'All Talukas' view: Show cost per taluka
        return subordinateTalukas.map(taluka => {
          const talukaSubordinateBases = allUsers.filter(u => u.reportsTo === taluka.id).map(u => u.id);
          const relevantRequests = approvedRequests.filter(req => {
            const submittedByUser = allUsers.find(u => u.id === req.submittedBy);
            if (!submittedByUser) return false;
            const isInCategory = selectedCategory === 'all' || req.category === selectedCategory;
            return isInCategory && talukaSubordinateBases.includes(submittedByUser.id);
          });
          const totalCost = relevantRequests.reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);
          return { name: taluka.name, totalCost };
        });
      }
    } else {
      // A specific district or taluka is selected
      if (isStateUser) {
        // State user, single district selected: Show cost per category in that district
        const selectedDistrict = allUsers.find(u => u.id === selectedFilterId);
        if (!selectedDistrict) return [];

        const talukasInDistrict = allUsers.filter(u => u.reportsTo === selectedDistrict.id).map(u => u.id);
        const basesInDistrict = allUsers.filter(u => talukasInDistrict.includes(u.reportsTo || '')).map(u => u.id);
        
        const relevantRequests = approvedRequests.filter(req => {
            const submittedByUser = allUsers.find(u => u.id === req.submittedBy);
            return submittedByUser && basesInDistrict.includes(submittedByUser.id);
        });

        return procurementCategories.map(category => {
            const categoryCost = relevantRequests
              .filter(req => req.category === category)
              .reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);
            
            return { name: category, totalCost: categoryCost };
        }).filter(d => d.totalCost > 0);
      } else {
        // District user, single taluka selected: Show cost per category in that taluka
        const talukaUser = allUsers.find(u => u.id === selectedFilterId);
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
          
          return { name: category, totalCost: categoryCost };
        }).filter(d => d.totalCost > 0);
      }
    }
  }, [requests, allUsers, currentUser, selectedCategory, selectedFilterId, subordinateDistricts, subordinateTalukas, isStateUser]);

  if (currentUser.role !== 'district' && currentUser.role !== 'state') {
    return null;
  }
  
  const getSelectedEntityName = () => {
    if (selectedFilterId === 'all') {
        return isStateUser ? 'All Districts' : 'All Talukas';
    }
    return allUsers.find(u => u.id === selectedFilterId)?.name;
  }

  const isSingleEntityView = selectedFilterId !== 'all';
  const isSingleTalukaViewForDistrictUser = !isStateUser && isSingleEntityView;
  const isSingleDistrictViewForStateUser = isStateUser && isSingleEntityView;

  const cardDescription = () => {
    if (isStateUser) {
        if(isSingleEntityView) {
            return `Total cost by category for ${getSelectedEntityName()}`;
        }
        return 'Total cost of approved requests by District.';
    }
    // District user
    if (isSingleEntityView) {
        return `Total cost by category for ${getSelectedEntityName()}`;
    }
    return 'Total cost of approved requests by Taluka.';
  }

  const chartXAxisLabel = isSingleTalukaViewForDistrictUser || isSingleDistrictViewForStateUser 
    ? "Category" 
    : (isStateUser ? "District" : "Taluka");

  const formatIndianCurrencyCompact = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${Number(value).toLocaleString('en-IN')}`;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-gradient">Approved Request Analytics</CardTitle>
            <CardDescription>{cardDescription()}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedFilterId} onValueChange={onFilterChange}>
              <SelectTrigger className="w-[200px] rounded-custom">
                <SelectValue placeholder={isStateUser ? "Select District" : "Select Taluka"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isStateUser ? "All Districts" : "All Talukas"}</SelectItem>
                {(isStateUser ? subordinateDistricts : subordinateTalukas).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as ProcurementCategory | "all")}
              disabled={isSingleTalukaViewForDistrictUser || isSingleDistrictViewForStateUser}
            >
              <SelectTrigger className="w-[200px] rounded-custom">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {procurementCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {chartData.length > 0 ? (
          <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${Number(value).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => [formatIndianCurrencyCompact(Number(value)), "Total Cost"]}
                  cursor={{ fill: "hsl(var(--secondary))" }}
                />
                <Legend />
                <Bar dataKey="totalCost" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Total Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No approved requests match the selected filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
