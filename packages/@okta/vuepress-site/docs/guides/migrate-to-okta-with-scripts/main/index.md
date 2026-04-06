---
title: Script your user migration with the Okta Users API
meta:
  - name: description
    content: Provides background and best practices to script your user import from an external system to Okta using Okta APIs.
layout: Guides
---

This guide explains how you can programmatically import users from an external system to Okta. Use the following scripting options with your source data to create users in Okta with the Okta Users API.

---

#### Learning outcome

Perform a bulk migration of users into Okta by using the Okta APIs.

#### What you need

* [Okta Integrator Free Plan org](https://developer.okta.com/signup)
* Example or test source data to test user and group creation requests. (Don't use real user data when testing.)
* [A plan for migrating existing users to Okta](/docs/guides/migrate-to-okta-prerequisites/)

#### Sample code

Use the JavaScript sample code included in this guide to run three bulk-import scenarios.

---

## Preparation and Best Practices

Before importing your users to Okta, careful planning and preparation are essential to ensure a smooth, secure, and efficient migration process. The following best practices cover key areas to consider throughout your import project.

### Prepare your source data

* Gather your user data into a staging area, such as a secure database or a CSV file.
* Define the attribute mappings from your source system to the target fields of the Okta user profile.
* Clean up your data to ensure it's consistent and valid.

### Handle Rate Limits

* Rate limits apply to API requests depending on the level of service that you’ve purchased from Okta.
* Monitor rate limits in your script code using Okta rate-limit headers.
* Work with Okta Support to plan your migration during a time when your rate limits can be temporarily adjusted.

### Security Considerations

* Ensure that passwords remain strictly encrypted to prevent exposure when handling sensitive data and hashed passwords.
* Verify that no user profile directories or legacy databases have direct exposure to the public internet.
* Remember that information security and protecting customer personally identifiable information (PII) is a critical priority.

### Test your scripts

* Create test data sets with multiple batches of progressively larger loads before attempting a production import.
* Use sample data that mimics your real user data to identify potential issues.
* Don’t use real user data when testing.
* Use clients like Postman to securely test your script's user creation API requests.

## Import script for specific use cases

The following JavaScript code imports users from your source data into Okta in one of the following three scenarios:

* Seamless, one-time migration: This scenario imports users with their hashed passwords and makes their accounts active.

* One-time migration with authentication reset: This scenario migrates users without credentials and stages their accounts.

* Migration program using Okta password inline hook: This scenario imports users who can migrate their existing password on first sign in. This requires the configuration of an [Okta password import inline hook](/docs/guides/password-import-inline-hook/nodejs/main/).

The following JavaScript file contains all three scenarios:

```javascript
#!/usr/bin/env node

// User data
const users = [
  {
    firstName: 'Jessie',
    lastName: 'Smith',
    email: 'jessie.smith@example.com',
    salt: 'pwxb1yjwfpa6jcV0XKBtau', // Data for hashed password scenario
    hashedPassword: 'MnDMlKOOxMY4Tc.7wgpqFoAPYKi5wSe' // Data for hashed password scenario
  },
  {
    firstName: 'Kim',
    lastName: 'Sato',
    email: 'kim.sato@example.com',
    salt: 'pwxb1yjwfpa6jcV0XKBtau', // Data for hashed password scenario
    hashedPassword: 'MnDMlKOOxMY4Tc.7wgpqFoAPYKi5wSe' // Data for hashed password scenario
  },
  {
    firstName: 'Rajiv',
    lastName: 'Tal',
    email: 'rajiv.tal@example.com',
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

This script supports API access through scoped OAuth 2.0 access tokens and uses the following scope to manage users: `okta.users.manage`.

<CreateOAuth2Token/>

### Test data for user import

The test data for this example migration script appears in the constant value, `const users`. This simplified data source is a prepopulated static array of usernames, passwords, and other profile data. The data used during the import process depends on the user import scenario run by the user. Modify this data with real-world values for your testing purposes, or update this script to use your data source.

### Create and run the script

1. In your project directory, create a JavaScript file called `import-users-cli.js` and copy the previous JavaScript code into the file.
    > **Note:** You need Node.js version 18 or higher to run this script.
1. Add your Okta Org URL and OAuth 2.0 Access Token as environment variables:

    * `export OKTA_ORG_URL="https://example.okta.com"`
    * `export OKTA_ACCESS_TOKEN="eyJraWQiOiJHUkp2ckJsTHFUOHR....qK3bcwjwG16NW87g"`

1. If necessary, modify the static test data with user records and field values for your test scenario.
1. Run the script with Node.js based on the scenario that you'd like to implement:

    * `node import-users-cli.js` for the migration of users with hashed passwords

    * `node import-users-cli.js --staged` for the migration of staged users without credentials

    * `node import-users-cli.js --hook` for the migration of users with a password import inline hook

See the following sections for details on the Users API requests that complete each scenario.

## Seamless, one-time migration

This scenario imports users with their existing hashed passwords and immediately activates their accounts. Users can sign in immediately after import without needing to reset their password. This approach is ideal when you want to minimize friction during migration and users can retain their existing credentials.

The following example shows the Users API request body for this scenario:

```json
POST https://{yourOktaDomain}/api/v1/users?activate=true

{
  "profile": {
    "firstName": "Jessie",
    "lastName": "Smith",
    "email": "jessie.smith@example.com",
    "login": "jessie.smith@example.com"
  },
  "credentials": {
    "password": {
      "hash": {
        "algorithm": "BCRYPT",
        "workFactor": 10,
        "salt": "pwxb1yjwfpa6jcV0XKBtau",
        "value": "MnDMlKOOxMY4Tc.7wgpqFoAPYKi5wSe"
      }
    }
  }
}
```

#### Key values for this scenario:

* `activate=true`: Immediately activates the user account (the default value is `true`)
* `algorithm`: The hashing algorithm used for the password. This script used BCRYPT by default.
* `workFactor`: The cost factor for the algorithm. This example used 10 by default.
* `salt`: The salt value used in the original password hash
* `value`: The hashed password value from your source system

See the [Create a User API](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/user/section/create-user-with-password#section/Create-user-with-imported-hashed-password).

## One-time migration with authentication reset

This scenario imports users without credentials and stages their accounts. Staged users don't have an active password and must complete an authentication reset through email before they can sign in. This approach is ideal when you don't have access to hashed passwords from your source system, or you want to force users to set a new password during their first sign in to Okta.

The following example shows the Users API request body for this scenario:

```json
POST https://{yourOktaDomain}/api/v1/users?activate=false

{
  "profile": {
    "firstName": "Jessie",
    "lastName": "Smith",
    "email": "jessie.smith@example.com",
    "login": "jessie.smith@example.com"
  }
}
```

**Key values for this scenario:**

* `activate=false`: Stages the user account without activating it
* `profile`: Contains only user profile information (`name`, `email`, and `login`)

After import, users receive an email with instructions to activate their account and set a new password.

See the [Create a User API](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/user/section/create-user-with-optional-password#section/Create-user-without-credentials).

## Migration program using inline password hooks

This scenario imports users with active accounts and allows them to use their existing passwords on first sign in through a password import inline hook. The user's password is validated through your custom hook logic, which can authenticate against your legacy system or hashed password database. This approach is ideal when you want users to retain their original passwords during migration and have a more gradual password transition period.

> **Note:** This scenario requires the configuration of an [Okta password import inline hook](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/inlinehook/webhooks/createpasswordimportinlinehook) before you run the import script.

The following example shows the Users API request body for this scenario:

```json
POST https://{yourOktaDomain}/api/v1/users?activate=true

{
  "profile": {
    "firstName": "Jessie",
    "lastName": "Smith",
    "email": "jessie.smith@example.com",
    "login": "jessie.smith@example.com"
  },
  "credentials": {
    "password": {
      "hook": {
        "type": "default"
      }
    }
  }
}
```

**Key values for this scenario:**

* `activate=true`: Immediately activates the user account (the default value is `true`)
* `hook.type: "default"`: Specifies that a password import inline hook should be used for authentication
* `profile`: Contains user profile information (`name`, `email`, and `login`)

On first sign in, the user's credentials are sent to your configured password import inline hook, which validates them against your legacy system and either grants access or returns an error. See the [Create a User API](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/user/section/create-user-with-imported-hashed-password#section/Create-user-with-password-import-inline-hook).

For examples on how to implement the password import inline hook, see:

* [Password import inline hook](/docs/guides/password-import-inline-hook/)
* [Migrate User Passwords with Okta's Password Hook](https://developer.okta.com/blog/2020/09/18/password-hook-migration)
