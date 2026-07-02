Load and apply the 2bReady engineering conventions for the current task.

Read the full conventions from `$ARGUMENTS` or, if no argument, from the Project Documents SKILL.md at:
`/home/vundev/Projects/server-setup/app-repos/2bready/Project Documents/SKILL.md`

Then answer the user's question or complete the task using these conventions as the decision guide.
Key things to enforce:
1. BelongsToCompany trait on every tenant-scoped model — no exceptions
2. Domain-oriented folder structure — code goes in app/Domain/{X}/, never top-level Services/Repositories
3. Thin controllers — validate via Form Request → call one Action → return API Resource
4. Pattern selection: Action for single-use logic, Service for shared logic, Repository only for Company/Payment
5. API envelope: always ApiResponse or JsonResource — never raw response()->json() with custom shape
6. Every new endpoint ships with a Pest test covering happy path + 422 + 401/403
7. declare(strict_types=1) in every file, no magic strings (use Enums), no raw SQL
