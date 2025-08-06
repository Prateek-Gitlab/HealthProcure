
"use client";

import { useMemo } from 'react';
import type { ProcurementRequest, User, ProcurementCategory, Role } from '@/lib/data';
import { useHierarchy } from '@/hooks/use-hierarchy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { generateDistrictPdf } from '@/lib/pdf-generator';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';


interface ApprovedItemsTableProps {
  requests: ProcurementRequest[];
  currentUser: User;
}

interface AggregatedItem {
  itemName: string;
  totalQuantity: number;
  totalCost: number;
}

export type AggregatedData = Record<ProcurementCategory, AggregatedItem[]>;

const getTitleAndDescription = (role: Role) => {
    if (role === 'state') {
        return {
            title: "State-wide Approved Items",
            description: "A summary of all approved items across the entire state."
        }
    }
    // Default to District
    return {
        title: "Approved Items Summary",
        description: "A summary of all approved items within the district"
    }
}

const categoryColors: Record<ProcurementCategory, string> = {
  Equipment: "from-chart-4/10 to-chart-4/5",
  HR: "from-chart-2/10 to-chart-2/5",
  Infrastructure: "from-chart-3/10 to-chart-3/5",
  Training: "from-chart-5/10 to-chart-5/5",
};

export function ApprovedItemsTable({ requests, currentUser }: ApprovedItemsTableProps) {
  const { getSubordinateIds } = useHierarchy();
  const { allUsers } = useAuth();


  const subordinateIds = useMemo(() => {
    return getSubordinateIds(currentUser.id);
  }, [currentUser.id, getSubordinateIds]);

  const aggregatedData: AggregatedData = useMemo(() => {
    const approvedRequests = requests.filter(r => 
      r.status === 'Approved' && 
      (subordinateIds.includes(r.submittedBy) || r.submittedBy === currentUser.id)
    );

    const itemsMap = new Map<string, AggregatedItem & { category: ProcurementCategory }>();

    approvedRequests.forEach(request => {
      const existingItem = itemsMap.get(request.itemName);
      const cost = (request.pricePerUnit || 0) * request.quantity;

      if (existingItem) {
        existingItem.totalQuantity += request.quantity;
        existingItem.totalCost += cost;
      } else {
        itemsMap.set(request.itemName, {
          itemName: request.itemName,
          totalQuantity: request.quantity,
          totalCost: cost,
          category: request.category,
        });
      }
    });
    
    const allItems = Array.from(itemsMap.values());
    
    return allItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push({
            itemName: item.itemName,
            totalQuantity: item.totalQuantity,
            totalCost: item.totalCost
        });
        // Sort items within category by total cost
        acc[item.category].sort((a, b) => b.totalCost - a.totalCost);
        return acc;
    }, {} as AggregatedData);


  }, [requests, currentUser.id, subordinateIds]);

  const aggregatedCategories = Object.keys(aggregatedData) as ProcurementCategory[];

  const { title, description } = getTitleAndDescription(currentUser.role);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                {description}
                </CardDescription>
            </div>
            {currentUser.role === 'district' && (
                <Button 
                    variant="outline"
                    onClick={() => generateDistrictPdf(requests, allUsers, currentUser)}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF Report
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-full max-h-96">
            {aggregatedCategories.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2" defaultValue={aggregatedCategories}>
                    {aggregatedCategories.map((category) => (
                      <AccordionItem
                        value={category}
                        key={category}
                        className={cn("border rounded-md bg-gradient-to-br", `from-card to-muted/50`)}
                      >
                        <AccordionTrigger
                          className={cn(
                            "p-4 text-base font-medium hover:no-underline bg-gradient-to-r rounded-t-md",
                            `from-transparent to-transparent`,
                            currentUser.role === "state" || currentUser.role === "district"
                              ? `bg-gradient-to-r ${categoryColors[category]}`
                              : ""
                          )}
                        >
                          {category}
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t bg-card">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-secondary/40">
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Total Quantity</TableHead>
                                <TableHead className="text-right">Estimated Cost (₹)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {aggregatedData[category].map((item, idx) => (
                                <TableRow key={item.itemName} className={cn(idx % 2 === 0 ? "bg-white" : "bg-muted/30")}>
                                  <TableCell className="font-medium">{item.itemName}</TableCell>
                                  <TableCell className="text-right">{item.totalQuantity.toLocaleString()}</TableCell>
                                  <TableCell className="text-right">
                                    {item.totalCost.toLocaleString("en-IN")}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No approved requests with items found.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
