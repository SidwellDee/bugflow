# Prototype demonstration

Allow approximately 10 minutes after completing the account and Google setup in GOOGLE_SETUP.md. Sign in with a verified account. Start the application using README.md. The first run includes sample data. Sample history entries represent snapshots rather than reconstructed real workflows.

1. **Dashboard:** Open the application. For a fresh database, show six total bugs, one resolved or tested, four outstanding, one currently reopened and one closed. Show lifecycle and severity distributions. Select Campus Portal to demonstrate project filtering.
2. **Register a system:** Open Projects & modules. Register “Library System” with a description. Register “Loans” against that system. Confirm the module appears beneath the system.
3. **Report:** Select Library System and sign in as the registered tester. Open Bug register, then Report bug. Enter title “Renewal creates duplicate loan”; choose Loans. Document reproduction steps, expected and actual results, environment and description. Choose Functional, High and P1. Leave status Reported and assignee Unassigned. Save. Confirm a new bug ID and history entry.
4. **Assign:** Sign in with the registered manager account. Open the new bug, choose Sam Dube as assignee and Assigned as status. Save. Confirm the history records the assignment and actor.
5. **Develop:** Sign in with a registered developer account. Move the bug to In Progress and save. Reopen its details, record a resolution such as “Added duplicate renewal validation”, and move to Resolved. Save.
6. **Verify:** Sign in with a registered tester account. Move to Tested with note “Repeated renewal does not create a duplicate”. Save, then move to Closed and save. Show the dashboard count change.
7. **Reopen:** Open the closed bug. Select Reopened and enter “Duplicate still occurs with two browser tabs”. Save. Confirm the reopened count and history. Sign in with a registered developer account and move to In Progress to demonstrate another repair cycle.
8. **Movement and validation:** Move a Closed ticket left to In Progress, then Reported. Repeat as a tester and a developer. Confirm that all six other statuses appear in each ticket menu. Attempt resolution without resolution text and confirm rejection. An unknown status is rejected by the server.
9. **Reports:** Open Reports. Show current-state counts, recorded reopening counts and outstanding developer workload. Download the CSV and explain that it exports all projects. Search the bug register by title and filter by severity or status.
10. **Persistence:** Stop and restart the service. Confirm the Library System bug and its history remain. Run `npm test` to show the independent automated tests.

## Submission checklist

Add your name, student number, institution and lecturer to the report as required by your course. Review the report against your marking rubric. Submit the source folder, report and demonstration evidence through your institution's submission system. This package does not upload an assignment or claim a demonstration has been presented to a lecturer.

## Board demonstration
On Dashboard, sign in with the registered manager account and drag a Reported ticket to Assigned. Choose an assignee and confirm. Drag Assigned to In Progress. Move In Progress to Resolved and provide resolution text if needed. Sign in with a registered tester account to move Resolved to Tested, then Closed. Drag Closed to Reopened and supply a reason. Confirm column counts, persistence after refresh and the ticket history. Repeat a move using the card's Move to menu to demonstrate the keyboard and touch alternative. All other status columns are available for every acting member. Demonstrate backward movement from Closed to In Progress and from Assigned to Reported. Hold the ticket near either edge to scroll the board during a drag. Cancel a move form and verify that the ticket remains in its original column.



## Account and Gmail demonstration

The demo identity selector has been replaced by authenticated accounts. Use GOOGLE_SETUP.md to configure the Google client, register the first manager, connect Gmail, verify a second password account and exercise Google sign-in. Show Team & Gmail, ticket notifications and opt-out. Use separate browser sessions for separate identities. Seeded users can receive assignments but cannot sign in or receive email because no account or email address is associated with them. No live email delivery is claimed by the automated test results.

## Assigned project and user menu walkthrough

1. Sign in with a verified account and confirm Your projects is the landing page.
2. Select Create a project, enter a name and description, and assign a second team member. Confirm the project's dashboard opens immediately.
3. Return with My projects. On the card select Manage project, add a module and review Members. Confirm there is no Projects & modules item in the dashboard navigation.
4. Sign in as the assigned member in another session. Confirm their project card opens only that project's board. An unrelated account should not receive that card or its data.
5. Create a ticket, assign a project member and move it between statuses. Open its Details and Change history tabs.
6. Open Reports and export the current project. Confirm unrelated project tickets are absent.
7. Click the signed-in user's name or avatar. Confirm Sign out is inside the menu. Verify outside-click dismissal, Escape and keyboard navigation.
