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

### AI Integration
- **Google Genkit 1.15.1** - AI development framework
- **Google AI (Gemini)** - Language model integration

### Development Tools
- **Genkit CLI** - AI development tooling
- **PostCSS** - CSS processing
- **Tailwind Animate** - Animation utilities

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

### 2. Procurement Request Management
- **Request Submission**: Base users create new procurement requests
- **Approval Queue**: Supervisors approve/reject pending requests
- **Status Tracking**: Real-time status updates with audit trail
- **Categorization**: Requests organized by HR, Infrastructure, Equipment, Training

### 3. Analytics & Reporting
- **Budget Tracking**: Cost analysis by category and approval status
- **Visual Dashboard**: Charts showing request distribution and trends
- **Audit Logs**: Complete history of all request actions

### 4. User Experience
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live status tracking
- **Batch Operations**: Multiple request submission
- **Search & Filtering**: Advanced request filtering options

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

## UI Components

### Design System
Based on **Radix UI** primitives with custom Tailwind styling:

#### Color Palette
- **Primary**: Soft blue (#64B5F6) - Professional and calming
- **Background**: Light gray-blue (#E8F5FF) - Clean backdrop  
- **Accent**: Brighter blue (#42A5F5) - Call-to-action highlights

#### Typography
- **Font Family**: Inter (grotesque sans-serif)
- **Responsive Scaling**: Consistent hierarchy across devices

### Key UI Components

#### 1. Form Components
- **Multi-step Forms**: Request submission with validation
- **Dynamic Fields**: Category-specific item selection
- **Error Handling**: Real-time validation feedback

#### 2. Data Display
- **Tables**: Sortable, filterable request listings
- **Charts**: Interactive data visualizations
- **Status Indicators**: Visual request status tracking

#### 3. Navigation
- **Filter Tabs**: Request status filtering
- **Breadcrumbs**: Hierarchical navigation
- **Mobile Menu**: Responsive navigation

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
// Login user
login(userId: string): Promise<{success: boolean, error?: string}>

// Logout user
logout(): Promise<void>
```

#### Request Management
```typescript
// Add new procurement request
addRequest(
  requestData: NewRequestData,
  userId: string
): Promise<ProcurementRequest | null>

// Update existing request
updateRequest(
  request: ProcurementRequest,
  userId: string
): Promise<void>
```

### Data Fetching (`src/lib/data.ts`)
```typescript
// Get all users
getAllUsers(): Promise<User[]>

// Get all procurement requests
getProcurementRequests(): Promise<ProcurementRequest[]>

// Get items for specific category
getItemsForCategory(category: ProcurementCategory): string[]
```

---

## Development Workflow

### 1. Local Development
- **Hot Reload**: Next.js development server with Turbopack
- **Type Safety**: Full TypeScript integration
- **Component Development**: Isolated component testing

### 2. Testing Strategy
- **Type Checking**: `npm run typecheck`
- **Linting**: `npm run lint`
- **Manual Testing**: Role-based functionality testing

### 3. Deployment
- **Environment Setup**: Configure production environment variables
- **Google Sheets**: Ensure service account has proper permissions
- **Build Process**: `npm run build` for production optimization

### 4. Monitoring & Maintenance
- **Error Logging**: Console error tracking
- **Performance**: Next.js built-in analytics
- **Data Backup**: Google Sheets provides automatic versioning

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

## Future Enhancements

### Planned Features
1. **Email Notifications**: Automated approval request notifications
2. **Bulk Operations**: Mass approval/rejection capabilities
3. **Advanced Analytics**: Predictive cost modeling
4. **Mobile App**: React Native companion app
5. **API Integration**: Connect with existing ERP systems

### Technical Improvements
1. **Caching Strategy**: Redis for improved performance
2. **Real-time Updates**: WebSocket integration
3. **Offline Support**: PWA capabilities
4. **Advanced Security**: OAuth 2.0 integration

---

## Conclusion

HealthProcure represents a modern approach to healthcare procurement management, combining the simplicity of Google Sheets with the power of React and Next.js. The application demonstrates how contemporary web technologies can create sophisticated business applications while maintaining ease of use and deployment.

The modular architecture, comprehensive type system, and role-based security model provide a solid foundation for future enhancements and scaling to larger organizations.
