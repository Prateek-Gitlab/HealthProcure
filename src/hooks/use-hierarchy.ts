
"use client";

import { useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";

export function useHierarchy() {
    const { allUsers } = useAuth();

    const getSubordinateIds = useCallback((managerId: string): string[] => {
        const directSubordinates = allUsers.filter(u => u.reportsTo === managerId);
        let allSubordinateIds = directSubordinates.map(u => u.id);
        
        directSubordinates.forEach(subordinate => {
            allSubordinateIds = [...allSubordinateIds, ...getSubordinateIds(subordinate.id)];
        });

        return allSubordinateIds;
    }, [allUsers]);

    return { getSubordinateIds };
}
