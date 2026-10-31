# DamTech Calendar: Microsoft 365 setup (for Outlook sync)

Needed only for phase 3 (Outlook). The Calendar tab works without any of this. Someone with Microsoft 365 **Global** or **Exchange administrator** rights does these steps; nothing here can be done from the website.

Start with **one test shared mailbox**. Do not add the real team calendars until the test passes.

Commands follow Microsoft's "RBAC for Applications in Exchange Online" guide (learn.microsoft.com/exchange/permissions-exo/application-rbac). Check that page at setup time in case a cmdlet changed.

## 1. Shared mailbox (test first)

Microsoft 365 admin center → Teams & groups → Shared mailboxes → Add.

- Name: `DamTech Calendar Test`, address e.g. `calendar-test@dam-tech.co.za` (any unused address).
- Give the operations manager Full Access so it appears in their Outlook.
- Leave sign-in blocked (the default for shared mailboxes).

Later, the same for each team (e.g. `team-andre@`, `team-arno@`). Names are up to you; the website stores whatever you give it.

## 2. App registration

Microsoft Entra admin center → App registrations → New registration.

- Name: `DamTech Operations Calendar`. Accounts in this organisational directory only.
- No redirect URI.
- Certificates & secrets → New client secret (or upload a certificate). Copy the value once.
- **Do not** add Microsoft Graph *application* permissions such as `Calendars.ReadWrite` under API permissions, and do not grant admin consent for them. A tenant-wide Entra grant would let the app open every mailbox and overrides the scoping below.

Note: Application (client) ID, Directory (tenant) ID, and from Enterprise applications the app's **Object ID**.

## 3. Limit the app to the scheduling mailboxes (Exchange Online PowerShell)

```powershell
Connect-ExchangeOnline

# Register the app with Exchange
New-ServicePrincipal -AppId <APP_ID> -ObjectId <ENTERPRISE_APP_OBJECT_ID> -DisplayName "DamTech Operations Calendar"

# Mark the mailboxes the app may use
Set-Mailbox calendar-test@dam-tech.co.za -CustomAttribute10 "DamTechScheduling"

# A scope that matches only marked mailboxes
New-ManagementScope -Name "DamTech scheduling mailboxes" -RecipientRestrictionFilter "CustomAttribute10 -eq 'DamTechScheduling'"

# Calendar read/write, only inside that scope
New-ManagementRoleAssignment -App <APP_ID> -Role "Application Calendars.ReadWrite" -CustomResourceScope "DamTech scheduling mailboxes"
```

## 4. Verify (both must hold)

```powershell
# Allowed: should show the role with InScope = True
Test-ServicePrincipalAuthorization -Identity <APP_ID> -Resource calendar-test@dam-tech.co.za

# Not allowed: a personal mailbox, should show InScope = False
Test-ServicePrincipalAuthorization -Identity <APP_ID> -Resource <someone>@dam-tech.co.za
```

Permission changes can take up to about two hours to apply.

## 5. Give the website the details

Add to Vercel (Production and Preview), not in chat or email:

| Variable | Value |
| --- | --- |
| `MS_GRAPH_TENANT_ID` | Directory (tenant) ID |
| `MS_GRAPH_CLIENT_ID` | Application (client) ID |
| `MS_GRAPH_CLIENT_SECRET` | the secret value |
| `OPS_CALENDAR_OUTLOOK_OUTBOUND` | leave unset until the test passes |

Then tell Claude the test mailbox address. Claude runs the live checks (create, update, cancel one event; confirm a personal mailbox is refused) before any team calendar is connected.

## Rollback

Remove the role assignment (`Remove-ManagementRoleAssignment`), delete the client secret, and unset the Vercel variables. Bookings in DamTech are unaffected.
