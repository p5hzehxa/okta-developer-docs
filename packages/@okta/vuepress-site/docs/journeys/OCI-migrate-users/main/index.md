---
title: Migrate your human, non-Okta user accounts to Universal Directory
meta:
  - name: description
    content: Provide a smooth and secure activation experience as you move human user identities into Universal Directory from another user store.
    date-updated: March 27, 2026
    target persona: Administrator, Developer, Security Team
    level: Intermediate
sections:
- main
---

## Introduction

Your company has adopted the Okta Platform and wants to use Universal Directory as the single point of identity access management information for all its users. This gives it access to Okta's full complement of [User Access Management](https://www.okta.com/identity-101/user-access-management/) features and functionality. To achieve this, you need to migrate human user identities from a source provider, which is a local Active Directory or LDAP server or another third-party identity provider.

Devise a user migration strategy based on your company's needs, timelines, and source data. Configure Universal Directory to receive the new identities and assign them to the correct apps and APIs. Prepare the source provider and its contents for migration, and then import your data. Use the KPIs you've identified as part of your strategy to measure your success.

## Learn

Learn the basics that you need to lay the foundations for your work:

* [Universal Directory (UD)](/docs/concepts/universal-directory/) is the central store for user information in your Okta org.
* [The Users API](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/user) provides operations to create new user accounts in your org. (info)
* [The Groups API](https://developer.okta.com/docs/api/openapi/okta-management/management/tags/group) provides operations to manage Okta groups and their user members. (info)
* [Password import inline hooks](h/docs/concepts/inline-hooks/) help to move users' password to UD from a source provider during migration. (info)

## Plan

Plan your migration around four key points:

* [What data are you migrating?](): Identify the users and groups to migrate, the IAM data to import into UD vs the profile data that needs to go elsewhere, and the apps they need to access. Validate the data quality. Consider data privacy and regulations.
* [Migration type](): Choose between a one-time migration and a phased program. The one-time approach moves all users and credentials at once. In contrast, a phased program moves data slowly over time. The source provider stays active during this on-demand process. Base your decision on your current user store and your deadlines.
* [End-user experience](): Decide on the right migration experience for your users. Determine if you want to prioritize convenience or immediate security. Select a seamless migration to offer a frictionless user experience. This keeps users unaware that their accounts have been migrated. Select a staged migration to take advantage of Okta's features. This improves security right away but requires user action.
* [Measuring success](): Define KPIs to measure the worth and success of your migration. Try to balance the inherent value of the project with a lack of user disruption and overall security goals.

With your strategy set using the guide above, and the implmentation using the guides in the next section, create the following test and rollback plans:

* [Create a realistic set of test data and test your migration]().
* Create a rollback plan for the migration.

## Build

You are now ready to build your migration solution. In this section, you execute your migration strategy from start to finish. First, you prepare Universal Directory to receive your users. Then, you connect your apps and perform the user import.

### Run your strategy

To execute your migration strategy, begin by configuring the user account profiles for the new users, the groups they will belong to, and the applications they can access. Connect your apps and APIs to Okta, and then import your users.
Configure Universal Directory
Prepare Universal Directory to receive the new user accounts.

Create your needed user groups. Use the Admin Console (info) if you prefer a GUI or the Groups API if you prefer to script. (info)
Create a user profile for the new user accounts. (info)
Set the authentication factors (e.g., password, email, phone) that users must use to validate their identity with an authenticator enrollment policy. (info)
Connect your apps and APIs to Okta
Your apps and API won't be able to use your source provider to authenticate users post-migration. Ensure that your apps and API authenticate your users with Okta as well as your source provider. 

Search the OIN catalog for Okta-enabled versions of your third-party apps (info)
Update your apps to use Okta as an identity provider
Update your app's sign-in form to connect to Okta (info)
Make your app a multi-tenant OIDC app with Okta as an additional identity provider (info)
Update your APIs to use Okta as an identity provider (info)
Create authentication policies for your apps and APIs that mirror the existing sign-in experience with the source provider, or that enhance it as you have planned. (info)

> Note : Contact your Technical Account Manager for further assistance migrating your apps to Okta.

Import your user accounts into Universal Directory
Extract the user data from the source provider into an intermediate staging area. Clean up that data so that it's consistent and contains only valid information as you did for the test. (info)

For a seamless, one-time migration, where users are unaware their account has been moved, import users' hashed password with their details, and make their account active:

Use the Users API to create active user accounts with the hashed password. (info)
Send users notification to sign in normally.

For a one-time migration with authentication reset, where users must reset their authentication details to activate their account, import users' details, and make their account staged:

Use the Users API to create staged user accounts without credentials. (info)
Alternatively, you can bulk import user details from a CSV file. (info)
Send users notification to reactivate their accounts. (Mass-select users in Okta and click Activate to send "Welcome/Set Password" emails.)

For a migration program, where users passwords are migrated on their first sign-in to an application from the source provider:

Create a password import inline hook
to a local Active Directory or LDAP server (info)
to a third-party identity provider (info)
Use the Okta Users API to create active user accounts with provider type and name set to IMPORT, and the inline hook attached. (info)
Send that user a notification to sign in normally 

Note that if your system currently uses Active Directory agents to synchronize passwords with Okta for SSO, you can also use the AD Agent to migrate passwords to Okta. (info)

If you have stored your user's non-IAM profile data in another system, use the User Id returned by the Users API as a reference point to connect it. Find the user IDs after creation by calling List All Users (info)
End the migration program (if applicable)
When planning a migration program, you set a fixed period to leave the inline hook in service. At the end of this period, the majority of your users have migrated their account. At this point, you can either:

Use the User Credentials API to force a password reset for those users still with credentials.provider.type set to IMPORT. Those users would receive an email to set their password with a link to follow. (info)
Consider those users as stale accounts who must recreate their accounts to gain access to your applications again.

Finally, you can retire your legacy system from service.

Congratulations - you have successfully designed and implemented a migration plan for your user accounts to Universal Directory. Once activated, your new user accounts will be stored and assigned the correct types, roles, groups and attributes. They will also link to the user's original account in the source data store if needed. The KPIs you have set as part of the plan will keep you mindful of the requirements for its success. Your users will not notice the migration has taken place unless you've designed it that way.

## Related Topics

To complement your user migration campaign, consider a way to provision and deprovision applications to your new users.

Adding a SCIM interface to your apps allows admins to control user access centrally (info)
Creating a custom provisioning flow for third party apps with Okta Workflows (info)
Search the Okta Integration Network for provisioning flows and SCIM-ready apps that already exist. (info)

Learn more about working with non-human identities (NHIs)

Okta secures AI (info)
What is non-human identity security? (info)
The non-human identity lifecycle (info)

