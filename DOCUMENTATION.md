# HealthProcure - Code Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Data Models](#data-models)
- [Core Components](#core-components)
- [Authentication System](#authentication-system)
- [Database Integration](#database-integration)
- [AI Integration](#ai-integration)
- [UI Components](#ui-components)
- [Setup & Environment](#setup--environment)
- [API Reference](#api-reference)
- [Development Workflow](#development-workflow)

---

## Project Overview

**HealthProcure** is a healthcare procurement management system built with Next.js that streamlines the approval workflow for medical equipment, infrastructure, HR, and training requests across multiple organizational levels.

### Core Concept
The application implements a hierarchical approval system with four user roles:
- **Base Level**: Submit procurement requests
- **Taluka Level**: First level of approval
- **District Level**: Second level of approval  
- **State Level**: Final approval authority

---

## Technology Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 3.4.1** - Styling framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Runtime type validation

### Backend
- **Next.js Server Actions** - API layer
- **Google Sheets API** - Database storage
- **Google Auth Library** - Authentication for Sheets
- **Firebase 11.9.1** - Authentication and hosting (optional)

### PDF Generation
- **jsPDF 2.5.1** - Client-side PDF generation
- **jsPDF-AutoTable 3.8.2** - Table generation for PDFs

### AI Integration
- **Google Genkit 1.15.1** - AI development framework
- **Google AI (Gemini)** - Language model integration

### Development Tools
- **Genkit CLI** - AI development tooling
- **PostCSS** - CSS processing
- **Tailwind Animate** - Animation utilities
- **TypeScript 5** - Enhanced type definitions for PDF generation

---

## Architecture

### Application Structure
```
src/
├── ai/                     # AI/Genkit integration
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/                # Reusable UI components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
└── lib/                   # Utility functions and configurations
```

### Data Flow
1. **Authentication**: User selects their profile from Google Sheets data
2. **Data Fetching**: Server actions fetch procurement requests and user data
3. **Authorization**: Role-based filtering determines visible requests
4. **State Management**: React state with context for user session
5. **Database Operations**: Server actions interact with Google Sheets API

---

## Key Features

### 1. Role-Based Access Control
- **Hierarchical Structure**: State → District → Taluka → Base
- **Request Visibility**: Users see requests from their subordinates
- **Approval Workflow**: Sequential approval through organizational levels
- **Dynamic Hierarchy Management**: Efficient subordinate tracking with recursive algorithms

### 2. Procurement Request Management
- **Request Submission**: Base users create new procurement requests
- **Approval Queue**: Supervisors approve/reject pending requests
- **Status Tracking**: Real-time status updates with audit trail
- **Categorization**: Requests organized by HR, Infrastructure, Equipment, Training
- **Batch Operations**: Multiple request submission with staged request management

### 3. Advanced PDF Reporting System
- **Multi-Level Reports**: Specialized PDF generation for different organizational levels
- **District Reports**: Comprehensive district-wide procurement summaries with Taluka breakdowns
- **Taluka Reports**: Facility-specific reports with customizable selection
- **Budget Analysis**: Detailed cost breakdowns by category and facility
- **Professional Formatting**: Branded PDFs with tables, charts, and summary statistics

### 4. Analytics & Data Visualization
- **Budget Tracking**: Cost analysis by category and approval status
- **Visual Dashboard**: Interactive charts showing request distribution and trends
- **Aggregated Data Views**: Consolidated item summaries across organizational levels
- **Category-wise Analysis**: Pie charts and breakdown tables for procurement categories
- **Audit Logs**: Complete history of all request actions

### 5. Enhanced User Experience
- **Responsive Design**: Mobile-friendly interface with optimized layouts
- **Real-time Updates**: Live status tracking with immediate UI updates
- **Advanced Filtering**: Multi-criteria request filtering and sorting
- **Interactive Components**: Accordion-based data display and expandable sections
- **Form Validation**: Comprehensive client-side validation with Zod schemas

---

## Data Models

### User Interface
```typescript
interface User {
  id: string;
  name: string;
  role: 'base' | 'taluka' | 'district' | 'state';
  reportsTo?: string; // ID of supervisor
}
```

### Procurement Request Interface
```typescript
interface ProcurementRequest {
  id: string;
  category: 'HR' | 'Infrastructure' | 'Equipment' | 'Training';
  itemName: string;
  quantity: number;
  pricePerUnit?: number;
  priority: 'High' | 'Medium' | 'Low';
  justification: string;
  submittedBy: string; // User ID
  status: 'Pending Taluka Approval' | 'Approved' | 'Rejected';
  createdAt: string;
  auditLog: AuditLogEntry[];
}
```

### Audit Log Entry
```typescript
interface AuditLogEntry {
  action: string;
  user: string;
  date: string;
  comment?: string;
}
```

---

## Core Components

### 1. Authentication System (`src/contexts/auth-context.tsx`)
- **Cookie-based Authentication**: Persistent user sessions
- **User Context Provider**: Global user state management
- **Role-based Authorization**: Component-level access control

### 2. Dashboard Client (`src/components/dashboard/dashboard-client.tsx`)
- **Central Dashboard Logic**: Main application interface
- **Request Management**: CRUD operations for procurement requests
- **Filtering System**: Advanced request filtering and sorting
- **Analytics Integration**: Data visualization components

### 3. Request Management Components
- **RequestForm**: New request submission
- **RequestList**: Display and manage requests
- **ApprovalDialog**: Approve/reject interface
- **RequestStatusStepper**: Visual status tracking

### 4. Data Visualization
- **StatsCards**: Key metrics display
- **AnalyticsChart**: Request trends over time
- **CategoryPieChart**: Budget breakdown by category
- **ApprovedItemsTable**: Detailed request listings

---

## Authentication System

### User Authentication Flow
1. **Login Page**: Users select their profile from a dropdown
2. **Cookie Storage**: User ID stored in HTTP-only cookie
3. **Session Validation**: Server actions verify user existence
4. **Context Provider**: User data available throughout app

### Implementation Details
```typescript
// Login action
export async function login(userId: string) {
  const users = await getAllUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    cookies().set('health_procure_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return { success: true };
  }
  return { success: false, error: 'User not found' };
}
```

---

## PDF Generation System

### Overview
The application features a comprehensive PDF generation system built with [`jsPDF`](src/lib/pdf-generator.ts:3) and [`jsPDF-AutoTable`](src/lib/pdf-generator.ts:4) for creating professional procurement reports across different organizational levels.

### Core PDF Generation Functions

#### 1. District-Level PDF Reports (`generateDistrictPdf`)
```typescript
export function generateDistrictPdf(
  requests: ProcurementRequest[],
  allUsers: User[],
  currentUser: User
)
```

**Features:**
- **Hierarchical Budget Analysis**: Total budget requirements with Taluka-wise breakdowns
- **Approved Items Summary**: Categorized aggregation of all approved items
- **Professional Formatting**: Branded headers with district-specific information
- **Automated Calculations**: Real-time cost summaries and quantity totals

**Report Sections:**
1. **Total Budget Overview**: Complete district budget requirements
2. **Taluka Budget Breakdown**: Individual Taluka cost analysis
3. **Approved Items by Category**: Detailed item listings with quantities and costs

#### 2. General Procurement Reports (`generateRequestsPdf`)
```typescript
export function generateRequestsPdf(
  requests: ProcurementRequest[],
  totalBudget: number,
  allUsers: User[],
  userName?: string
)
```

**Features:**
- **Executive Summary**: Visual summary cards with key metrics
- **Multi-Facility Support**: Facility-wise budget breakdowns
- **Category Analysis**: Cost distribution across procurement categories
- **Detailed Request Listings**: Complete request tables grouped by submitter

### PDF Styling and Branding

#### Color Scheme
```typescript
const primaryColor = [79, 175, 245]; // Professional blue
const greyColor = [240, 240, 240];   // Light grey backgrounds
const darkGreyColor = [74, 74, 74];  // Dark headers
```

#### Header Generation
```typescript
const generateHeader = (doc: jsPDFWithAutoTable, title: string, subtitle?: string)
```
- **Branded Headers**: Consistent styling across all reports
- **Dynamic Titles**: Context-aware report titles
- **Subtitle Support**: Additional context information

### Integration Points

#### 1. District-Level Integration
- **Trigger**: [`ApprovedItemsTable`](src/components/dashboard/approved-items-table.tsx:114) component
- **Access**: Available to District-level users via download button
- **Data Source**: All subordinate requests with hierarchical filtering

#### 2. Taluka-Level Integration
- **Trigger**: [`PdfDownloadDialog`](src/components/dashboard/pdf-download-dialog.tsx:25) component
- **Access**: Facility selection dialog for customized reports
- **Data Source**: Selected base-level facilities with form validation

### Technical Implementation

#### Type Extensions
```typescript
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}
```

#### Hierarchical Data Processing
- **Subordinate Calculation**: Recursive algorithm for organizational hierarchy
- **Data Aggregation**: Intelligent grouping by category, facility, and status
- **Cost Calculations**: Automatic price per unit × quantity calculations

---

## Database Integration

### Google Sheets as Database
The application uses Google Sheets API as its primary data store with two main worksheets:

#### 1. ProcurementRequests Sheet
**Headers**: `id`, `category`, `itemName`, `quantity`, `pricePerUnit`, `priority`, `justification`, `submittedBy`, `status`, `createdAt`, `auditLog`

#### 2. Users Sheet
**Headers**: `id`, `name`, `role`, `reportsTo`

### Database Operations (`src/lib/sheets.ts`)

#### Authentication Setup
```typescript
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
```

#### Key Functions
- **`getUsers()`**: Fetch all users from Users sheet
- **`getRequests()`**: Fetch all procurement requests
- **`addRow()`**: Insert new procurement request
- **`updateRowByField()`**: Update existing request

### Data Consistency
- **Auto-generated IDs**: Unique request identifiers (`REQ-${timestamp}-${random}`)
- **JSON Serialization**: Complex data (audit logs) stored as JSON strings
- **Type Safety**: TypeScript interfaces ensure data integrity

---

## AI Integration

### Google Genkit Setup (`src/ai/genkit.ts`)
```typescript
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
```

### Development Environment (`src/ai/dev.ts`)
- **Environment Configuration**: Loads environment variables for AI services
- **Development Server**: `npm run genkit:dev` starts AI development environment
- **Watch Mode**: `npm run genkit:watch` for automatic reloading

### Potential AI Features
- **Smart Categorization**: Auto-categorize procurement items
- **Cost Estimation**: Predict item costs based on historical data
- **Approval Recommendations**: AI-assisted approval decisions
- **Report Generation**: Natural language summaries of procurement data

---

## Enhanced Hierarchy Management System

### Overview
The application implements a sophisticated hierarchy management system using the [`useHierarchy`](src/hooks/use-hierarchy.ts:8) hook for efficient organizational structure navigation.

### Core Hierarchy Functions

#### 1. Subordinate ID Calculation
```typescript
const getSubordinateIds = useCallback((managerId: string): string[] => {
  const directSubordinates = allUsers.filter(u => u.reportsTo === managerId);
  let allSubordinateIds = directSubordinates.map(u => u.id);
  
  directSubordinates.forEach(subordinate => {
    allSubordinateIds = [...allSubordinateIds, ...getSubordinateIds(subordinate.id)];
  });

  return allSubordinateIds;
}, [allUsers]);
```

**Features:**
- **Recursive Algorithm**: Efficiently traverses multi-level organizational structures
- **Performance Optimized**: Memoized with `useCallback` for optimal re-rendering
- **Complete Hierarchy**: Returns all subordinates at any depth level

#### 2. Direct Subordinate Access
```typescript
const getDirectSubordinates = useCallback((managerId: string): User[] => {
  return allUsers.filter(u => u.reportsTo === managerId);
}, [allUsers]);
```

### Data Grouping Utilities (`src/lib/grouping.ts`)

#### 1. State-Level Grouping
```typescript
export function groupRequestsForState(
  requests: ProcurementRequest[],
  allUsers: User[]
): StateGrouping
```
- **Three-Level Hierarchy**: District → Taluka → Base facility grouping
- **Hierarchical Navigation**: Automatic hierarchy detection and grouping
- **Type Safety**: Strongly typed return structures

#### 2. Taluka-Level Grouping
```typescript
export function groupRequestsForTaluka(
  requests: ProcurementRequest[],
  allUsers: User[]
): TalukaGrouping
```
- **Facility-Category Matrix**: Groups by facility name and procurement category
- **Efficient Organization**: Optimized for Taluka-level management views

#### 3. District-Level Grouping
```typescript
export function groupRequestsForDistrict(
  requests: ProcurementRequest[],
  allUsers: User[],
  currentUser: User
): DistrictGrouping
```
- **Context-Aware Grouping**: Different grouping logic based on request status
- **Intelligent Naming**: Automatic facility name resolution with fallbacks

---

## Advanced UI Components

### Design System
Based on **Radix UI** primitives with custom Tailwind styling:

#### Color Palette
- **Primary**: Soft blue (#64B5F6) - Professional and calming
- **Background**: Light gray-blue (#E8F5FF) - Clean backdrop
- **Accent**: Brighter blue (#42A5F5) - Call-to-action highlights

#### Typography
- **Font Family**: Inter (grotesque sans-serif)
- **Responsive Scaling**: Consistent hierarchy across devices

### Enhanced Dashboard Components

#### 1. Approved Items Table (`ApprovedItemsTable`)
```typescript
interface ApprovedItemsTableProps {
  requests: ProcurementRequest[];
  currentUser: User;
}
```

**Features:**
- **Data Aggregation**: Intelligent item consolidation across multiple requests
- **Category Organization**: Accordion-based category grouping
- **Role-Specific Views**: Different titles and descriptions based on user role
- **PDF Integration**: Direct PDF download functionality for District users
- **Scroll Optimization**: Efficient scrolling with `ScrollArea` component

**Key Functionality:**
- **Item Consolidation**: Combines identical items across requests
- **Cost Calculation**: Automatic total cost computation
- **Sorting**: Items sorted by total cost within categories

#### 2. PDF Download Dialog (`PdfDownloadDialog`)
```typescript
interface PdfDownloadDialogProps {
  allRequests: ProcurementRequest[];
}
```

**Features:**
- **Multi-Selection Interface**: Checkbox-based facility selection
- **Form Validation**: Zod schema validation for required selections
- **Dynamic Reporting**: Context-aware report title generation
- **User Experience**: Smooth dialog interactions with form reset

**Validation Schema:**
```typescript
const formSchema = z.object({
  selectedUsers: z.array(z.string()).refine(value => value.length > 0, {
    message: "Please select at least one facility to generate a report.",
  }),
});
```

#### 3. Enhanced Dashboard Client (`DashboardClient`)
**New Features:**
- **Advanced Filtering**: Multi-criteria request filtering with priority sorting
- **Role-Specific Layouts**: Different dashboard layouts for each organizational level
- **Real-Time Updates**: Immediate UI updates after request modifications
- **Staged Request Management**: Batch request submission with progress tracking

### Form Components

#### 1. Advanced Validation
- **Zod Integration**: Runtime type validation with detailed error messages
- **React Hook Form**: Optimized form state management
- **Dynamic Validation**: Context-aware validation rules

#### 2. Multi-Select Components
- **Checkbox Arrays**: Efficient multi-selection interfaces
- **Scroll Areas**: Optimized scrolling for large datasets
- **Form Integration**: Seamless integration with form validation

### Data Display Components

#### 1. Interactive Tables
- **Sortable Columns**: Click-to-sort functionality
- **Responsive Design**: Mobile-optimized table layouts
- **Status Indicators**: Visual request status tracking
- **Action Integration**: Inline action buttons and dialogs

#### 2. Advanced Charts
- **Category Pie Charts**: Interactive procurement category visualization
- **Analytics Charts**: Time-series data visualization
- **Responsive Charts**: Mobile-optimized chart rendering
- **Filter Integration**: Dynamic chart updates based on user selections

#### 3. Accordion Components
- **Category Grouping**: Collapsible category sections
- **Default Expansion**: Smart default expansion states
- **Performance Optimized**: Efficient rendering for large datasets

---

## Setup & Environment

### Required Environment Variables
```bash
# Google Sheets Integration
GOOGLE_SHEET_ID="your_spreadsheet_id"
GOOGLE_SHEETS_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key\n-----END PRIVATE KEY-----\n"

# Optional: AI Integration
GOOGLE_AI_API_KEY="your_gemini_api_key"
```

### Google Sheets Setup Process
1. **Create Spreadsheet**: New Google Sheet with two tabs
2. **Service Account**: Create in Google Cloud Console
3. **Enable APIs**: Google Sheets API and Google Drive API
4. **Share Sheet**: Give service account Editor access
5. **Download Credentials**: JSON key file for environment variables

### Installation & Development
```bash
# Install dependencies
npm install

# Development server
npm run dev

# AI development environment
npm run genkit:dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

---

## API Reference

### Server Actions (`src/lib/actions.ts`)

#### Authentication
```typescript
// Login user with enhanced cookie security
login(userId: string): Promise<{success: boolean, error?: string}>

// Logout user with cookie cleanup
logout(): Promise<void>
```

**Enhanced Security Features:**
- **HTTP-Only Cookies**: Secure cookie storage with `httpOnly: true`
- **Environment-Aware Security**: Production-specific secure flag
- **Extended Session**: 7-day session duration
- **Path Specification**: Explicit cookie path configuration

#### Request Management
```typescript
// Add new procurement request with validation
addRequest(
  requestData: NewRequestData,
  userId: string
): Promise<ProcurementRequest | null>

// Update existing request with authorization
updateRequest(
  request: ProcurementRequest,
  userId: string
): Promise<void>
```

**Request Data Interface:**
```typescript
interface NewRequestData {
  itemName: string;
  category: ProcurementCategory;
  quantity: number;
  priority: Priority;
  justification: string;
  pricePerUnit?: number;
}
```

### Data Fetching (`src/lib/data.ts`)

#### Core Data Functions
```typescript
// Get all users with role-based filtering
getAllUsers(): Promise<User[]>

// Get all procurement requests with status tracking
getProcurementRequests(): Promise<ProcurementRequest[]>

// Get categorized items for dropdown population
getItemsForCategory(category: ProcurementCategory): string[]
```

#### Enhanced Data Types
```typescript
// Extended user interface with hierarchy support
export interface User {
  id: string;
  name: string;
  role: Role;
  reportsTo?: string;
}

// Comprehensive request status tracking
export type RequestStatus =
  | 'Pending Taluka Approval'
  | 'Approved'
  | 'Rejected';

// Enhanced filter options
export type FilterStatus = RequestStatus | 'all' | 'pending' | 'approved-by-me';
```

#### Categorized Items System
```typescript
export const categorizedItems = {
  HR: hrItems,              // 12 HR-related items
  Infrastructure: infrastructureItems,  // 4 infrastructure items
  Equipment: equipmentItems,            // 47 medical equipment items
  Training: trainingItems,              // 4 training programs
}
```

### PDF Generation API (`src/lib/pdf-generator.ts`)

#### District-Level PDF Generation
```typescript
export function generateDistrictPdf(
  requests: ProcurementRequest[],
  allUsers: User[],
  currentUser: User
): void
```

**Features:**
- Hierarchical budget analysis
- Taluka-wise cost breakdowns
- Approved items categorization
- Professional PDF formatting

#### General PDF Reports
```typescript
export function generateRequestsPdf(
  requests: ProcurementRequest[],
  totalBudget: number,
  allUsers: User[],
  userName?: string
): void
```

**Features:**
- Executive summary cards
- Facility-wise budget analysis
- Category-wise cost distribution
- Detailed request tables

### Hierarchy Management API (`src/hooks/use-hierarchy.ts`)

```typescript
export function useHierarchy() {
  // Get all subordinate IDs recursively
  const getSubordinateIds: (managerId: string) => string[];
  
  // Get direct subordinates only
  const getDirectSubordinates: (managerId: string) => User[];
  
  return { getSubordinateIds, getDirectSubordinates };
}
```

### Data Grouping API (`src/lib/grouping.ts`)

#### State-Level Grouping
```typescript
export function groupRequestsForState(
  requests: ProcurementRequest[],
  allUsers: User[]
): StateGrouping
```

#### Taluka-Level Grouping
```typescript
export function groupRequestsForTaluka(
  requests: ProcurementRequest[],
  allUsers: User[]
): TalukaGrouping
```

#### District-Level Grouping
```typescript
export function groupRequestsForDistrict(
  requests: ProcurementRequest[],
  allUsers: User[],
  currentUser: User
): DistrictGrouping
```

---

## Enhanced Authentication & Authorization

### Cookie-Based Authentication System

#### Security Enhancements
```typescript
export async function login(userId: string) {
  const users = await getAllUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    const cookieStore = cookies();
    cookieStore.set('health_procure_user_id', userId, {
      httpOnly: true,                    // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      maxAge: 60 * 60 * 24 * 7,         // 1 week expiration
      path: '/',                         // Site-wide availability
    });
    return { success: true };
  }
  return { success: false, error: 'User not found' };
}
```

#### Authorization Improvements
- **Role-Based Access**: Hierarchical permission system
- **Request Filtering**: Users only see authorized requests
- **Action Validation**: Server-side authorization checks
- **Session Management**: Secure cookie handling with automatic cleanup

### Context-Based State Management

#### Authentication Context (`src/contexts/auth-context.tsx`)
- **Global User State**: Centralized user information management
- **Automatic Revalidation**: Context updates on authentication changes
- **Type Safety**: Strongly typed user context with null checks
- **Performance Optimization**: Memoized context values

---

## Development Workflow

### 1. Local Development
- **Hot Reload**: Next.js development server with Turbopack on port 9002
- **Type Safety**: Full TypeScript integration with strict mode
- **Component Development**: Isolated component testing with real-time updates
- **AI Development**: Dedicated Genkit development server with watch mode

### 2. Enhanced Testing Strategy
- **Type Checking**: `npm run typecheck` with comprehensive type validation
- **Linting**: `npm run lint` with Next.js ESLint configuration
- **Manual Testing**: Role-based functionality testing across all user levels
- **PDF Testing**: Client-side PDF generation testing with real data
- **Hierarchy Testing**: Multi-level organizational structure validation

### 3. Build & Deployment
- **Environment Setup**: Configure production environment variables
- **Google Sheets**: Ensure service account has proper permissions
- **Build Process**: `npm run build` for production optimization
- **PDF Dependencies**: Ensure jsPDF libraries are properly bundled
- **Type Definitions**: Custom type definitions for PDF generation

### 4. Monitoring & Maintenance
- **Error Logging**: Console error tracking with detailed stack traces
- **Performance**: Next.js built-in analytics and Core Web Vitals
- **Data Backup**: Google Sheets provides automatic versioning
- **PDF Generation**: Monitor client-side PDF generation performance
- **Memory Management**: Efficient handling of large datasets in PDF generation

---

## Key Implementation Decisions

### Why Google Sheets?
1. **Accessibility**: Non-technical users can view/edit data directly
2. **No Infrastructure**: No database setup or maintenance required
3. **Real-time Collaboration**: Multiple users can access simultaneously
4. **Backup & Recovery**: Built-in version history and sharing

### Why Next.js App Router?
1. **Server Components**: Improved performance with server-side rendering
2. **Server Actions**: Simplified API layer without separate backend
3. **Type Safety**: End-to-end TypeScript integration
4. **Modern React**: Latest React features and patterns

### Why Role-Based Architecture?
1. **Scalability**: Easy to add new organizational levels
2. **Security**: Clear data access boundaries
3. **Flexibility**: Configurable approval workflows
4. **Audit Trail**: Complete action tracking

---

## Recent Enhancements & Changelog

### Major Feature Additions

#### 1. PDF Generation System (Latest)
- **jsPDF Integration**: Client-side PDF generation with professional formatting
- **Multi-Level Reports**: Specialized reports for District and Taluka levels
- **Automated Calculations**: Real-time budget analysis and item aggregation
- **Professional Styling**: Branded headers, color schemes, and table formatting

#### 2. Enhanced Hierarchy Management
- **Recursive Algorithms**: Efficient subordinate calculation across multiple levels
- **Performance Optimization**: Memoized hierarchy functions with useCallback
- **Data Grouping**: Sophisticated grouping utilities for different organizational levels

#### 3. Advanced UI Components
- **Accordion Tables**: Collapsible category-based data display
- **Multi-Select Dialogs**: Checkbox-based facility selection for reports
- **Enhanced Forms**: Zod validation with React Hook Form integration
- **Responsive Charts**: Interactive data visualization with filtering

#### 4. Authentication & Security Improvements
- **Enhanced Cookie Security**: HTTP-only cookies with environment-aware settings
- **Extended Sessions**: 7-day session duration with automatic cleanup
- **Role-Based Authorization**: Improved access control with hierarchical permissions

### Recent Bug Fixes & Improvements
- **Priority Display**: Fixed priority visibility in approval workflows
- **Request Filtering**: Improved rejected request handling for different user levels
- **Status Updates**: Enhanced real-time status tracking across organizational levels
- **Mobile Optimization**: Improved responsive design for mobile devices
- **Performance**: Optimized data loading and rendering for large datasets

### Technical Debt Addressed
- **Type Safety**: Enhanced TypeScript definitions for PDF generation
- **Code Organization**: Modular component structure with clear separation of concerns
- **Error Handling**: Comprehensive error handling in PDF generation and data operations
- **Memory Management**: Efficient handling of large datasets in client-side operations

---

## Usage Examples & Patterns

### PDF Generation Usage

#### District-Level Report Generation
```typescript
// In ApprovedItemsTable component
import { generateDistrictPdf } from '@/lib/pdf-generator';

const handleDownloadPdf = () => {
  generateDistrictPdf(requests, allUsers, currentUser);
};
```

#### Taluka-Level Custom Reports
```typescript
// In PdfDownloadDialog component
const handleDownload = (values: z.infer<typeof formSchema>) => {
  const { selectedUsers } = values;
  const requestsToDownload = allRequests.filter(req =>
    selectedUsers.includes(req.submittedBy)
  );
  const totalBudget = requestsToDownload
    .filter(req => req.status === 'Approved')
    .reduce((sum, req) => sum + ((req.pricePerUnit || 0) * req.quantity), 0);

  generateRequestsPdf(requestsToDownload, totalBudget, allUsers, reportTitle);
};
```

### Hierarchy Management Usage

#### Getting All Subordinates
```typescript
// In dashboard components
const { getSubordinateIds } = useHierarchy();
const subordinateIds = getSubordinateIds(currentUser.id);
const visibleRequests = requests.filter(r =>
  subordinateIds.includes(r.submittedBy)
);
```

#### Direct Subordinate Access
```typescript
// In PDF download dialog
const { getDirectSubordinates } = useHierarchy();
const subordinateUsers = getDirectSubordinates(user.id)
  .filter(u => u.role === 'base');
```

### Data Aggregation Patterns

#### Item Consolidation
```typescript
// Aggregating identical items across requests
const itemsMap = new Map<string, AggregatedItem>();
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
```

---

## Future Enhancements

### Planned Features
1. **Email Notifications**: Automated approval request notifications with PDF attachments
2. **Bulk Operations**: Mass approval/rejection capabilities with batch PDF generation
3. **Advanced Analytics**: Predictive cost modeling with AI integration
4. **Mobile App**: React Native companion app with offline PDF generation
5. **API Integration**: Connect with existing ERP systems for data synchronization
6. **Enhanced PDF Features**: Charts and graphs in PDF reports, custom branding options

### Technical Improvements
1. **Caching Strategy**: Redis for improved performance and PDF template caching
2. **Real-time Updates**: WebSocket integration for live status updates
3. **Offline Support**: PWA capabilities with offline PDF generation
4. **Advanced Security**: OAuth 2.0 integration with enhanced session management
5. **PDF Optimization**: Server-side PDF generation for large reports
6. **Database Migration**: Potential migration to PostgreSQL for better performance

---

## Conclusion

HealthProcure represents a modern approach to healthcare procurement management, combining the simplicity of Google Sheets with the power of React and Next.js. The recent enhancements, particularly the comprehensive PDF generation system and advanced hierarchy management, demonstrate how contemporary web technologies can create sophisticated business applications while maintaining ease of use and deployment.

The modular architecture, comprehensive type system, role-based security model, and new PDF reporting capabilities provide a solid foundation for future enhancements and scaling to larger organizations. The application successfully bridges the gap between simple data storage and complex business process management, offering a scalable solution for healthcare procurement workflows.

### Key Achievements
- **Professional PDF Reports**: Multi-level reporting system with branded formatting
- **Efficient Hierarchy Management**: Recursive algorithms for complex organizational structures
- **Enhanced User Experience**: Interactive components with real-time updates
- **Type Safety**: Comprehensive TypeScript integration across all new features
- **Performance Optimization**: Memoized functions and efficient data handling
