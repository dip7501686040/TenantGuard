import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create demo tenant
  const demoTenant = await prisma.tenant.create({
    data: {
      slug: "demo-corp",
      name: "Demo Corporation",
      domain: "demo-corp.com",
      status: "ACTIVE",
      plan: "enterprise",
      maxUsers: 1000,
      maxOrgs: 5,
      settings: {
        allowSelfSignup: true,
        requireMfa: false,
        passwordMinLength: 8,
        selfSignupDomains: ["demo-corp.com", "gmail.com"],
        defaultRole: "Employee",
        requireEmailVerification: true,
        selfSignupWelcomeMessage: "Welcome to Demo Corp! Please verify your email to get started."
      }
    }
  })

  console.log(`✅ Created tenant: ${demoTenant.name} (Self-signup enabled for @demo-corp.com and @gmail.com)`)

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      tenantId: demoTenant.id,
      name: "Demo Corp Organization",
      description: "Main organization for Demo Corporation",
      billingEmail: "billing@demo-corp.com"
    }
  })

  console.log(`✅ Created organization: ${organization.name}`)

  // Create accounts (development, staging, production)
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Development",
        accountType: "DEVELOPMENT",
        email: "dev@demo-corp.com"
      }
    }),
    prisma.account.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Staging",
        accountType: "STAGING",
        email: "staging@demo-corp.com"
      }
    }),
    prisma.account.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Production",
        accountType: "PRODUCTION",
        email: "prod@demo-corp.com"
      }
    })
  ])

  console.log(`✅ Created ${accounts.length} accounts`)

  // Create system roles
  const roles = await Promise.all([
    // Organization-level roles
    prisma.role.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Organization Admin",
        description: "Full access to organization and all accounts",
        isSystemRole: true,
        permissions: ["org:*", "account:*", "user:*", "role:*", "idp:*", "audit:read"]
      }
    }),
    prisma.role.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Account Admin",
        description: "Full access to specific accounts",
        isSystemRole: true,
        permissions: ["account:manage", "user:manage", "role:assign"]
      }
    }),
    prisma.role.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Developer",
        description: "Access to development resources",
        isSystemRole: true,
        permissions: ["resource:read", "resource:write", "account:read"]
      }
    }),
    prisma.role.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Employee",
        description: "Standard employee access - default for self-signup users",
        isSystemRole: true,
        permissions: ["resource:read", "account:read", "profile:manage"]
      }
    }),
    prisma.role.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Read Only",
        description: "Read-only access to resources",
        isSystemRole: true,
        permissions: ["resource:read", "account:read"]
      }
    })
  ])

  console.log(`✅ Created ${roles.length} system roles`)

  // Create break-glass admin user
  const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 12)
  const adminUser = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: "admin@demo-corp.com",
      username: "admin",
      passwordHash: adminPasswordHash,
      firstName: "System",
      lastName: "Administrator",
      isEmailVerified: true,
      status: "ACTIVE",
      isBreakGlass: true,
      mfaEnabled: false // Can be enabled later
    }
  })

  console.log(`✅ Created break-glass admin user: ${adminUser.email}`)

  // Create regular demo user
  const userPasswordHash = await bcrypt.hash("UserPassword123!", 12)
  const demoUser = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: "user@demo-corp.com",
      username: "demouser",
      passwordHash: userPasswordHash,
      firstName: "Demo",
      lastName: "User",
      isEmailVerified: true,
      status: "ACTIVE",
      mfaEnabled: false
    }
  })

  console.log(`✅ Created demo user: ${demoUser.email}`)

  // Create additional self-signup demo users to test the functionality
  const selfSignupUsers = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        email: "employee1@demo-corp.com",
        username: "employee1",
        passwordHash: await bcrypt.hash("Employee123!", 12),
        firstName: "John",
        lastName: "Employee",
        isEmailVerified: true,
        status: "ACTIVE",
        mfaEnabled: false
      }
    }),
    prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        email: "employee2@gmail.com",
        username: "employee2",
        passwordHash: await bcrypt.hash("Employee123!", 12),
        firstName: "Jane",
        lastName: "Employee",
        isEmailVerified: true,
        status: "ACTIVE",
        mfaEnabled: false
      }
    })
  ])

  console.log(`✅ Created ${selfSignupUsers.length} additional self-signup demo users`)

  // Assign default "Employee" role to self-signup users
  for (const user of selfSignupUsers) {
    // Add them to the development account
    await prisma.userAccount.create({
      data: {
        userId: user.id,
        accountId: accounts[0].id, // Development account
        tenantId: demoTenant.id
      }
    })

    // Assign Employee role (index 3 in roles array)
    await prisma.roleAssignment.create({
      data: {
        userId: user.id,
        roleId: roles[3].id, // Employee role
        accountId: accounts[0].id, // Scoped to development account
        tenantId: demoTenant.id,
        assignedBy: adminUser.id
      }
    })
  }

  // Assign admin user to organization with org admin role
  await prisma.roleAssignment.create({
    data: {
      userId: adminUser.id,
      roleId: roles[0].id, // Organization Admin
      tenantId: demoTenant.id,
      assignedBy: adminUser.id
    }
  })

  // Assign demo user to development account with developer role
  await prisma.userAccount.create({
    data: {
      userId: demoUser.id,
      accountId: accounts[0].id, // Development account
      tenantId: demoTenant.id
    }
  })

  await prisma.roleAssignment.create({
    data: {
      userId: demoUser.id,
      roleId: roles[2].id, // Developer role
      accountId: accounts[0].id, // Development account
      tenantId: demoTenant.id,
      assignedBy: adminUser.id
    }
  })

  console.log(`✅ Assigned roles to users`)

  // Create Google OAuth IdP configuration (placeholder)
  const googleIdp = await prisma.identityProvider.create({
    data: {
      tenantId: demoTenant.id,
      name: "Google Workspace",
      type: "OIDC",
      issuer: "https://accounts.google.com",
      clientId: "placeholder-google-client-id",
      clientSecret: "placeholder-google-client-secret",
      domain: "demo-corp.com",
      domainVerified: false,
      jitProvisioning: true,
      status: "INACTIVE" // Will be activated when properly configured
    }
  })

  console.log(`✅ Created Google IdP configuration: ${googleIdp.name}`)

  // Create sample policies
  const policies = await Promise.all([
    prisma.policy.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "MFA Required Policy",
        description: "Require MFA for all production access",
        effect: "DENY",
        actions: ["*"],
        resources: ["account:production:*"],
        conditions: {
          mfaRequired: true,
          accountType: "PRODUCTION"
        }
      }
    }),
    prisma.policy.create({
      data: {
        organizationId: organization.id,
        tenantId: demoTenant.id,
        name: "Business Hours Access",
        description: "Allow access only during business hours for sensitive operations",
        effect: "ALLOW",
        actions: ["resource:delete", "user:delete"],
        resources: ["*"],
        conditions: {
          timeRange: {
            start: "09:00",
            end: "17:00"
          },
          timezone: "UTC"
        }
      }
    })
  ])

  console.log(`✅ Created ${policies.length} policies`)

  // Create some audit log entries
  await Promise.all([
    prisma.auditLog.create({
      data: {
        tenantId: demoTenant.id,
        userId: adminUser.id,
        action: "user_created",
        resource: `user:${demoUser.id}`,
        details: {
          targetUser: demoUser.email,
          createdBy: adminUser.email
        },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        success: true
      }
    }),
    prisma.auditLog.create({
      data: {
        tenantId: demoTenant.id,
        userId: adminUser.id,
        action: "role_assigned",
        resource: `user:${demoUser.id}`,
        details: {
          role: "Developer",
          account: "Development",
          assignedBy: adminUser.email
        },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        success: true
      }
    })
  ])

  console.log(`✅ Created sample audit logs`)

  // ========================================
  // Create Small Business Tenant (Native Auth Only)
  // ========================================

  const smallTenant = await prisma.tenant.create({
    data: {
      slug: "acme-startup",
      name: "ACME Startup",
      status: "ACTIVE",
      plan: "basic",
      maxUsers: 10,
      maxOrgs: 1,
      settings: {
        allowSelfSignup: true,
        requireMfa: false,
        passwordMinLength: 6
      }
    }
  })

  console.log(`✅ Created small business tenant: ${smallTenant.name}`)

  // Create organization for small business
  const smallOrg = await prisma.organization.create({
    data: {
      tenantId: smallTenant.id,
      name: "ACME Startup Inc.",
      description: "Small startup organization",
      billingEmail: "billing@acme-startup.com"
    }
  })

  // Create single account for small business
  const smallAccount = await prisma.account.create({
    data: {
      organizationId: smallOrg.id,
      tenantId: smallTenant.id,
      name: "Main",
      accountType: "PRODUCTION",
      email: "main@acme-startup.com"
    }
  })

  // Create basic roles for small business
  const smallRoles = await Promise.all([
    prisma.role.create({
      data: {
        organizationId: smallOrg.id,
        tenantId: smallTenant.id,
        name: "Owner",
        description: "Full access to everything",
        isSystemRole: true,
        permissions: ["*"]
      }
    }),
    prisma.role.create({
      data: {
        organizationId: smallOrg.id,
        tenantId: smallTenant.id,
        name: "Employee",
        description: "Standard employee access",
        isSystemRole: true,
        permissions: ["resource:read", "resource:write", "profile:manage"]
      }
    })
  ])

  // Create owner user for small business
  const ownerPasswordHash = await bcrypt.hash("OwnerPassword123!", 12)
  const ownerUser = await prisma.user.create({
    data: {
      tenantId: smallTenant.id,
      email: "owner@acme-startup.com",
      username: "owner",
      passwordHash: ownerPasswordHash,
      firstName: "John",
      lastName: "Owner",
      isEmailVerified: true,
      status: "ACTIVE",
      isBreakGlass: true
    }
  })

  // Assign owner role
  await prisma.userAccount.create({
    data: {
      userId: ownerUser.id,
      accountId: smallAccount.id,
      tenantId: smallTenant.id,
      isOwner: true
    }
  })

  await prisma.roleAssignment.create({
    data: {
      userId: ownerUser.id,
      roleId: smallRoles[0].id, // Owner role
      accountId: smallAccount.id,
      tenantId: smallTenant.id,
      assignedBy: ownerUser.id
    }
  })

  console.log(`✅ Created small business setup with owner: ${ownerUser.email}`)

  console.log(`
🎉 Database seeded successfully!

📊 Summary:
  • 2 Tenants: Demo Corp (enterprise), ACME Startup (small business)
  • 2 Organizations with multiple accounts
  • System roles and policies
  • Sample users with different access levels
  • IdP configuration examples
  • Audit log entries

🔐 Login Credentials:
  Demo Corp (enterprise):
    • Admin: admin@demo-corp.com / AdminPassword123!
    • User:  user@demo-corp.com  / UserPassword123!
  
  ACME Startup (small business):
    • Owner: owner@acme-startup.com / OwnerPassword123!

🚀 Ready to start the application!
  `)
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
