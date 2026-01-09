# AGENT.md: The Secret Sauce 🕵️‍♂️

Hello, fellow AI agent (or curious human)! 
If you are reading this, you are probably tasked with maintaining or extending `Blodsukker_dev`. Here are the cheat codes, hidden traps, and shortcuts I've learned.

## 🧠 "Mental Model" of the Project
- **We are conservative**: This is a medical-adjacent app (Gestational Diabetes). We DO NOT invent medical advice. We use "Reference Values" (Referanseverdier), NOT "Goals" or "Requirements".
- **We depend on Neon**: Use `drizzle-orm/neon-serverless`. Traditional `pg` driver might be flaky in Vercel Edge/Serverless functions.
- **We are Mobile-First**: Always assume the user is on a 375px iPhone SE screen. If it looks bad there, it's broken.

## 🛠 Tricks & Quirks

### The Windows Build Gremlin
If you see `EINVAL readlink` in `.next/server...` during `npm run build`:
- **Don't panic.** It's a Windows implementation detail of how Next.js caches writes.
- **Do:** Run `npm run clean`.
- **Do:** Use the `cmd /c` prefix for shell commands if you are on Windows.

### The "Clean" Auth
- Note that `src/middleware.ts` is doing the heavy lifting for auth.
- It's **Stateless**. There is no "Session" table in the DB.
- **Trap**: If you rotate the `APP_COOKIE_SECRET`, everyone gets logged out immediately.
- **Trap**: `APP_PASSWORD` is single-user. This is not a multi-tenant SaaS. Don't try to add "User Registration" without a major refactor.

### Data & Timezones
- **The "DayKey"**: We use `YYYY-MM-DD` strings as primary grouping keys.
- **The Trap**: `new Date()` is UTC. `date-fns` is your best friend.
- **Logic**: `src/lib/utils/day-key.ts` handles the "Europe/Oslo" conversion. **Trust it.** Do not invent your own timezone math.

## 🧪 Testing shortcuts
- **Fast Check**: `npm run typecheck` saves you 90% of runtime errors. Run it often.
- **Smoke Test**: `node scripts/smoke.mjs --password=...` is better than clicking around manually.

## 🎨 UI & Styling

### The Theme System
- CSS variables live in `src/app/globals.css` (`:root` for light, `.dark` for dark).
- Tailwind uses these via `tailwind.config.ts`. Always extend there if adding new semantic colors.
- **Available tokens**: `background`, `foreground`, `card`, `primary`, `muted`, `border`, `success`, `warning`, `destructive` (with muted variants).

### Dark Mode Gotchas
- **Trap**: `bg-slate-200` or other hardcoded Tailwind colors become invisible in dark mode. Always prefer `bg-muted` or semantic tokens.
- **VS Code Warning**: `@tailwind` directives show as "Unknown at rule" warnings. Ignore them—PostCSS handles it correctly.

### Button Classes
- `.btn-primary`: Primary actions (already styled)
- `.btn-secondary`: Cancel/secondary actions (muted background)
- `.btn-destructive`: Danger actions (uses `--destructive` token)

### Copy & Terminology (IMPORTANT!)
- **Always check `docs/COPY_AND_DISCLAIMERS.md`** before writing user-facing text.
- **Use**: "Referanse" / "Ref." — NOT "Mål" (goal)
- **Use**: "Over referanse" — NOT "Over mål"
- **Meal types**: "Kveldsmat" — NOT "Kvelds"
- Avoid imperative language ("du må"). Use "det anbefales" instead.

## 🚀 Future Ideas (That I didn't get to)
- **Data Visualization**: We use SVG/Divs for charts to save bundle size. A library like `Recharts` might be nice eventually, but verify bundle size impact first.
- **Dark Mode**: Tailwind handles it, but check contrast ratios on the Amber/Red indicators in Dark Mode.

Good luck. Keep the diffs small. 🚀
