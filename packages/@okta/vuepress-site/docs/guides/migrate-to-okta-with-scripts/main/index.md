---
title: Script your user migration with the Okta Users API
meta:
  - name: description
    content: Provides background and best practices to script your user migration from an external system to Okta using Okta APIs.
layout: Guides
---

This guide explains how you can programmatically migrate users from an external system to Okta. From your source data, use the following scripting options to create users and groups in Okta with the Okta Users API and the Okta Groups API.

---

#### Learning outcomes

Perform a bull migration of users into Okta by using the Okta APIs.

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
* Clean up your data to ensure it is consistent and valid

### Handling Rate Limits

* Be aware that rate limits apply to API requests depending on the level of service you have purchased from Okta
* Monitor rate limits in your script code using the Okta Rate Limit Headers
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

## Migration scrips for specific use cases

### Seamless, one-time migration


### One-time migration with authentication reset


### Migration program using inline password hooks

