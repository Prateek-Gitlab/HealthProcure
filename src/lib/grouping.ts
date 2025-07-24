
import type { ProcurementRequest, User } from './data';

type StateGrouping = Record<string, Record<string, Record<string, ProcurementRequest[]>>>;
type TalukaGrouping = Record<string, Record<string, ProcurementRequest[]>>;
type DistrictGrouping = Record<string, ProcurementRequest[]>;

const getUserById = (id: string, allUsers: User[]) => allUsers.find(u => u.id === id);

const getHierarchy = (userId: string, allUsers: User[]): User[] => {
    const user = getUserById(userId, allUsers);
    if (!user) return [];
    if (!user.reportsTo) return [user];
    const managerHierarchy = getHierarchy(user.reportsTo, allUsers);
    return [...managerHierarchy, user];
};

export function groupRequestsForState(requests: ProcurementRequest[], allUsers: User[]): StateGrouping {
    return requests.reduce((acc, request) => {
        const submittedByUser = getUserById(request.submittedBy, allUsers);
        if (!submittedByUser || submittedByUser.role !== 'base') return acc;
        
        const hierarchy = getHierarchy(submittedByUser.id, allUsers);
        const talukaUser = hierarchy.find(u => u.role === 'taluka');
        const districtUser = hierarchy.find(u => u.role === 'district');
        
        if (!districtUser || !talukaUser) return acc;
        
        if (!acc[districtUser.name]) acc[districtUser.name] = {};
        if (!acc[districtUser.name][talukaUser.name]) acc[districtUser.name][talukaUser.name] = {};
        if (!acc[districtUser.name][talukaUser.name][submittedByUser.name]) acc[districtUser.name][talukaUser.name][submittedByUser.name] = [];
        
        acc[districtUser.name][talukaUser.name][submittedByUser.name].push(request);
        
        return acc;
    }, {} as StateGrouping);
}

export function groupRequestsForTaluka(requests: ProcurementRequest[], allUsers: User[]): TalukaGrouping {
    return requests.reduce((acc, request) => {
        const submittedByUser = getUserById(request.submittedBy, allUsers);
        if (!submittedByUser) return acc;
  
        const facilityName = submittedByUser.name;
        if (!acc[facilityName]) {
          acc[facilityName] = {};
        }
  
        const category = request.category;
        if (!acc[facilityName][category]) {
          acc[facilityName][category] = [];
        }
        acc[facilityName][category].push(request);
        return acc;
    }, {} as TalukaGrouping);
}


export function groupRequestsForDistrict(requests: ProcurementRequest[], allUsers: User[], currentUser: User): DistrictGrouping {
    return requests.reduce((acc, request) => {
      const submittedByUser = getUserById(request.submittedBy, allUsers);
      let facilityName = 'My Requests';
  
      if (currentUser.role === 'district') {
        if (request.status === 'Pending Taluka Approval' && submittedByUser?.role === 'base') {
          const facilityUser = getUserById(submittedByUser.reportsTo || '', allUsers);
          facilityName = facilityUser?.name || 'Unknown Taluka';
        } else if (submittedByUser) {
            facilityName = getUserById(submittedByUser.id, allUsers)?.name || 'Unknown';
        }
      } else {
        facilityName = submittedByUser?.name || 'My Requests';
      }
      
      if (!acc[facilityName]) {
        acc[facilityName] = [];
      }
      acc[facilityName].push(request);
      return acc;
    }, {} as DistrictGrouping);
}
