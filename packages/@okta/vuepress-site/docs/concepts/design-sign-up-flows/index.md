---
title: Sign-up flows
meta:
  - name: description
    content: An walk-through of how to design sign-up flows in an Okta environment.
---

# Sign-up flows

Before you configure your sign-up flow in Okta, use these questions to define your onboarding strategy. Following these recommended paths ensures a balance between user experience and security while maintaining scale and velocity.

## Entry points and account types

Different users, such as customers, partners, and contractors, often require different registration logic.

* **The Question:** Where will users find the sign-up link, and does the entry point change based on their user type? Is the audience general (public self-service) or known (invitation-only)?
* **The Recommended Path:** Use **context-aware routing**. If your application serves multiple user types, point them to a centralized "chooser" page or use subdomains (for example, `partners.example.com`) to route them to a specific [Okta Profile Enrollment Policy](/docs/concepts/policies/) tailored for that group.

The following diagram shows a sign-up flow that originates from the Okta-hosted Sign-In Widget:

<div class="full">

![Sign-up flow diagram 1](/img/signup-flow-1.png)

</div>

The following diagram shows an out-of-band sign-up flow, where registration is initiated through an external channel such as an email invitation sent to an employee or customer:

<div class="full">

![Sign-up flow diagram 2](/img/signup-flow-2.png)

</div>

## Friction vs. security

Every registration step is a potential drop-off point. You must decide where to place the onus on the user.

* **The Question:** Which authenticators must users enroll in during sign-up, and what level of assurance is required to ensure these are real accounts?
* **The Recommended Path:** Implement **progressive enrollment**. For the best user experience (UX), require only a password and email verification during initial registration. Prompt for stronger factors, such as [Okta Verify](/docs/guides/authenticators-okta-verify/) or [WebAuthn](/docs/guides/authenticators-web-authn/), only when the user attempts to access sensitive resources.
* **Toll Fraud Mitigation:** To reduce noise and avoid erroneous fees (including SMS toll fraud), implement bot detection like **reCAPTCHA** or strict [Rate Limiting](/docs/reference/rate-limits/) during the initial sign-up.

## Profile completion

Gathering data is essential for segmentation, but long forms deter users.

* **The Question:** What specific attributes (for example, Job Title, Org ID) must the user provide immediately?
* **The Recommended Path:** Use **Required Attributes** sparingly. Limit the registration form to 3-5 essential fields. Leverage **Okta’s Profile Enrollment** to make these fields mandatory. If you need to enrich this data further, consider using [Okta Inline Hooks](/docs/guides/registration-inline-hook/) to pull information from external databases during the registration process without slowing down the user.

## Modern authentication (OAMP & passwordless)

Modernize the flow by promoting friction-free authentication methods.

* **The Question:** How can we move away from traditional passwords to improve security and UX?
* **The Recommended Path:** Promote **Passwordless and Passkeys** early in the flow. By utilizing the [Okta Authentication Policy (OAMP)](/docs/concepts/policies/), you can allow users to sign up using biometric factors or email magic links. This significantly reduces the risk of credential-based attacks while speeding up the login process.

## Group assignment and automation

Automating permissions ensures users have immediate access without manual admin intervention.

* **The Question:** How will you assign groups and handle specific MFA requirements?
* **The Recommended Path:** Use a [Role-Based Access Control (RBAC)](/docs/concepts/iam-overview-authorization-factors/) approach:
  * **Assign via Policy:** Use the Profile Enrollment Policy to automatically add all new registrants to a "New Users" group.
  * **Automate via Rules:** Use [Group Rules](/docs/concepts/universal-directory/) to move users into functional groups (for example, "MFA_Required") based on attributes provided during sign-up.
  * **Opt-in Flow:** If MFA is optional, map a "Use_2FA" checkbox to a custom boolean attribute. A Group Rule can then automatically add the user to a group targeted by a specific MFA policy.

## Branding and aesthetics

A visual disconnect between your app and the registration form can reduce user trust.

* **The Question:** How will you apply your brand’s look and feel to the form?
* **The Recommended Path:** Leverage the [Okta Hosted Sign-In Widget](/docs/concepts/sign-in-widget/). It is the most secure way to maintain consistency. Use the [Okta Branding Tool](/docs/concepts/brands/) (or custom CSS) to match your company’s colors and logos, providing a seamless transition from your app to the login flow.

## The end-to-end UX and communication

The registration flow doesn't end when the user clicks **Submit**.

* **The Question:** Is email verification required, and what do your automated communications say?
* **The Recommended Path:**
  * **Verification:** Always require [email verification](/docs/guides/authenticators-okta-email/) to prevent spam accounts.
  * **Success Landing Page:** Upon successful registration, redirect users to a specific "Welcome" or "Getting Started" dashboard rather than just the generic login page.
  * **Branded Prompts:** Ensure [SMS](/docs/guides/custom-sms-messaging/) and [email](/docs/guides/custom-email/) prompts are concise and branded. Match the "From" address and "Display Name" to your application name to prevent users from flagging messages as phishing.
