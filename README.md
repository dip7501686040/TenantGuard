# TenantGuard - Multi-Tenant IAM System

A comprehensive Identity and Access Management system designed for multi-tenant SaaS platforms that provides object storage services to businesses of different sizes.

## Architecture Overview

### High-Level Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │────│   (NestJS)      │────│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │ External IdPs   │
                       │ (Google, Azure, │
                       │  Okta, SAML)    │
                       └─────────────────┘
```

### Core Features

1. **Multi-Tenancy & Isolation**
   - Complete tenant isolation for users, groups, IdPs, and roles
   - Unique IdP enforcement with domain verification
   - Tenant-specific subdomain routing

2. **Organization & Multi-Account Structure**
   - AWS-like organization model with multiple accounts
   - Hierarchical permission management
   - Delegated administration capabilities

3. **Flexible Authentication**
   - Native auth (username/password + MFA) for small businesses
   - Federated SSO (SAML/OIDC) for enterprises
   - Break-glass superadmin accounts

4. **Advanced Authorization**
   - Role-Based Access Control (RBAC)
   - Org-level and account-level permissions
   - Extensible to Attribute-Based Access Control (ABAC)

5. **Security Controls**
   - MFA enforcement
   - IdP metadata validation
   - Comprehensive audit logging
   - JWT/OAuth2 token-based API access

## Project Structure

```
TenantGuard/
├── backend/           # NestJS API server
├── frontend/          # React application
├── docs/             # Documentation and architecture diagrams
└── README.md         # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (for session management)

### Development Setup

1. Clone the repository
2. Set up the backend (see backend/README.md)
3. Set up the frontend (see frontend/README.md)
4. Configure environment variables
5. Run database migrations
6. Start the development servers

## Example Use Cases

### Tenant A: Small Business (Native Auth)
- 10 users with username/password authentication
- MFA enforcement
- Single account structure
- Role-based permissions

### Tenant B: Large Enterprise (Federated Auth)
- 1000+ users via Azure AD SSO
- Multiple accounts (dev, staging, production)
- Organization-wide policies
- Delegated administration

## Security Considerations

- Tenant isolation at database level
- IdP uniqueness validation
- Domain ownership verification
- Comprehensive audit logging
- Token rotation and refresh mechanisms