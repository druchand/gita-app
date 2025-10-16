# Header Interaction System — Menu / Language / Login (Checklist)

**Repository path:** `docs/checklist_header_interaction.md`  
**Created:** (auto) — Use this as the single-source checklist for finalizing header/menu/language/login.

---

## Purpose
Stabilize and finalize the header interaction system so:
- Menu (left drawer), Language (drawer), and Login/Signup (modal) render above app screens,
- All three open/close reliably and display backend data,
- Authentication state and chosen language persist across sessions.

---

## Acceptance Criteria
- Header is always visible and on top (no UI overlap covering header controls).
- Menu opens from the left and height is dynamic to content.
- Language selector opens from the top-right below the header (or right drawer) and renders backend languages.
- Login modal opens centered, shows forgot-password / signup links, and closes on cancel or background tap.
- User name & avatar appear in header after successful login.
- No TypeScript errors (`npx tsc --noEmit` must be clean).
- No console runtime errors on normal flows (open/close, login/logout, change language).

---

## Roadmap & Phase Checklist

### Phase 1 — Stabilization & Context Consistency
Goal: All providers and hooks mount and expose consistent, typed APIs.

- [ ] Auth context: `src/context/AuthModalContext.tsx` exports:
  - `export const AuthModalProvider: React.FC<{ children: React.ReactNode; anchorTop?: number }>`
  - `export const useAuth = (): AuthContextValue` (typed)
  - `AuthContextValue` includes: `isOpen|visible`, `openLogin`, `closeLogin`, `login`, `logout`, `user`, `setUser`, possibly `forgotPassword`
- [ ] Language context: `src/context/LanguageContext.tsx` exports:
  - `export const LanguageProvider` and `export const useLanguage`
  - `useLanguage()` returns `{ lang, langName, setLangCode, availableLangs, openLanguage, closeLanguage, isOpen }` (typed)
- [ ] Menu drawer: `src/components/MenuDrawer.tsx` exports:
  - `export const MenuDrawerProvider` and `export const useMenuDrawer`
  - `useMenuDrawer()` returns `{ openMenu, closeMenu, toggleMenu, isOpen }`
- [ ] `_layout.tsx` ordering (top-down):
  - `SafeAreaProvider` → `AuthModalProvider` → `LanguageProvider` → `MenuDrawerProvider` → `AppHeader` → `<Slot/>` → `AuthModal` & `LanguageModal`
- [ ] `AppHeader.tsx` exports `HEADER_HEIGHT` (number) and default header component.

**Verification:** `npx tsc --noEmit` — no errors. App shows header and three buttons.

---

### Phase 2 — Modal & Drawer Wiring
Goal: Make UI controls trigger the correct context actions.

- [ ] AppHeader button handlers call:
  - `menu.openMenu()` or `menu.toggleMenu()`
  - `language.openLanguage()` (should set language modal visible)
  - `auth.openLogin()` (open login modal)
- [ ] LanguageModal receives `visible` + `onClose` props OR reads `useLanguage()` internally and respects `open/close`.
- [ ] AuthModal receives `visible` + `onClose` props OR reads `useAuth()` internally and respects `open/close`.
- [ ] Close actions and background taps close modals.

**Verification:** Open each from header; close them; no thrown errors.

---

### Phase 3 — Backend Integration
Goal: Load and display backend data.

- [ ] Languages: fetch `/ _functions/langs` (or configured URL). Backend item shape example:
  ```json
  [{"_id":"47fff...", "id":"EN", "name":"🇬🇧 English"}, ...]
  ```
- [ ] Language context loads and caches backend languages on mount.
- [ ] LanguageModal renders language list from context.
- [ ] Menu drawer loads user-specific menu items from backend or hardcoded.
- [ ] Auth context handles login/logout with backend API calls.
- [ ] After login, user data (name, avatar) is stored in context and shown in header.

**Verification:** Languages and menu items appear from backend; login/logout works with real data.

---

### Phase 4 — Persistence & State Sync
Goal: Persist user auth and language choice across app restarts.

- [ ] Use `AsyncStorage` or secure storage to save:
  - Auth token and user info
  - Selected language code
- [ ] On app start, context providers load persisted state before rendering children.
- [ ] Ensure no flicker or incorrect UI state during loading.
- [ ] Language and auth state changes update persisted storage immediately.
- [ ] Menu drawer and modals reflect current persisted state.

**Verification:** Close and reopen app; header state (user, language) persists correctly without errors.

---

### Phase 5 — Cleanup & Final QA
Goal: Polish, remove debug code, and finalize for production.

- [ ] Remove console logs and debug-only code.
- [ ] Check all TypeScript types and fix any loose `any`s.
- [ ] Verify no UI overlap or z-index issues on all screen sizes.
- [ ] Test all interaction flows thoroughly (open/close modals, login/logout, language change).
- [ ] Confirm accessibility standards (focus management, keyboard navigation).
- [ ] Update documentation and comments with final API and usage notes.

**Verification:** Clean build, no runtime errors, smooth user experience, ready for release.

---

## Summary
This checklist covers all steps to build a robust, fully functional header interaction system with menu, language selector, and login modal integrated with backend and persistent state. Follow each phase carefully, verify outcomes, and ensure clean, maintainable code.