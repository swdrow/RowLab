Starting CodeRabbit review in plain text mode...

Connecting to review service
Setting up
Analyzing
Reviewing

============================================================================
File: src/pages/AnalyticsPage.jsx
Line: 34 to 68
Type: refactor_suggestion

Prompt for AI Agent:
In @src/pages/AnalyticsPage.jsx around lines 34 - 68, SpotlightCard is duplicated; extract it into a reusable component by creating a new component file that exports SpotlightCard (preserving props: children, className='', spotlightColor='rgba(0, 112, 243, 0.08)') and its internal hooks (useRef, useState) and handlers (handleMouseMove, onMouseEnter/onMouseLeave) and JSX structure (including the radial-gradient style and inner top light div). Replace the other occurrences with imports of this exported SpotlightCard and remove the local duplicate definitions; ensure the new module imports React hooks (useRef, useState) and that callers pass any className/children as before so behavior and defaults stay identical.



============================================================================
File: src/store/subscriptionStore.js
Line: 38 to 44
Type: potential_issue

Prompt for AI Agent:
In @src/store/subscriptionStore.js around lines 38 - 44, The _handleResponse function must guard against response.json() throwing on invalid/empty bodies: wrap the call to response.json() in a try/catch (inside _handleResponse) and if parsing fails, attempt to read response.text() (or treat body as empty) and construct a clear error that includes response.status, response.statusText and the raw text; when response.ok is false, throw an Error with either the parsed data.error?.message or the fallback raw text so callers get a deterministic, informative error instead of an unhandled rejection.



============================================================================
File: src/pages/SettingsPage.jsx
Line: 20 to 54
Type: refactor_suggestion

Prompt for AI Agent:
In @src/pages/SettingsPage.jsx around lines 20 - 54, SpotlightCard is duplicated (fourth occurrence); extract this component into a single reusable module by creating src/components/ui/SpotlightCard.jsx that exports the SpotlightCard function (preserving props spotlightColor, className, children and useRef/useState behavior), then replace the inline component in this file with an import: import SpotlightCard from 'src/components/ui/SpotlightCard.jsx' and remove the duplicate definition here; update the other three files similarly to import the shared component and ensure any relative import paths and named/default export usage are consistent.



============================================================================
File: docs/plans/2025-01-18-phase7-advanced-implementation.md
Line: 193 to 208
Type: potential_issue

Prompt for AI Agent:
In @docs/plans/2025-01-18-phase7-advanced-implementation.md around lines 193 - 208, Add mounting for the Race Predictor routes in server/index.js: import the Race Predictor route module that corresponds to racePredictorService.js (e.g., racePredictorRoutes from the routes file you created) and call app.use to mount it with apiLimiter at a dedicated path like '/api/v1/race-predictor'; alternatively, if Race Predictor endpoints are intentionally bundled into aiLineupRoutes, update the plan to state that and remove the separate mount so the wiring and documentation match.



============================================================================
File: server/routes/aiLineup.js
Line: 111 to 115
Type: potential_issue

Prompt for AI Agent:
In @server/routes/aiLineup.js around lines 111 - 115, The current mapping in athleteIds.map produces incorrect seat numbers and simplistic side alternation; change the mapping so seatNumber = index if config.hasCox is true (cox at index 0) otherwise seatNumber = index + 1 (so non-coxed boats start at 1), and replace the index-based side logic with a deterministic source: prefer an explicit athlete side preference array (e.g., sidePreferences[athleteId] or sidePreferences[index]), if absent fall back to a boat rigging array on config (e.g., config.rigging[seatNumber] or config.rigging[index] adjusted for cox), and only if neither exists use a consistent default alternation starting from the stroke side; update the mapping in the lineup creation (the athleteIds.map block that sets seatNumber and side) to implement this precedence and ensure indices are adjusted when config.hasCox is true.



============================================================================
File: src/store/subscriptionStore.js
Line: 228 to 234
Type: potential_issue

Prompt for AI Agent:
In @src/store/subscriptionStore.js around lines 228 - 234, getUsagePercentage currently risks dividing by zero when limit === 0; update the function (getUsagePercentage) to explicitly handle limit === 0 before performing used/limit (after the existing limit === -1 check) and return a sensible value (e.g., 0) instead of computing used/limit, ensuring you reference the same variables (usage, used, limit) and preserve the Math.min(100, ...) behavior for all other cases.



============================================================================
File: src/components/Billing/UpgradePrompt.jsx
Line: 41 to 51
Type: potential_issue

Prompt for AI Agent:
In @src/components/Billing/UpgradePrompt.jsx around lines 41 - 51, The cleanup currently sets document.body.style.overflow = 'unset', which can clobber an existing overflow value; inside the useEffect in UpgradePrompt.jsx (the effect that depends on isOpen and handleEscape), capture the previous body overflow (e.g., const prevOverflow = document.body.style.overflow) before setting document.body.style.overflow = 'hidden' when isOpen is true, and on cleanup restore document.body.style.overflow = prevOverflow; ensure you still add/remove the keydown listener (handleEscape) only when isOpen is true so you only restore when you changed it.



============================================================================
File: src/components/ui/Card.jsx
Line: 74 to 78
Type: potential_issue

Prompt for AI Agent:
In @src/components/ui/Card.jsx around lines 74 - 78, The interactive variant already defines hover:scale-[1.01] and active:scale-[0.99] (variants.interactive), causing duplicated scale transforms when the prop interactive={true} also applies interactiveStyles; remove the duplicate scale classes from the interactiveStyles definition so only variants.interactive supplies the scale transforms, and update any other occurrences where interactiveStyles is used (e.g., the Card component's className composition) to avoid repeating those hover/active scale classes.



============================================================================
File: src/components/Billing/UpgradePrompt.jsx
Line: 126 to 138
Type: potential_issue

Prompt for AI Agent:
In @src/components/Billing/UpgradePrompt.jsx around lines 126 - 138, The component UpgradePrompt.jsx renders strings using props like limitType, limit, and currentPlanInfo.name when type === 'limit', which can produce "undefined" if those props are missing; update the UpgradePrompt component to defensively validate/default these props (e.g., provide sensible defaults for limitType and limit, and default currentPlanInfo to an object with a name) or guard the JSX with conditional rendering before using template strings in the h2 and p elements so that UpgradePrompt.jsx never interpolates undefined values into You've reached your ${limitType} limit or Your ${currentPlanInfo.name} plan allows ${limit} ${limitType}.



============================================================================
File: src/store/telemetryStore.js
Line: 96 to 117
Type: potential_issue

Prompt for AI Agent:
In @src/store/telemetryStore.js around lines 96 - 117, The deleteEntry async action currently never toggles the store's loading state; update the deleteEntry function to set loading: true before starting the fetch (e.g., call set({ loading: true })) and ensure loading is set back to false in a finally block after the fetch/processing completes or errors; keep existing behavior of updating telemetryData and sessionData and setting set({ error: error.message }) on catch, but clear or preserve error appropriately so UI can rely on loading and error consistently. Reference: deleteEntry, get()._getAuthHeaders, getErrorMessage, telemetryData, sessionData, loading.



============================================================================
File: docs/plans/2025-01-18-athletic-precision-design-system.md
Line: 119
Type: potential_issue

Prompt for AI Agent:
In @docs/plans/2025-01-18-athletic-precision-design-system.md at line 119, There is a conflicting design rule: docs/plans/2025-01-18-athletic-precision-design-system.md states "NO glass effects, NO backdrop blur" while .claude/design-standard.md defines the Glass Card primitive with backdrop-blur-xl; resolve by choosing the canonical policy (allow or disallow glass effects), update the losing document to match that decision, and add a clarifying note in the chosen source (either the plan or .claude/design-standard.md) explaining the rationale; ensure you update the Glass Card primitive entry and any examples referencing backdrop-blur-xl (or remove/replace them) so both documents consistently reflect the same guideline.



============================================================================
File: src/pages/AnalyticsPage.jsx
Line: 206 to 216
Type: potential_issue

Prompt for AI Agent:
In @src/pages/AnalyticsPage.jsx around lines 206 - 216, The COLORS object has inconsistent naming and duplicate values: keys primary, bladeGreen, and starboard all point to '#0070F3' (a blue), yet the comment says "Blade green"; update the COLORS map and comments so names match actual hex values—either change the comment to "Blade blue" and remove duplicate keys (keep only one canonical key like primary or bladeBlue), or replace the hex with the intended green hex for bladeGreen; ensure unique, semantic keys (e.g., primary/bladeBlue or bladeGreen) and update associated comments for COLORS to reflect the corrected color meanings used by functions/components that reference COLORS.



============================================================================
File: src/store/combinedScoringStore.js
Line: 88 to 90
Type: potential_issue

Prompt for AI Agent:
In @src/store/combinedScoringStore.js around lines 88 - 90, The post-recalculation call to get().fetchRankings() drops any previously used filter options (boatClass/side/limit), causing unfiltered results; update the recalculation flow in combinedScoringStore.js (the function that calls await get().fetchRankings(); set({ loading: false });) to pass the original options object through — either capture the options parameter used for the initial fetch (e.g., store as lastFetchOptions on the store or keep a local options variable) and call get().fetchRankings(lastFetchOptions) (or fetchRankings(options)) after recalculation so the same filters are preserved; ensure no change to set({ loading: false }) behavior.



============================================================================
File: src/components/Advanced/CombinedRankings.jsx
Line: 471 to 552
Type: potential_issue

Prompt for AI Agent:
In @src/components/Advanced/CombinedRankings.jsx around lines 471 - 552, The JSX fragment wrapping the table row and its DetailRow lacks a key, causing React warnings; fix by replacing the shorthand fragment ... with a keyed fragment (e.g., ...) or import React and use  so the outermost element returned in the map has a unique key (use athleteId or ${athleteId}-group); ensure you import Fragment from 'react' if you use Fragment.



============================================================================
File: src/components/Advanced/TelemetryImport.jsx
Line: 221 to 239
Type: potential_issue

Prompt for AI Agent:
In @src/components/Advanced/TelemetryImport.jsx around lines 221 - 239, The CSV parser parseCSVLine fails to handle escaped quotes inside quoted fields; update parseCSVLine to follow RFC 4180 by treating a pair of double quotes ("") within a quoted field as a single literal quote: when encountering a quote and inQuotes is true, check if the next character is also a quote—if so, append a single quote character to current and advance the index to skip the escape; otherwise toggle inQuotes as existing code does; ensure after finishing a quoted field you still push the accumulated current (with escaped quotes converted to single quotes) into values.



============================================================================
File: src/components/Communication/AnnouncementDetail.jsx
Line: 178 to 207
Type: potential_issue

Prompt for AI Agent:
In @src/components/Communication/AnnouncementDetail.jsx around lines 178 - 207, The exit animation inside AnimatePresence isn't playing because the child motion.div lacks a stable key; update the modalContent rendering so the animated child passed to AnimatePresence (the outer motion.div or the inner motion.div you want to animate) receives a unique key prop (e.g., based on modal open state or an announcement id) so AnimatePresence can track mount/unmount and trigger exit animations for the motion.div defined in modalContent.



============================================================================
File: src/components/Advanced/TelemetryImport.jsx
Line: 241 to 246
Type: potential_issue

Prompt for AI Agent:
In @src/components/Advanced/TelemetryImport.jsx around lines 241 - 246, handleFileChange's useCallback closure omits processFile from its dependency array which can lead to stale closures; update the dependency list of the useCallback that defines handleFileChange to include processFile (and any other values it uses like source or parseCSV) so React can recreate the callback when processFile changes; locate the useCallback for handleFileChange and add processFile to its dependency array.



============================================================================
File: server/services/combinedScoringService.js
Line: 414 to 454
Type: potential_issue

Prompt for AI Agent:
In @server/services/combinedScoringService.js around lines 414 - 454, The per-athlete calls to calculateErgScore, getSeatRaceElo, and calculateTelemetryScore inside the ratings.map create a 3N+1 N+1 query problem in getTeamRankingsByCombined; update the flow to read component scores from a cached field on AthleteRating (e.g., metadata or breakdown stored by calculateCombinedScore) and only fall back to batched retrieval if missing: modify calculateCombinedScore to persist erg/elo/telemetry into AthleteRating.metadata (or separate columns) and change the mapping in getTeamRankingsByCombined to parse rating.metadata for ergScore/eloScore/telemetryScore (or call a single batched query function for all athleteIds) instead of invoking calculateErgScore/getSeatRaceElo/calculateTelemetryScore per athlete.



============================================================================
File: src/components/Racing/RaceResultsEntry.jsx
Line: 46 to 69
Type: potential_issue

Prompt for AI Agent:
In @src/components/Racing/RaceResultsEntry.jsx around lines 46 - 69, The Checkbox component lacks accessible labeling; update the Checkbox (component name Checkbox) to accept a label or ariaLabel prop and ensure the underlying  has an accessible label: either add an aria-label attribute on the input when ariaLabel is provided, or render a visually-hidden text node (e.g., className "sr-only") inside the wrapping label that contains the label prop; if you prefer explicit association, add an id prop to the input and set htmlFor on the label to that id. Ensure the checked and onChange behavior remain unchanged and that the new prop is required or validated where appropriate.



============================================================================
File: Dockerfile
Line: 38 to 43
Type: refactor_suggestion

Prompt for AI Agent:
In @Dockerfile around lines 38 - 43, The Dockerfile currently copies /app/node_modules/.prisma from the builder stage and then runs "npx prisma generate" again in the production stage, causing redundancy and potential binary mismatches; fix this by choosing one approach: either remove the COPY --from=builder /app/node_modules/.prisma line so the production stage runs npx prisma generate (keep the existing RUN npm ci --only=production && npx prisma generate && npm cache clean --force), or remove npx prisma generate from that RUN and rely on the copied .prisma artifacts from the builder (keep COPY --from=builder /app/node_modules/.prisma and change RUN to npm ci --only=production && npm cache clean --force); ensure whichever choice you make leaves only a single source of truth for Prisma artifacts to avoid incompatible binaries.



============================================================================
File: src/store/regattaStore.js
Line: 51 to 56
Type: potential_issue

Prompt for AI Agent:
In @src/store/regattaStore.js around lines 51 - 56, The current fetch pattern calls response.json() before checking response.ok, which can throw on non-JSON error bodies; update the fetch handling (e.g., in the function that creates response and calls response.json() in src/store/regattaStore.js) to first check response.ok and only attempt response.json() for successful responses, and for error responses attempt to parse JSON in a try/catch (falling back to response.text()), then call getErrorMessage with the parsed error/text so you throw a meaningful Error; apply the same change to all other fetch calls in this store.



============================================================================
File: src/components/Racing/RaceResultsEntry.jsx
Line: 167 to 172
Type: potential_issue

Prompt for AI Agent:
In @src/components/Racing/RaceResultsEntry.jsx around lines 167 - 172, The getPlaceDisplay function currently appends "th" for all places >=4 and doesn't handle the English ordinal exceptions; update getPlaceDisplay to compute the suffix using n % 100 to detect the 11-13 special case (always "th"), otherwise use n % 10 to choose "st" for 1, "nd" for 2, "rd" for 3 and "th" for all other digits, and return the formatted string (e.g., ${place}${suffix}); locate and modify the getPlaceDisplay function to implement this logic.



============================================================================
File: server/index.js
Line: 73 to 76
Type: potential_issue

Prompt for AI Agent:
In @server/index.js around lines 73 - 76, The app currently mounts healthRoutes via app.use('/api/health', healthRoutes) which shadows the inline GET '/api/health' handler defined later; remove the redundant inline GET '/api/health' handler (or alternatively consolidate its logic into the healthRoutes module) so there is only one source of truth for the endpoint; ensure healthRoutes exports the same health-check behavior (including any JSON response or status logic) and delete the standalone GET '/api/health' handler to avoid route shadowing.



============================================================================
File: Dockerfile
Line: 16 to 20
Type: potential_issue

Prompt for AI Agent:
In @Dockerfile around lines 16 - 20, Move the Prisma generation step to run before the TypeScript build so the generated Prisma client is available during compilation: run "npx prisma generate" prior to "npm run build" (i.e., reorder the Dockerfile commands so RUN npx prisma generate executes before RUN npm run build) and ensure the files needed by prisma (schema.prisma and node_modules) are copied into the image before the generate step.



============================================================================
File: server/services/stripeService.js
Line: 378 to 412
Type: potential_issue

Prompt for AI Agent:
In @server/services/stripeService.js around lines 378 - 412, The webhook handler for case 'customer.subscription.deleted' currently calls prisma.subscription.update which will throw if no subscription exists; modify the flow in that case to first look up the subscription (e.g., prisma.subscription.findUnique or findFirst using teamId) and if not found handle gracefully (log and return handled: true/false as appropriate) or create/update via an upsert; ensure subsequent prisma.subscriptionEvent.create is only called when subscription exists and include the event.id and reason as before; reference the case 'customer.subscription.deleted' block, prisma.subscription.update, prisma.subscription.findUnique/findFirst or prisma.subscription.upsert, and prisma.subscriptionEvent.create when making the change.



============================================================================
File: server/services/speedCalculationService.js
Line: 19 to 22
Type: potential_issue

Prompt for AI Agent:
In @server/services/speedCalculationService.js around lines 19 - 22, In calculateRawSpeed, add validation for the distanceMeters parameter (in addition to timeSeconds) so invalid inputs return null: verify both distanceMeters and timeSeconds are finite numbers (use Number.isFinite) and that distanceMeters > 0 and timeSeconds > 0; if any check fails return null, otherwise compute and return distanceMeters / timeSeconds. This change should be applied in the calculateRawSpeed function.



============================================================================
File: server/services/speedCalculationService.js
Line: 127 to 141
Type: potential_issue

Prompt for AI Agent:
In @server/services/speedCalculationService.js around lines 127 - 141, calculateAdjustedSpeed may divide by null when normalizeToStandard returns null; after calling normalizeToStandard check if normalizedTime is null or non-positive and handle it (e.g., return null or throw a clear error) instead of computing STANDARD_DISTANCE / normalizedTime, and include a descriptive log/error message if available. Update calculateAdjustedSpeed to validate normalizedTime before the division and return a safe sentinel (null) or raise an exception so callers do not receive Infinity; reference the functions calculateAdjustedSpeed and normalizeToStandard and the constant STANDARD_DISTANCE when making this change.



============================================================================
File: server/services/speedCalculationService.js
Line: 41 to 43
Type: potential_issue

Prompt for AI Agent:
In @server/services/speedCalculationService.js around lines 41 - 43, The splitToTime function lacks input validation; add checks in splitToTime for splitSeconds and distanceMeters to ensure they are present and finite numbers (use Number.isFinite or explicit null/undefined checks) and throw a clear TypeError (or return early per project convention) when inputs are invalid, then proceed with the existing calculation ((splitSeconds / 500) * distanceMeters).



============================================================================
File: server/services/speedCalculationService.js
Line: 204 to 217
Type: potential_issue

Prompt for AI Agent:
In @server/services/speedCalculationService.js around lines 204 - 217, The compareResults function uses result1.adjustedSpeed, result2.adjustedSpeed and adjustedTime without validating inputs; add defensive checks at the start of compareResults to ensure result1 and result2 are objects and that Number.isFinite(resultX.adjustedSpeed) and Number.isFinite(resultX.adjustedTime) are true for both; if validation fails, either throw a descriptive TypeError or return a safe default/result indicating invalid input (e.g., null or an object with zeros and an error flag) and guard the percentageFaster calculation against division by zero by checking the minimum speed is > 0 before dividing.



============================================================================
File: server/services/speedCalculationService.js
Line: 189 to 194
Type: potential_issue

Prompt for AI Agent:
In @server/services/speedCalculationService.js around lines 189 - 194, The spreadSeconds calculation can divide by a null/zero adjustedSpeed producing Infinity; update the spreadSeconds logic in this block (referencing spreadSeconds, analyzed, winningSpeed and STANDARD_DISTANCE) to first validate that both analyzed[0]?.adjustedSpeed and analyzed[analyzed.length - 1]?.adjustedSpeed are non-null and non-zero before performing STANDARD_DISTANCE / adjustedSpeed, and if either is invalid return a safe fallback (e.g., 0 or null) instead of performing the division; ensure you keep winningSpeed assignment unchanged but use the validated adjustedSpeed values (or their safe reciprocals) when computing spreadSeconds so no Infinity/NaN can occur.



============================================================================
File: server/services/aiLineupOptimizerService.js
Line: 150 to 157
Type: potential_issue

Prompt for AI Agent:
In @server/services/aiLineupOptimizerService.js around lines 150 - 157, The current generation loop can hang because repeated decrements of i (i--) retry forever if constraints make a valid lineup impossible; add a per-iteration retry cap (e.g., const MAX_RETRIES = 50) and a retry counter (retry = 0) used instead of unbounded i--: on each failed lineup increment retry, and if retry >= MAX_RETRIES stop retrying that slot (either throw a descriptive error like "Unable to generate valid lineup given constraints" or break to avoid infinite loop), otherwise attempt to rebuild the lineup; apply this change around the block that checks lineup.filter(l => l.seatNumber > 0).length === config.seats and references to population, size, i so the loop always makes forward progress when constraints are unsatisfiable and logs/raises a clear error.



============================================================================
File: src/components/Racing/RegattaList.jsx
Line: 60 to 65
Type: potential_issue

Prompt for AI Agent:
In @src/components/Racing/RegattaList.jsx around lines 60 - 65, The RegattaList component uses callbacks onSelectRegatta and onCreateNew without defaults, causing runtime errors if parents omit them; update RegattaList to provide safe defaults or add prop validation: either assign default no-op functions for onSelectRegatta and onCreateNew (so clicks on the regatta card handler and "Add Regatta" button are safe) or add PropTypes/type annotations to require them, and ensure the handlers referenced in the component (e.g., the regatta card click handler and the "Add Regatta" button click) call the safe/defaulted functions.



============================================================================
File: server/routes/externalTeams.js
Line: 129 to 153
Type: potential_issue

Prompt for AI Agent:
In @server/routes/externalTeams.js around lines 129 - 153, The PATCH handler (router.patch(':id')) allows updating name without enforcing the same case-insensitive uniqueness check used on create; before calling prisma.externalTeam.update, query for an existing team with the same lowercased name (use prisma.externalTeam.findFirst or equivalent) excluding the current id and if found return a 409/validation error; only proceed to prisma.externalTeam.update when that uniqueness check passes to prevent duplicate team names (keep error handling for P2025 intact).



============================================================================
File: src/pages/RacingPage.jsx
Line: 211 to 222
Type: potential_issue

Prompt for AI Agent:
In @src/pages/RacingPage.jsx around lines 211 - 222, The component calls fetchRegatta inside handleSelectRegatta and comments that errors are shown via store state, but it never reads or renders the store's error; update the component to destructure the error (and optionally clearError) from useRegattaStore (same hook used for fetchRegatta) and render a visible error UI (e.g., an error banner or toast) tied to that error state so users see failures; ensure you still revert selection via setSelectedRegatta(null) on failure and consider clearing the store error when the user dismisses the banner or on successful fetch.



============================================================================
File: src/pages/CommunicationPage.jsx
Line: 10 to 40
Type: refactor_suggestion

Prompt for AI Agent:
In @src/pages/CommunicationPage.jsx around lines 10 - 40, The SpotlightCard component is duplicated; extract it into a single shared component (e.g., export a SpotlightCard React component) and replace the copies with imports. Move the existing implementation (including useRef, useState, handleMouseMove, props: children, className, spotlightColor, the divRef usage and inline radial-gradient style, and the transition/opacity behavior) into the new component and export it; then update the pages (where SpotlightCard is currently defined) to import the shared SpotlightCard and remove the local definitions so props/behavior remain identical.



============================================================================
File: src/pages/AthletesPage.jsx
Line: 79 to 83
Type: potential_issue

Prompt for AI Agent:
In @src/pages/AthletesPage.jsx around lines 79 - 83, The current accentColor is a runtime string (accentColor) used inside template-style Tailwind classes (e.g. bg-${accentColor}/20, text-${accentColor}) so JIT won't generate those styles; replace the dynamic value with a static mapping object that maps athlete.side values ('P','S','Cox', etc.) to full Tailwind class names (e.g., bg-danger-red/20, text-danger-red, bg-blade-blue/20, etc.), return the specific class strings from that mapping, and update every usage that concatenates or templates accentColor (including the places that build background and text classes) to use the mapped static class strings instead so Tailwind can pick them up at build time.



============================================================================
File: server/services/racePredictorService.js
Line: 96 to 104
Type: potential_issue

Prompt for AI Agent:
In @server/services/racePredictorService.js around lines 96 - 104, The current prisma.athlete.findMany selects a non-existent combinedScore on Athlete; instead fetch combinedScore from the AthleteRating relation or the AthleteRating model. Update the code that calls prisma.athlete.findMany (the block using athleteIds) to either: 1) include the relation (e.g., select id and ratings: { select: { combinedScore } }) and map ratings to the athlete id, or 2) query prisma.athleteRating.findMany with where: { athleteId: { in: athleteIds } } and select athleteId and combinedScore, then join those results back to the athlete list. Ensure you reference the existing symbols prisma.athlete.findMany and/or prisma.athleteRating.findMany and map combinedScore from AthleteRating rather than from Athlete.



============================================================================
File: src/components/ui/Button.jsx
Line: 71 to 79
Type: potential_issue

Prompt for AI Agent:
In @src/components/ui/Button.jsx around lines 71 - 79, The "success" variant in Button.jsx is using blue tokens (blade-blue) instead of the design-system green; update the success variant (the success key in the exported styles) to use the success color tokens from tailwind (e.g., from-success and from-success/90 for the gradient) and replace the blue shadow/hover rgba values with green equivalents (matching #22C55E or the tailwind success token) while keeping text-void-deep and existing shadow/hover/active utilities intact for accessibility and contrast.



============================================================================
File: src/store/teamRankingsStore.js
Line: 21 to 36
Type: potential_issue

Prompt for AI Agent:
In @src/store/teamRankingsStore.js around lines 21 - 36, In fetchBoatClasses, avoid calling res.json() before checking HTTP status: first check res.ok and handle non-ok responses (e.g., read text or construct an error) before attempting JSON decode, or wrap res.json() in a try/catch to distinguish JSON parse errors from HTTP errors; update the logic in fetchBoatClasses to inspect res.ok and only parse JSON when safe (or parse with a guarded try/catch) and then set error via set({ error: ... , loading: false }) using a clear message derived from the status/text or parsed JSON.



============================================================================
File: src/components/domain/Lineup/LineupBoard.tsx
Line: 144
Type: potential_issue

Prompt for AI Agent:
In @src/components/domain/Lineup/LineupBoard.tsx at line 144, The Tailwind class on the floating circle in LineupBoard.tsx (the div with className containing bg-[var(--accent-green)]/3) uses an invalid opacity syntax for a CSS variable; change it so the CSS variable provides RGB values and use an RGBA arbitrary value (e.g., use an arbitrary bg color like bg-[rgba(var(--accent-green-rgb),0.3)]) or set the CSS variable to include the alpha portion and reference it directly, or apply the color via an inline style/background-color that uses the variable with an alpha; update the className on that div accordingly.



============================================================================
File: src/components/Communication/AnnouncementCard.jsx
Line: 55 to 60
Type: potential_issue

Prompt for AI Agent:
In @src/components/Communication/AnnouncementCard.jsx around lines 55 - 60, The audienceLabels map in AnnouncementCard.jsx uses lowercase plural keys that don't match backend visibleTo values, so update audienceLabels to use the exact backend keys (e.g., 'ATHLETE', 'COACH', 'OWNER') and keep the existing 'all' mapping (or map backend's equivalent if used) so labels resolve correctly when reading announcement.visibleTo; ensure any lookup logic that reads audienceLabels[announcement.visibleTo] uses the same key casing as the backend.



============================================================================
File: src/components/Communication/AnnouncementList.jsx
Line: 103 to 126
Type: potential_issue

Prompt for AI Agent:
In @src/components/Communication/AnnouncementList.jsx around lines 103 - 126, The current filtering and counting logic uses announcement.read, announcement.important, and announcement.urgent which don't exist in the backend response; update unreadCount, filteredAnnouncements (the switch cases), and getCounts to use announcement.isRead for read status and the priority string values ('important' and 'urgent') instead of announcement.important/announcement.urgent—i.e., compute unread as !announcement.isRead and check important/urgent via announcement.priority === 'important' or announcement.priority === 'urgent' (leave default/normal as-is).



============================================================================
File: src/components/Communication/AnnouncementCard.jsx
Line: 227 to 234
Type: potential_issue

Prompt for AI Agent:
In @src/components/Communication/AnnouncementCard.jsx around lines 227 - 234, The code is rendering the author object directly (showing [object Object]); update the render in AnnouncementCard.jsx to check for author and render a string field such as author.name (e.g., replace the existing {author && {author}} with something like {author && {author.name || author.email || 'Unknown author'}}) so the UI shows a human-readable name; keep the surrounding conditional and leave formatRelativeTime(displayTime) as-is.



============================================================================
File: server/services/announcementService.js
Line: 266 to 291
Type: potential_issue

Prompt for AI Agent:
In @server/services/announcementService.js around lines 266 - 291, togglePin currently reads the announcement then updates it, causing a TOCTOU race; change it to perform an atomic update in the database instead of separate read+write: replace the read+prisma.announcement.update pattern in togglePin with a single atomic SQL update executed via Prisma (e.g. prisma.$executeRaw/prisma.$queryRaw or prisma.$transaction with a raw query) that flips pinned in the WHERE clause (WHERE id = announcementId AND teamId) using SQL boolean negation (or CASE WHEN for DBs without NOT on booleans) and then SELECT the updated row (including author fields) to return; keep function name togglePin and ensure the returned shape matches the original (author: select id,name,email) and handle null when no row was updated.



============================================================================
File: server/routes/announcements.js
Line: 355 to 378
Type: potential_issue

Prompt for AI Agent:
In @server/routes/announcements.js around lines 355 - 378, The POST '/read-all' route (router.post('/read-all', ...)) is defined after the parameterized POST '/:id/read' route (router.post('/:id/read', ...)) so Express may treat "read-all" as an :id; relocate the router.post('/read-all', ...) handler to appear before any routes that use the ':id' parameter (i.e., move it above router.post('/:id/read', ...) and other '/:id' routes) or alternatively change the pattern to a non-conflicting path (e.g., '/all/read' or prefix with '/team/read-all') so that markAllAsRead is reached first; update any imports/exports or middleware order if needed to preserve behavior.



Review completed ✔
