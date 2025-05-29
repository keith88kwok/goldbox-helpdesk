# Technical Context: Kiosk Maintenance Helpdesk

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (recommended for rapid development)
- **State Management**: React Context + Built-in Amplify Data client
- **UI Components**: Headless UI or Radix UI (accessibility-first)
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Amplify Auth (Cognito integration)

### Backend
- **Framework**: AWS Amplify Gen 2
- **API**: GraphQL (auto-generated from schema)
- **Functions**: AWS Lambda (TypeScript)
- **Authentication**: AWS Cognito
- **Database**: Amazon DynamoDB
- **File Storage**: Amazon S3
- **CDN**: Amazon CloudFront

### Development Tools
- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest + React Testing Library (future)
- **Version Control**: Git

## Project Structure
```
helpdesk/
├── amplify/                    # Amplify Gen 2 backend
│   ├── auth/                  # Cognito configuration
│   │   └── resource.ts       # Authentication setup
│   ├── data/                  # DynamoDB schema and resolvers
│   │   └── resource.ts       # Data schema structure
│   ├── storage/               # S3 storage configuration
│   └── backend.ts             # Amplify backend definition
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/           # Authentication routes
│   │   ├── workspace/        # Workspace-specific routes
│   │   │   └── [id]/         # Dynamic workspace routes
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # Reusable React components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility functions and configurations
│   │   ├── amplify/          # Amplify client configuration
│   │   ├── auth/             # Authentication utilities
│   │   ├── utils/            # General utilities
│   │   └── types/            # TypeScript type definitions
│   ├── hooks/                # Custom React hooks
│   └── contexts/             # React contexts
├── public/                   # Static assets
├── memory-bank/              # Project documentation
└── package.json
```

## AWS Amplify Gen 2 Configuration

### Authentication Setup
```typescript
// amplify/auth/resource.ts
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      mutable: true,
      required: true,
    },
    given_name: {
      mutable: true,
      required: true,
    },
    family_name: {
      mutable: true,
      required: true,
    },
  },
});
```

### Data Schema Structure
```typescript
// amplify/data/resource.ts
export const schema = a.schema({
  User: a
    .model({
      userId: a.id().required(),
      email: a.email().required(),
      name: a.string().required(),
      cognitoId: a.string().required(),
      workspaces: a.hasMany("WorkspaceUser", "userId"),
    })
    .authorization([a.allow.owner()]),

  Workspace: a
    .model({
      workspaceId: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      createdBy: a.string().required(),
      users: a.hasMany("WorkspaceUser", "workspaceId"),
      kiosks: a.hasMany("Kiosk", "workspaceId"),
      tickets: a.hasMany("Ticket", "workspaceId"),
    })
    .authorization([a.allow.authenticated()]),

  WorkspaceUser: a
    .model({
      workspaceId: a.id().required(),
      userId: a.id().required(),
      role: a.enum(["ADMIN", "MEMBER", "VIEWER"]),
      joinedAt: a.datetime(),
      workspace: a.belongsTo("Workspace", "workspaceId"),
      user: a.belongsTo("User", "userId"),
    })
    .authorization([a.allow.authenticated()]),

  Kiosk: a
    .model({
      kioskId: a.id().required(),
      workspaceId: a.id().required(),
      address: a.string().required(),
      locationDescription: a.string(),
      description: a.string(),
      remark: a.string(),
      status: a.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "RETIRED"]),
      locationAttachments: a.string().array(),
      workspace: a.belongsTo("Workspace", "workspaceId"),
      tickets: a.hasMany("Ticket", "kioskId"),
    })
    .authorization([a.allow.authenticated()]),

  Ticket: a
    .model({
      ticketId: a.id().required(),
      workspaceId: a.id().required(),
      kioskId: a.id().required(),
      reporterId: a.id().required(),
      assigneeId: a.id(),
      status: a.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
      description: a.string().required(),
      comments: a.json().array(),
      attachments: a.string().array(),
      reportedDate: a.datetime().required(),
      updatedDate: a.datetime(),
      maintenanceTime: a.datetime(),
      workspace: a.belongsTo("Workspace", "workspaceId"),
      kiosk: a.belongsTo("Kiosk", "kioskId"),
    })
    .authorization([a.allow.authenticated()]),
});
```

## Development Setup

### Prerequisites
- Node.js 18 or later
- npm (latest version)
- AWS CLI configured
- Amplify CLI installed globally

### Local Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy backend changes
npx amplify sandbox

# Generate GraphQL types
npx amplify generate graphql-client-code

# Build production version
npm run build

# Start production server
npm start
```

### Environment Configuration
```bash
# .env.local
NEXT_PUBLIC_AMPLIFY_PROJECT_ID=your-project-id
NEXT_PUBLIC_AMPLIFY_REGION=us-east-1
NEXT_PUBLIC_S3_BUCKET=your-s3-bucket
```

## Technical Constraints

### Performance Requirements
- **SSR Mandatory**: All pages must use Server-Side Rendering
- **Load Time**: Initial page load < 3 seconds
- **Bundle Size**: Keep JavaScript bundles optimized
- **Image Optimization**: Use Next.js Image component

### Security Requirements
- **Authentication**: All routes require Cognito authentication
- **Authorization**: Workspace-based access control
- **Data Isolation**: Strict workspace data separation
- **HTTPS**: All communications over HTTPS
- **Input Validation**: Server-side validation for all inputs

### Scalability Considerations
- **DynamoDB**: Design for horizontal scaling
- **S3**: Organize files by workspace for efficient access
- **CDN**: Use CloudFront for static asset delivery
- **Caching**: Implement appropriate caching strategies

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "aws-amplify": "^6.0.0",
    "@aws-amplify/ui-react": "^6.0.0",
    "tailwindcss": "^3.3.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0",
    "@headlessui/react": "^1.7.0",
    "lucide-react": "^0.292.0"
  }
}
```