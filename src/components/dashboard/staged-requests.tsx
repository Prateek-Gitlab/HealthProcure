
"use client";

import { useState } from "react";
import type { ProcurementCategory, StagedRequest, Priority } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlusCircle, Send, XCircle, Loader2, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RequestForm } from "./request-form";
import { procurementPriorities } from "@/lib/data";
import { generateJustification } from "@/ai/flows/justification-flow";

interface StagedRequestsProps {
    onSubmit: (stagedRequests: StagedRequest[]) => Promise<boolean>;
}

export function StagedRequests({ onSubmit }: StagedRequestsProps) {
  const [stagedRequests, setStagedRequests] = useState<StagedRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleItemsSelected = (
    items: string[],
    category: ProcurementCategory
  ) => {
    const newStagedRequests: StagedRequest[] = items.map((itemName) => ({
      itemName,
      category,
      quantity: 1,
      pricePerUnit: 0,
      priority: "Medium",
      justification: "",
    }));

    const combined = [...stagedRequests, ...newStagedRequests];
    const unique = combined.filter(
      (v, i, a) => a.findIndex((t) => t.itemName === v.itemName) === i
    );

    setStagedRequests(unique);
    setIsFormOpen(false);
  };

  const handleStagedRequestChange = (
    index: number,
    field: "quantity" | "justification" | "priority" | "pricePerUnit",
    value: string | number
  ) => {
    const updated = [...stagedRequests];
    if (field === "quantity" || field === "pricePerUnit") {
      updated[index][field] = Number(value);
    } else if (field === 'priority') {
      updated[index].priority = value as Priority;
    }
     else {
      updated[index].justification = String(value);
    }
    setStagedRequests(updated);
  };
  
  const handleRemoveStagedRequest = (index: number) => {
    const updated = stagedRequests.filter((_, i) => i !== index);
    setStagedRequests(updated);
  }

  const handleGenerateJustifications = async () => {
    setIsGenerating(true);
    try {
        const justificationsPromises = stagedRequests.map(req => 
            generateJustification({
                itemName: req.itemName,
                category: req.category,
                quantity: req.quantity
            })
        );
        const generatedJustifications = await Promise.all(justificationsPromises);

        const updatedRequests = stagedRequests.map((req, index) => ({
            ...req,
            justification: generatedJustifications[index].justification,
        }));

        setStagedRequests(updatedRequests);
        toast({
            title: "Justifications Generated",
            description: "AI-powered justifications have been added to your requests.",
        });
    } catch (error) {
        console.error("Failed to generate justifications:", error);
        toast({
            title: "Generation Error",
            description: "An error occurred while generating justifications.",
            variant: "destructive",
        });
    } finally {
        setIsGenerating(false);
    }
  }

  const handleSubmitAllStaged = async () => {
    const validRequests = stagedRequests.filter(req => req.quantity > 0 && req.justification.trim().length > 0 && req.pricePerUnit >= 0);
    
    if (validRequests.length !== stagedRequests.length) {
        toast({
            title: "Validation Error",
            description: "Please ensure all selected items have a quantity, justification and a valid price.",
            variant: "destructive",
        });
        return;
    }
    
    setIsSubmitting(true);
    const success = await onSubmit(validRequests);
    if (success) {
        setStagedRequests([]);
    }
    setIsSubmitting(false);
  };

  const disableActions = isSubmitting || isGenerating;

  return (
    <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>New Requests</CardTitle>
                    <CardDescription>Create and manage procurement requests before submission.</CardDescription>
                </div>
                <Button onClick={() => setIsFormOpen(true)} disabled={disableActions}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Items
                </Button>
            </CardHeader>
            
            {stagedRequests.length > 0 && (
                <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="w-[120px]">Quantity</TableHead>
                            <TableHead className="w-[150px]">Price/unit (₹)</TableHead>
                            <TableHead className="w-[150px]">Priority</TableHead>
                            <TableHead>Justification</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stagedRequests.map((req, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{req.itemName}</TableCell>
                                <TableCell>
                                <Input
                                    type="number"
                                    value={req.quantity}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "quantity", e.target.value)
                                    }
                                    className="w-full"
                                    min="1"
                                    disabled={disableActions}
                                />
                                </TableCell>
                                <TableCell>
                                <Input
                                    type="number"
                                    value={req.pricePerUnit}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "pricePerUnit", e.target.value)
                                    }
                                    className="w-full"
                                    min="0"
                                    step="0.01"
                                    disabled={disableActions}
                                />
                                </TableCell>
                                <TableCell>
                                    <Select 
                                        value={req.priority} 
                                        onValueChange={(value) => handleStagedRequestChange(index, "priority", value)}
                                        disabled={disableActions}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {procurementPriorities.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                <Textarea
                                    value={req.justification}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "justification", e.target.value)
                                    }
                                    placeholder="Enter justification or generate one..."
                                    className="w-full"
                                    rows={3}
                                    disabled={disableActions}
                                />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveStagedRequest(index)} disabled={disableActions}>
                                        <XCircle className="h-4 w-4 text-muted-foreground"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                    <Button 
                        variant="outline"
                        onClick={handleGenerateJustifications} 
                        disabled={disableActions || stagedRequests.some(r => r.quantity <= 0)}
                    >
                         {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Justifications
                            </>
                        )}
                    </Button>
                    <Button onClick={handleSubmitAllStaged} disabled={disableActions || stagedRequests.length === 0}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit All Requests
                        </>
                    )}
                    </Button>
                </div>
                </CardContent>
            )}

            {stagedRequests.length === 0 && (
                 <CardContent>
                    <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No items added yet. Click "Add Items" to start.</p>
                    </div>
                 </CardContent>
            )}

        </Card>

        <RequestForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onItemsSelected={handleItemsSelected}
        />
    </>
  );
}
