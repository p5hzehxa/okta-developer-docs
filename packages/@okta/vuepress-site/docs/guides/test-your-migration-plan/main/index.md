---
title: Test your migration plan
meta:
  - name: description
    content: Test your Okta user migration before production.
layout: Guides
---

This guide explains how to create test scenarios and execute migration tests to ensure a successful production migration. 

---

#### Learning outcomes

Test your migration method before moving to production.

#### What you need

* [A plan for migrating existing users to Okta](/docs/guides/migrate-to-okta-prerequisites/)
* User data extracted into a staging area
* [Okta Integrator Free Plan org](https://developer.okta.com/signup) for testing
* Understanding of which data attributes impact identity and access management

---

## Review and clean your data
Before testing, extract user data from your source systems into an intermediate staging area to clean it. This ensures that the data reaching Okta is consistent and valid.

#### Focus on IAM-relevant data

Before testing your migration, identify which data is relevant for Identity and Access Management (IAM). Migrate only IAM-relevant data to Okta. Store other data in a separate data warehouse and link it to your Okta user records.

#### What is IAM-relevant data

IAM-relevant data includes attributes that directly impact authentication or authorization:

* **Authentication**: Login credentials, multifactor authentication settings, password policies
* **Authorization**: Group memberships that control access to apps or resources
* **App access**: Attributes that are used for app assignment or provisioning
* **Security policies**: Level of assurance, authentication context, risk-based access policies

#### What is NOT IAM-relevant data

Non-IAM data includes attributes that don't affect access control:

* Organizational data that doesn't impact permissions (department names, cost centers)
* Personal preferences unrelated to authentication (office location, phone extension)
* Business reporting data (employee ID, hire date, manager) unless used for access decisions
* Arbitrary metadata that changes frequently but doesn't affect IAM decisions

### Why this matters

Consider a large enterprise with 300,000 users and 50,000 groups where only 10,000 groups actually impact IAM. Migrating all 50,000 groups could create up to 2.3 billion permutations. When a non-IAM attribute changes (like a "preferred units" field switching from metric to imperial), every affected user record update. If not optimized, this triggers unnecessary sync jobs, degrades performance, and increases maintenance overhead without providing any IAM benefit.

Okta is optimized for identity and access management, not as a general-purpose database for reporting, analytics, or storing historical data. Okta recommends using a database that is tuned for the ad hoc queries in a data warehouse or integrating a security event purpose-built system directly with a Security Information and Event Management (SIEM) system.

**Note:**  Okta also has specific products tailored to intruder threat protection (ITP), Identity Security Posture Management (ISPM), governance, and lifecycle management (LCM) for end-to-end IAM outcomes.

Okta treats this migration as an opportunity to sanitize and normalize source data to align strictly with IAM requirements, avoiding the ingestion of unnecessary or unclean records. To maintain data integrity for future needs, a reference to the origin system will be retained to facilitate downstream linking without bloating the identity directory.

### Recommended approach

1. **Identify IAM-relevant attributes**: Review your user schema and identify which attributes actually impact authentication or authorization.
2. **Create a focused attribute mapping**: Map only IAM-relevant attributes to Okta user profiles.
3. **Store non-IAM data elsewhere**: Use a data warehouse for business and reporting data.
4. **Link records**: Connect Okta user records to your data warehouse using a common identifier (employee ID or email).
5. **Keep Okta lean**: Add custom attributes only when they serve an IAM purpose.

This focused approach improves performance, simplifies maintenance, reduces sync overhead, and provides clearer IAM governance.

## Create a test plan

Once you have clean data, create test data to validate your migration method. Testing uncovers issues with your data or migration process before production.

Prepare test data for these scenarios:

* Data at the tail end of a process or calculation to identify upstream issues quickly
* Externally facing data
* Data under regulation or privacy standards
* Data that triggers significant revenue or productivity processes downstream

Your test plan should include:

* **Test scenarios**: Specific use cases to validate (user login, group assignment, app provisioning)
* **Success criteria**: Define what passing means for each test case
* **Test environment**: Configure your test Okta org to mirror production
* **Test data coverage**: Include edge cases, special characters, and boundary conditions

## Create test data

Create multiple batches of test data with varied conditions:

* **Small batch (10-100 users)**: Validate data mapping and transformation logic
* **Medium batch (100-1,000 users)**: Test group assignments, app provisioning, and edge cases
* **Large batch (1,000+ users)**: Test performance and identify bottlenecks

Plan more test loads as you make configuration and development changes. Plan progressively larger loads to monitor performance indicators.

Ensure that your test data represents the diversity of your production user base:

* Users with minimal attributes vs. fully populated profiles
* Different user types (employees, contractors, partners, customers)
* Various group membership scenarios
* Special characters in names and attributes
* International characters and formats

## Run your tests

Execute all test cases and capture failed cases in a defect log.

### Test execution

1. Run tests systematically from small to large batches
2. Monitor for errors, warnings, and unexpected behavior during migration
3. Validate users, groups, and app assignments in Okta after each test
4. Document outcomes with pass/fail status and anomalies

### Defect tracking

Capture failed test cases in a defect log that includes:

* Use case number
* Issue description
* Test status
* Ticket status
* Priority
* Error category (AD, Okta, HR, or other systems specific to your environment)
* Notes and proposed resolution

> **Note:** Output errors in a format that can be input for another run. This allows you to easily retest failed cases after fixes are applied.

## Create a rollback plan

Even with thorough testing, you need a plan to roll back changes if issues arise during production migration.

### User identification strategy

Identify users to roll back by assigning them to an Okta group that identifies the source. For example:

* Create a group like "Migrated_from_Legacy_YYYYMMDD"
* Add all migrated users to this group during migration
* Use this group to identify and filter users for potential rollback

### Data export and backup

Before production migration:

1. **Export existing Okta users**: If users exist in Okta, export current data
2. **Preserve source system data**: Ensure that you have a valid backup of the source system
3. **Document pre-migration state**: Record current configuration, policies, and assignments
4. **Test restoration process**: Verify that you can restore from backups in your test environment

### Rollback execution

Data migration rollback is for users only. Other items (for example, app assignment) should have their own plan. Isolate these other items by temporarily disabling those features during data migration.

Your rollback plan should include:

* **Criteria for rollback**: Define what issues would trigger a rollback decision
* **Rollback team**: Identify who has authority to initiate the rollback
* **Rollback procedure**: Document a step-by-step process to reverse migration
* **Communication plan**: How to notify users if a rollback occurs
* **Timeline**: How quickly a rollback can be executed

### Feature isolation

During migration, consider temporarily disabling:

* Automated provisioning workflows
* Email notifications
* App assignments (until users are verified)
* Group rules that automatically modify user attributes

This isolation prevents cascading issues and makes rollback simpler if needed.

## Next steps

With a plan in place, you're ready to move on to implementation, which differs according to where your data is coming from and what method you chose to use. In this document, use the [Okta API](/docs/reference/). Those steps are covered in the next section.

Have a look at our migration guides:

* [Bulk migration with credentials](/docs/guides/migrate-to-okta-bulk/)
* [Import Users with Inline Password Hooks](/docs/guides/migrate-to-okta-password-hooks/)
