# Multi-Tenant SaaS Starter Kit

![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=node.js)
![Fastify](https://img.shields.io/badge/Fastify-5.x-black?style=flat-square&logo=fastify)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=flat-square&logo=postgresql)

A high-performance, security-focused **Multi-Tenant SaaS Starter Kit** backend built with **Fastify 5, TypeScript, Prisma, PostgreSQL, Zod, JWT, otplib, and OAuth2**.

---

## ⚡ Multi-Tenant Architecture & Features

<details>
<summary><b>1. Authentication & Security Engine (Done)</b></summary>

- Short-lived Access Tokens (15m) + Long-lived `HttpOnly` Refresh Cookies (7d)
- **Refresh Token Rotation (RTR):** Single-use tokens with automatic reuse detection that invalidates session families upon compromise
- **Adaptive Account Lockout:** Exponential backoff ($1 \times 5^{n-1}$ minutes) to resist brute-force attacks
- **2FA & OAuth:** RFC 6238 TOTP (Google Authenticator) + Google OAuth2 with PKCE/CSRF state protection
- **Audit Trails:** Security-relevant audit logging with IP and User-Agent tracking
</details>

<details>
<summary><b>2. Tenancy Model (Shared DB, Shared Schema)</b></summary>

- **Tenant Isolation Strategy:** Shared PostgreSQL database enforcing software-level row isolation via global `tenantId` keys
- **Context Propagation:** Request-bound context handling via Fastify hooks avoiding manual parameters passing through layers
- **Workspace Membership:** Junction-table mapping allowing single users to belong to multiple tenants with distinct roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`)
</details>

---

## 🗺️ Implementation Roadmap

### Phase 1: Tenancy Core & Workspace Context (Current Focus)
- [ ] **Schema Migration:** Add `Tenant`, `TenantMember`, `TenantInvitation`, and `Project` models to Prisma schema; add `activeTenantId` to `RefreshToken`
- [ ] **Atomic Onboarding:** Build `POST /api/tenants` pipeline using Prisma `$transaction` to provision workspace, generate URL slug, and assign creator as `OWNER`
- [ ] **Context Resolution Middleware:** Fastify `preHandler` hook extracting `tenantId` from `X-Tenant-ID` header, subdomains, or route params and validating membership
- [ ] **Tenant Switching Engine:** Build `POST /api/auth/switch-tenant` to issue updated JWTs containing active workspace claims

### Phase 2: Role Access & Team Management
- [ ] **Tenant RBAC Guards:** Route authorization helpers checking member roles before granting admin access
- [ ] **Invitation Engine:** Cryptographic email invitation tokens (`POST /api/tenants/:tenantId/invitations`) and acceptance flow (`POST /api/tenants/invitations/accept`)
- [ ] **Member Management:** Endpoints to list, update roles, or remove members from workspaces

### Phase 3: Data Isolation & Billing
- [ ] **Prisma Query Extensions:** Auto-inject `where: { tenantId }` filters on CRUD operations via Prisma Client Extensions (`$extends`)
- [ ] **Stripe Webhook Sync:** Sync payment completions (`checkout.session.completed`) and status updates (`ACTIVE`, `PAST_DUE`) to tenant records
- [ ] **Entitlements Gating:** Access control middleware restricting premium endpoints based on workspace plan (`planId`)

---

## 📐 Architecture Flow

```mermaid
graph TD
    Client[Client / Browser] -->|HttpOnly Cookies / Headers| Fastify[Fastify 5 Gateway + Zod Validation]
    Fastify -->|1. Authenticate JWT| AuthGuard[Auth Guard Middleware]
    AuthGuard -->|2. Extract Context| TenantResolver[Tenant Resolution Hook]
    
    subgraph Multi-Tenant Core Engine
        TenantResolver -->|3. Validate Membership| MemberGuard[Tenant Member Guard]
        MemberGuard -->|4. Auto-Inject tenant_id| PrismaExt[Prisma Extension $extends]
    end

    subgraph Security & Storage Layer
        AuthGuard -->|Session / Token Check| SessionEngine[Session & RTR Family Engine]
        PrismaExt -->|Isolated Queries| Postgres[(PostgreSQL Database)]
    end

### Phase 5: Enterprise Features & Market Differentiation
- [ ] **Enterprise SSO (SAML 2.0 / OIDC):** Support Okta, Azure AD, and Google Workspace integrations.
- [ ] **Outbound Webhooks System:** HMAC-signed event dispatching (`X-Signature-256`) with exponential backoff retries.
- [ ] **Developer Platform (API Keys):** Scoped, hashed API key management (`sk_live_...`) for developer integration.
- [ ] **Tenant Feature Flags:** Turn features on/off per workspace or subscription tier.
- [ ] **Exportable Tenant Audit Logs:** In-app interface and CSV/JSON exporter for compliance audits.
