
"use client";

import { useMemo } from 'react';
import type { ProcurementRequest } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoryPieChartProps {
  requests: ProcurementRequest[];
  title?: string;
  description?: string;
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
    description = "A breakdown of the total estimated cost of approved requests by procurement category."
}: CategoryPieChartProps) {
  const chartData = useMemo(() => {
    const approvedRequests = requests.filter(r => r.status === 'Approved');

    const dataByCategory = (['HR', 'Infrastructure', 'Equipment', 'Training'] as const).map(category => {
      const categoryCost = approvedRequests
        .filter(req => req.category === category)
        .reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);

      return { name: category, value: categoryCost };
    }).filter(d => d.value > 0);
    
    return dataByCategory;
  }, [requests]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
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
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">No approved requests with costs to display.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
