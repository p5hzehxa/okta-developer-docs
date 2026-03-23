---
title: Script your user migration with the Okta Users API
meta:
  - name: description
    content: Provides background and best practices to script your user migration from an external system to Okta using Okta APIs.
layout: Guides
---

This guide explains how you can programmatically migrate users from an external system to Okta. Use the following scripting options with your source data to create users in Okta with the Okta Users API.

---

#### Learning outcomes

Perform a bulk migration of users into Okta by using the Okta APIs.

#### What you need

* [Okta Integrator Free Plan org](https://developer.okta.com/signup)
* Postman client to run API requests. See [Use Postman with the Okta REST APIs](https://developer.okta.com/docs/reference/rest/) for information on setting up Postman.
* Example or test source data to test user and group creation requests. (Don't use real user data when testing.)
* [A plan for migrating existing users to Okta](/docs/guides/migrate-to-okta-prerequisites/)

#### Sample code

<!-- Other than scripts used in this guide, is there other code we can reference? -->

---

## Preparation and Best Practices

Before migrating your users to Okta, careful planning and preparation are essential to ensure a smooth, secure, and efficient migration process. The following best practices cover key areas to consider throughout your migration project.

### Reading from the Source Provider

* Gather your user data into a staging area, such as a secure database or a CSV file
* Define the attribute mappings from your source system to the Okta user profile target fields
* Clean up your data to ensure it's consistent and valid

### Handling Rate Limits

* Be aware that rate limits apply to API requests depending on the level of service you have purchased from Okta
* Monitor rate limits in your script code using Okta Rate Limit Headers
* Work with Okta support to plan your migration during a time when your rate limits can be temporarily adjusted

### Security Considerations

* Ensure that passwords remain strictly encrypted to prevent exposure when handling sensitive data and hashed passwords
* Verify that no user profile directories or legacy databases have direct exposure to the public internet
* Remember that information security and protecting customer personally identifiable information (PII) is a critical priority

### Testing

* Create test data sets with multiple batches of progressively larger loads before attempting a production migration
* Use sample data that mimics your real user data to identify potential issues
* Do not use real user data when testing
* Use clients like Postman to securely test your script's user and group creation API requests

## Migration scripts for specific use cases

The following JavaScript code imports users from your source data in the following three scenarios:

* Seamless, one-time migration: This scenario imports users with their hashed password and makes their account active.

* One-time migration with authentication reset: This scenario imports users without credentials and their account is staged.

* Migration program using Okta password inline hooks: This scenario imports users who can migrate their existing password on first sign-in. This requires the configuration of an [Okta Password import inline hook](/docs/guides/password-import-inline-hook/nodejs/main/).

The following JavaScript file contains all three scenarios:

```javascript
#!/usr/bin/env node

// User data
const users = [
  {
    firstName: 'Bob',
    lastName: 'Guerin3',
    email: 'bob.guerin3@example.com',
    salt: 'pwxb1yjwfpa6jcV0XKBtau', // Data for hashed password scenario
    hashedPassword: 'MnDMlKOOxMY4Tc.7wgpqFoAPYKi5wSe' // Data for hashed password scenario
  },
  {
    firstName: 'Kim',
    lastName: 'Sanjay2',
    email: 'kim.sanjay2@example.com',
    salt: 'pwxb1yjwfpa6jcV0XKBtau', // Data for hashed password scenario
    hashedPassword: 'MnDMlKOOxMY4Tc.7wgpqFoAPYKi5wSe' // Data for hashed password scenario
  },
  {
    firstName: 'Raj',
    lastName: 'Sharma2',
    email: 'rajiv.sharma2@example.com',
    salt: 'pwxb1yjwfpa6jcV0XKBtau', // Data for hashed password scenario
    hashedPassword: 'MnDMlKOOxMY4Tc.7wgpqFoAPYKi5wSe' // Data for hashed password scenario
  }
];

// Get environment variables
const oktaDomain = process.env.OKTA_ORG_URL;
const accessToken = process.env.OKTA_ACCESS_TOKEN;

if (!oktaDomain || !accessToken) {
  console.error('\x1b[31m❌ Error:\x1b[0m OKTA_ORG_URL and OKTA_ACCESS_TOKEN environment variables are required');
  console.error('\nExample:');
  console.error('  export OKTA_ORG_URL="https://example.okta.com"');
  console.error('  export OKTA_ACCESS_TOKEN="your_access_token_here"');
  console.error('  node import-users-cli.js');
  process.exit(1);
}

// Normalize domain
const domain = oktaDomain.replace(/https?:\/\//, '').replace(/\/$/, '');

// Check for command-line flags
const args = process.argv.slice(2);
const isStaged = args.includes('--staged');
const isHook = args.includes('--hook');

async function importUsersWithCredentials() {
  let createdCount = 0;
  let failureCount = 0;

  console.log('\n\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[36mOkta User Importer - Active Users (With Credentials)\x1b[0m');
  console.log('\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log(`\nStarting import of \x1b[1m${users.length}\x1b[0m users...\n`);

  for (const user of users) {
    const query = new URLSearchParams({
      activate: 'true',
      provider: 'true'
    }).toString();

    const body = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.email
      },
      credentials: {
        password: {
          hash: {
            algorithm: 'BCRYPT',
            workFactor: 10,
            salt: user.salt,
            value: user.hashedPassword
          }
        }
      }
    };

    try {
      const response = await fetch(
        `https://${domain}/api/v1/users?${query}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`\x1b[31m❌ Failed to create ${user.email}\x1b[0m`);
        console.log(`   \x1b[90mError: ${errorData.errorSummary}\x1b[0m`);
        failureCount++;
      } else {
        const data = await response.json();
        console.log(`\x1b[32m✓ Created user: ${user.firstName} ${user.lastName} (${user.email})\x1b[0m`);
        createdCount++;
      }
    } catch (error) {
      console.log(`\x1b[31m❌ Error creating ${user.email}\x1b[0m`);
      console.log(`   \x1b[90mError: ${error.message}\x1b[0m`);
      failureCount++;
    }
  }

  // Display summary
  console.log('\n\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[36mImport Summary\x1b[0m');
  console.log('\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log(`Total users created: \x1b[32m${createdCount}\x1b[0m`);
  console.log(`Total failures: \x1b[31m${failureCount}\x1b[0m`);
  console.log(`Total processed: \x1b[1m${createdCount + failureCount}\x1b[0m\n`);
}

async function importStagedUsers() {
  let createdCount = 0;
  let failureCount = 0;

  console.log('\n\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[36mOkta User Importer - Staged Users (No Credentials)\x1b[0m');
  console.log('\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log(`\nStarting import of \x1b[1m${users.length}\x1b[0m users...\n`);

  for (const user of users) {
    const query = new URLSearchParams({
      activate: 'false'
    }).toString();

    const body = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.email
      }
    };

    try {
      const response = await fetch(
        `https://${domain}/api/v1/users?${query}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`\x1b[31m❌ Failed to create ${user.email}\x1b[0m`);
        console.log(`   \x1b[90mError: ${errorData.errorSummary}\x1b[0m`);
        failureCount++;
      } else {
        const data = await response.json();
        console.log(`\x1b[32m✓ Created user: ${user.firstName} ${user.lastName} (${user.email})\x1b[0m`);
        createdCount++;
      }
    } catch (error) {
      console.log(`\x1b[31m❌ Error creating ${user.email}\x1b[0m`);
      console.log(`   \x1b[90mError: ${error.message}\x1b[0m`);
      failureCount++;
    }
  }

  // Display summary
  console.log('\n\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[36mImport Summary\x1b[0m');
  console.log('\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log(`Total users created: \x1b[32m${createdCount}\x1b[0m`);
  console.log(`Total failures: \x1b[31m${failureCount}\x1b[0m`);
  console.log(`Total processed: \x1b[1m${createdCount + failureCount}\x1b[0m\n`);
}

async function importUsersWithHook() {
  let createdCount = 0;
  let failureCount = 0;

  console.log('\n\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[36mOkta User Importer - Active Users (With Inline Hook)\x1b[0m');
  console.log('\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log(`\nStarting import of \x1b[1m${users.length}\x1b[0m users...\n`);

  for (const user of users) {
    const query = new URLSearchParams({
      activate: 'true'
    }).toString();

    const body = {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.email
      },
      credentials: {
        password: {
          hook: {
            type: 'default'
          }
        }
      }
    };

    try {
      const response = await fetch(
        `https://${domain}/api/v1/users?${query}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`\x1b[31m❌ Failed to create ${user.email}\x1b[0m`);
        console.log(`   \x1b[90mError: ${errorData.errorSummary}\x1b[0m`);
        failureCount++;
      } else {
        const data = await response.json();
        console.log(`\x1b[32m✓ Created user: ${user.firstName} ${user.lastName} (${user.email})\x1b[0m`);
        createdCount++;
      }
    } catch (error) {
      console.log(`\x1b[31m❌ Error creating ${user.email}\x1b[0m`);
      console.log(`   \x1b[90mError: ${error.message}\x1b[0m`);
      failureCount++;
    }
  }

  // Display summary
  console.log('\n\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[36mImport Summary\x1b[0m');
  console.log('\x1b[36m' + '='.repeat(50) + '\x1b[0m');
  console.log(`Total users created: \x1b[32m${createdCount}\x1b[0m`);
  console.log(`Total failures: \x1b[31m${failureCount}\x1b[0m`);
  console.log(`Total processed: \x1b[1m${createdCount + failureCount}\x1b[0m\n`);
}

// Run the appropriate import function
let importFn;
if (isHook) {
  importFn = importUsersWithHook;
} else if (isStaged) {
  importFn = importStagedUsers;
} else {
  importFn = importUsersWithCredentials;
}

importFn().catch(error => {
  console.error('\x1b[31m❌ Fatal error:\x1b[0m', error.message);
  process.exit(1);
});
```

### Make secure API requests with OAuth 2.0

This script supports API access through scoped OAuth 2.0 access tokens, and uses the following scope to manage users: `okta.users.manage`.

<CreateOAuth2Token/>

### Test data

The test data for this example migration script appears at the beginning in the constant value, `const users`. This value is a prepopulated static array of usernames and passwords, as well as other data, depending on the user import scenario run. Modify this data with real-word values for your testing purposes. Or update this script to use your data source.

### Install and run the script

1. In your project directory, create the script (Note you need node version 18.17.0 or higher to run this javascript)
1. Add your Okta Org URL and OAuth 2.0 Access Token as environment variables
1. If necessary, modify the static test data with users and values for your testing.
1. Run it!

## Seamless, one-time migration
explain

## One-time migration with authentication reset


## Migration program using inline password hooks

