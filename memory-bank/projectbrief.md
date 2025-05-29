# Project Brief: Kiosk Maintenance Helpdesk System

## Project Overview
Internal helpdesk system for managing kiosk maintenance across multiple client workspaces. Built with Next.js, Amplify Gen 2, TypeScript, and AWS services.

## Core Objectives
- Centralized kiosk maintenance management
- Multi-workspace architecture with access control
- Streamlined ticket management system
- User access control and workspace permissions
- Excel export capabilities for reporting

## Key Stakeholders
- Internal maintenance teams
- Workspace administrators
- Kiosk maintenance technicians
- Management (for reporting)

## Success Criteria
- Efficient kiosk maintenance tracking
- Clear workspace separation for different clients
- Proper access control between workspaces
- Comprehensive ticket management
- Easy reporting and data export

## Technical Foundation
- **Frontend**: Next.js with SSR (mandatory)
- **Backend**: Amplify Gen 2 (same codebase)
- **Authentication**: AWS Cognito
- **Database**: DynamoDB
- **Language**: TypeScript
- **Deployment**: AWS Amplify

## Project Scope
### In Scope
- Multi-workspace system
- Kiosk management with detailed attributes
- Ticket/maintenance record system
- User management and access control
- Multiple ticket board layouts (list, cards, kanban)
- Excel export functionality

### Out of Scope
- External client access (internal use only)
- Real-time notifications (future consideration)
- Mobile app (web-responsive only)

## Constraints
- Must use SSR for all pages
- Must leverage Amplify Gen 2 architecture
- Internal use only - no external client access
- Must maintain workspace isolation 