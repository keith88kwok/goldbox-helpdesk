# System Patterns: Kiosk Maintenance Helpdesk

## Architecture Overview
Full-stack application using Next.js with Amplify Gen 2, implementing a multi-tenant workspace model with strict data isolation.

```mermaid
graph TB
    subgraph "Frontend (Next.js SSR)"
        A[Authentication Pages]
        B[Workspace Selector]
        C[Dashboard]
        D[Kiosk Management]
        E[Ticket Management]
        F[User Management]
    end
    
    subgraph "Backend (Amplify Gen 2)"
        G[Cognito Auth]
        H[Auto-Generated GraphQL API]
        I[Lambda Functions]
    end
    
    subgraph "Data Layer (DynamoDB)"
        J[Users Table]
        K[Workspaces Table]
        L[Workspace_Users Table]
        M[Kiosks Table]
        N[Tickets Table]
        O[Attachments Table]
    end
    
    A --> G
    B --> H
    C --> H
    D --> H
    E --> H
    F --> H
    H --> I
    I --> J
    I --> K
    I --> L
    I --> M
    I --> N
    I --> O
```

## Data Model Patterns

### Multi-Tenant Workspace Architecture
- **Workspace Isolation**: All data operations filtered by workspace_id
- **Access Control**: Junction table for user-workspace relationships
- **Role-Based Permissions**: Admin, Member, Viewer roles per workspace

### Entity Relationships
```mermaid
erDiagram
    Users {
        string user_id PK
        string email
        string name
        string cognito_id
        datetime created_at
        datetime updated_at
    }
    
    Workspaces {
        string workspace_id PK
        string name
        string description
        string created_by FK
        datetime created_at
        datetime updated_at
    }
    
    Workspace_Users {
        string workspace_id PK
        string user_id PK
        string role
        datetime joined_at
    }
    
    Kiosks {
        string kiosk_id PK
        string workspace_id FK
        string address
        string location_description
        string description
        string remark
        string status
        array location_attachments
        datetime created_at
        datetime updated_at
    }
    
    Tickets {
        string ticket_id PK
        string workspace_id FK
        string kiosk_id FK
        string reporter_id FK
        string assignee_id FK
        string status
        string description
        array comments
        array attachments
        datetime reported_date
        datetime updated_date
        datetime maintenance_time
    }
    
    Users ||--o{ Workspace_Users : "belongs to"
    Workspaces ||--o{ Workspace_Users : "contains"
    Workspaces ||--o{ Kiosks : "contains"
    Workspaces ||--o{ Tickets : "contains"
    Kiosks ||--o{ Tickets : "has"
    Users ||--o{ Tickets : "reports"
    Users ||--o{ Tickets : "assigned to"
```

## Key Design Patterns

### 1. Workspace Context Pattern
- **Context Provider**: React context for current workspace
- **Route Protection**: Middleware to verify workspace access
- **Data Filtering**: All queries automatically filtered by workspace_id using built-in filters

### 2. Access Control Pattern
- **Role-Based Access Control (RBAC)**: Admin, Member, Viewer roles
- **Workspace Membership**: Junction table pattern for many-to-many relationships
- **Permission Gates**: Component-level permission checking

### 3. Server-Side Rendering Pattern
- **SSR Requirement**: All pages must use SSR for security and performance
- **Data Fetching**: Server-side data fetching with proper authentication
- **State Hydration**: Proper client-side state hydration

### 4. File Attachment Pattern
- **S3 Storage**: Attachments stored in S3 with workspace-based folder structure
- **Signed URLs**: Temporary signed URLs for secure file access
- **Metadata Storage**: File metadata in DynamoDB for querying

## API Design Patterns

### Amplify Gen 2 Client Usage
Using the auto-generated client methods instead of custom GraphQL queries:

```typescript
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

// Basic CRUD Operations
const { data: kiosks, errors } = await client.models.Kiosk.list();
const { data: kiosk, errors } = await client.models.Kiosk.get({ id: 'kiosk-id' });
const { data: newKiosk, errors } = await client.models.Kiosk.create({ /* data */ });
const { data: updatedKiosk, errors } = await client.models.Kiosk.update({ /* data */ });
const { data: deletedKiosk, errors } = await client.models.Kiosk.delete({ id: 'kiosk-id' });
```

### Workspace-Filtered Queries
```typescript
// List kiosks for specific workspace
const { data: workspaceKiosks, errors } = await client.models.Kiosk.list({
  filter: {
    workspaceId: { eq: currentWorkspaceId }
  }
});

// List tickets by status for workspace
const { data: openTickets, errors } = await client.models.Ticket.list({
  filter: {
    and: [
      { workspaceId: { eq: currentWorkspaceId } },
      { status: { eq: 'OPEN' } }
    ]
  }
});

// List user's assigned tickets across workspaces
const { data: myTickets, errors } = await client.models.Ticket.list({
  filter: {
    assigneeId: { eq: currentUserId }
  }
});
```

### Advanced Filtering Patterns
```typescript
// Complex workspace filtering
const { data: maintenanceKiosks, errors } = await client.models.Kiosk.list({
  filter: {
    and: [
      { workspaceId: { eq: currentWorkspaceId } },
      { status: { eq: 'MAINTENANCE' } }
    ]
  }
});

// Search tickets by description
const { data: searchResults, errors } = await client.models.Ticket.list({
  filter: {
    and: [
      { workspaceId: { eq: currentWorkspaceId } },
      { description: { contains: searchTerm } }
    ]
  }
});

// Date range filtering for tickets
const { data: recentTickets, errors } = await client.models.Ticket.list({
  filter: {
    and: [
      { workspaceId: { eq: currentWorkspaceId } },
      { reportedDate: { ge: startDate } },
      { reportedDate: { le: endDate } }
    ]
  }
});
```

### Pagination Patterns
```typescript
// Paginated workspace kiosks
const { data: kiosks, nextToken, errors } = await client.models.Kiosk.list({
  filter: { workspaceId: { eq: currentWorkspaceId } },
  limit: 20,
  nextToken: previousToken
});

// Paginated tickets with sorting
const { data: tickets, nextToken, errors } = await client.models.Ticket.list({
  filter: { workspaceId: { eq: currentWorkspaceId } },
  limit: 50,
  nextToken: previousToken
});
```

### Real-time Subscriptions
```typescript
// Real-time workspace ticket updates
useEffect(() => {
  const sub = client.models.Ticket.observeQuery({
    filter: { workspaceId: { eq: currentWorkspaceId } }
  }).subscribe({
    next: ({ items, isSynced }) => {
      setTickets([...items]);
    },
  });
  return () => sub.unsubscribe();
}, [currentWorkspaceId]);

// Real-time kiosk status updates
useEffect(() => {
  const sub = client.models.Kiosk.observeQuery({
    filter: { workspaceId: { eq: currentWorkspaceId } }
  }).subscribe({
    next: ({ items, isSynced }) => {
      setKiosks([...items]);
    },
  });
  return () => sub.unsubscribe();
}, [currentWorkspaceId]);
```

### Data Access Patterns
- **Built-in Filtering**: Use Amplify's filter system for workspace isolation
- **Automatic Type Safety**: TypeScript types generated from schema
- **Optimistic Updates**: Built-in optimistic UI support
- **Caching**: Automatic query caching and synchronization

## Security Patterns

### Authentication Flow
1. Cognito JWT token validation
2. User identity extraction
3. Workspace access verification through filtering
4. Role-based permission checking

### Data Isolation
- All list queries include workspace_id filter
- S3 folder structure: `workspace-{id}/attachments/`
- No cross-workspace data leakage through filtering

## State Management Patterns

### Client-Side State
- **React Context**: Workspace context, user context
- **Local State**: Component-specific state with React hooks
- **Server State**: Built-in Amplify client caching and real-time updates

### URL State Management
- Workspace ID in URL path: `/workspace/{id}/tickets`
- Query parameters for filters and pagination
- Deep linking support for all views

## UI/UX Patterns

### Layout Structure
- **App Shell**: Consistent navigation and workspace selector
- **Workspace Navigation**: Sidebar with workspace-specific sections
- **Responsive Design**: Mobile-first responsive layouts

### Component Patterns
- **Compound Components**: Flexible, reusable UI components
- **Custom Hooks**: For data fetching and real-time subscriptions
- **Higher-Order Components**: For access control and workspace context

## Performance Patterns

### Caching Strategy
- **Built-in Caching**: Amplify client handles query caching automatically
- **Real-time Sync**: observeQuery provides automatic cache updates
- **Next.js**: Static generation where possible
- **CDN**: CloudFront for static assets

### Optimization
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component and data lazy loading
- **Selection Sets**: Fetch only needed fields to optimize data transfer
- **Image Optimization**: Next.js Image component

## Error Handling Patterns
- **Global Error Boundary**: React error boundaries
- **Client Error Handling**: Handle errors from Amplify client operations
- **User Feedback**: Toast notifications and error states
- **Logging**: Structured logging for debugging 

## Critical: Amplify Gen 2 Field Naming Conventions

**🚨 NEVER CONFUSE AGAIN**: The system uses TWO types of identifiers for every model:

### 1. Amplify Auto-Generated `id` (Primary Key)
- **Purpose**: Database primary key, relationships, URL routing
- **Format**: UUID-like string (e.g., "46d455e9-6e2e-429b-96e3-d0b239db800f")
- **Usage**: ALL database operations, model relationships, URL parameters

### 2. Custom Business ID (e.g., `workspaceId`, `userId`, `kioskId`)
- **Purpose**: Business logic, human-readable identifiers, display
- **Format**: Custom format (e.g., "workspace-1748506761120", "user-12345")
- **Usage**: Business logic, reports, human-readable references

### Current Data Relationships (AS IMPLEMENTED):

```typescript
// ✅ CORRECT: How the system currently works
User: {
    id: "amplify-uuid-1",          // Amplify primary key
    userId: "user-business-123",    // Custom business ID
}

Workspace: {
    id: "amplify-uuid-2",              // Amplify primary key  
    workspaceId: "workspace-789",      // Custom business ID
}

WorkspaceUser: {
    id: "amplify-uuid-3",          // Amplify primary key
    workspaceId: "amplify-uuid-2", // References Workspace.id (NOT Workspace.workspaceId!)
    userId: "amplify-uuid-1",      // References User.id (NOT User.userId!)
}
```

### URL Routing Pattern:
```typescript
// ✅ CORRECT: URLs use Amplify IDs
/workspace/[id]/dashboard
// where [id] = Workspace.id (e.g., "46d455e9-6e2e-429b-96e3-d0b239db800f")

// ❌ WRONG: Don't use business IDs in URLs
/workspace/[workspaceId]/dashboard 
// where [workspaceId] would be "workspace-789"
```

### Database Operation Patterns:
```typescript
// ✅ CORRECT: Use Amplify ID for database operations
client.models.Workspace.get({ id: "46d455e9-6e2e-429b-96e3-d0b239db800f" })

// ✅ CORRECT: Use business ID for filtering/searching
client.models.Workspace.list({ 
    filter: { workspaceId: { eq: "workspace-789" } } 
})

// ❌ WRONG: Don't use business ID for get operations
client.models.Workspace.get({ id: "workspace-789" })
```

### Variable Naming Convention:
```typescript
// When working with Amplify IDs:
const workspaceAmplifyId = "46d455e9-6e2e-429b-96e3-d0b239db800f";
const id = params.id; // From URL parameter

// When working with business IDs:
const workspaceBusinessId = "workspace-789";
const customWorkspaceId = workspace.workspaceId; // Custom field
```

**MEMORY AID**: 
- URL params = Amplify `id`
- Database relationships = Amplify `id` 
- Display/business logic = Custom business IDs
- `.get()` operations = Amplify `id`
- `.list()` filters = Can use either, depending on need

## Authentication & Authorization Patterns 