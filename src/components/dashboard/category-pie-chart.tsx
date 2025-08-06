
"use client";

import { useMemo } from 'react';
import type { ProcurementRequest, ProcurementCategory } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoryPieChartProps {
  requests: ProcurementRequest[];
  title?: string;
  description?: string;
  showApprovedOnly?: boolean;
}

/**
 * Use the same palette mapping as Approved Items list by category.
 * Map categories deterministically to colors so state/district views align.
 */
const CATEGORY_COLORS: Record<ProcurementCategory, string> = {
  // Slightly darker for better visibility, matching ~400 range tints
  HR: '#34d399',             // emerald-400
  Infrastructure: '#fbbf24', // amber-400
  Equipment: '#60a5fa',      // blue-400
  Training: '#fb923c',       // orange-400
};
// For fallback in case category order changes unexpectedly
const DEFAULT_COLORS = ['#60a5fa', '#10b981', '#f59e0b', '#f97316'];

const formatCurrency = (value: number) => {
    if (value >= 10000000) { // 1 Crore
        return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) { // 1 Lakh
        return `₹${(value / 100000).toFixed(2)} L`;
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

    const orderedCategories = ['HR', 'Infrastructure', 'Equipment', 'Training'] as const;
    const dataByCategory = orderedCategories.map(category => {
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
        <CardTitle className="text-gradient">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
                {chartData.map((entry, index) => {
                  const key = entry.name as ProcurementCategory;
                  const fill = CATEGORY_COLORS[key] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value as number), 'Cost']}
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
