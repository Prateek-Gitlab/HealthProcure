
"use client";

import { useMemo } from 'react';
import type { ProcurementRequest } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoryPieChartProps {
  requests: ProcurementRequest[];
  title?: string;
  description?: string;
  showApprovedOnly?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const formatCurrency = (value: number) => {
    if (value >= 10000000) { // 1 Crore
        return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) { // 1 Lakh
        return `₹${(value / 100000).toFixed(2)} Lacs`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
}

export function CategoryPieChart({ 
    requests,
    title = "Estimated Approved Cost by Category",
    description = "A breakdown of the total estimated cost of approved requests by procurement category.",
    showApprovedOnly = true
}: CategoryPieChartProps) {
  const chartData = useMemo(() => {
    const relevantRequests = showApprovedOnly ? requests.filter(r => r.status === 'Approved') : requests;

    const dataByCategory = (['HR', 'Infrastructure', 'Equipment', 'Training'] as const).map(category => {
      const categoryCost = relevantRequests
        .filter(req => req.category === category)
        .reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);

      return { name: category, value: categoryCost };
    }).filter(d => d.value > 0);
    
    return dataByCategory;
  }, [requests, showApprovedOnly]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Cost']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No requests with costs to display.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
