# TODO - Admin deletion utilities & operations fix

- [x] Update `src/app/api/admin/system/route.ts` to implement missing operations (clear_reviews, reset_history) as safe local ops, and improve clear_cache to actually revalidate server-side (best-effort).
- [x] Update `src/app/admin/page.tsx` Operations tab with working handlers + safer delete utils scaffolding.
- [ ] Align UI actions with backend supported action names; ensure `handleSystemAction` matches `/api/admin/system`.
- [x] Run `pnpm run build` to confirm TS/syntax errors are resolved.
