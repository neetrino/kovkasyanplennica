# Անվտանգության ստուգացուցակ

> Համաձայն `.cursor/rules/08-security.mdc`։ Թարմացվել է 2026-02-25։

## Կատարված ստուգումներ և ուղղումներ

### ReDoS (CodeQL)
- [x] **apps/web/app/api/v1/contact/route.ts** — email validation: polynomial regex-ը փոխարինվել է ReDoS-անվտանգ ստուգումներով։
- [x] **apps/web/lib/services/admin/admin-categories.service.ts** — slug generation: regex-ը փոխարինվել է `toSlug()` helper-ով (առանց user input-ի վրա polynomial regex)։

### Գաղտնիքներ և լոգավորում
- [x] **scripts/create-admin.ts** — գաղտնաբառը այլևս չի լոգավորվում (միայն «[set via ADMIN_PASSWORD]»)։
- [x] **apps/web/lib/auth/AuthContext.tsx** — login attempt-ի console.log (password-ի նշում) հեռացվել է։
- [x] **apps/web/lib/services/auth.service.ts** — console.log-երը փոխարինվել են `logger`-ով, գաղտնաբառ/email/phone չեն լոգավորվում։
- [x] **apps/web/lib/middleware/auth.ts** — JWT_SECRET-ի console.error-ը փոխարինվել է logger-ով։

### Ընդհանուր (ստուգված)
- [x] **.gitignore** — `.env`, `.env.*` ներառված են, գաղտնիքներ repo-ում չեն попадать։
- [x] **CORS** — կոդում `origin: '*'` չի օգտագործվում։
- [x] **SQL** — `$queryRawUnsafe` / `$executeRawUnsafe` օգտագործվում են միայն **ստատիկ** SQL-ով (migration scripts, schema checks), user input չի concat արվում — SQL injection ռիսկ չկա։ Նոր raw query-ներ ավելացնելիս միայն `$queryRaw` template literal կամ prepared params։

---

## Խորհուրդներ (ոչ բլոկեր)

### 1. Գաղտնաբառի հեշավորում
- **Ընթացիկ:** bcrypt (bcryptjs), rounds 10։
- **Կանոն 08-security:** խորհուրդ է տրվում argon2 (argon2id) ավելի դիմացկուն ալգորիթմի համար։ Փոխել optional — եթե ցանկանում եք, կարող եք աստիճանաբար migr արել argon2։

### 2. dangerouslySetInnerHTML (XSS ռիսկ)
- **apps/web/app/products/[slug]/ProductInfo.tsx**, **ProductInfoAndActions.tsx** — ապրանքի `longDescription`/`description` ցուցադրվում է HTML-ով։ Եթե բովանդակությունը կարող է խմբագրվել ադմինի կողմից կամ արտաքին աղբյուրից, **պարտադիր** sanitize (օր. DOMPurify)։
- **apps/web/app/cookies/page.tsx** — HTML-ը կառուցվում է `t()` և ֆիքսված link-երից, ռիսկը ցածր, բայց i18n-ի content-ը եթե խմբագրվում է — նույնպես արժե sanitize։

### 3. JWT ժամկետ
- **Ընթացիկ:** `JWT_EXPIRES_IN || "7d"` — 7 օր access token։
- **Կանոն 08-security:** access token-ի համար խորհուրդ 15m–1h, refresh token — 7d։ Կարող եք նեղացնել access-ը և ավելացնել refresh flow։

### 4. Lint և կախվածություններ
- **Lint:** արմատից `pnpm run lint` (turbo) պահանջում է ամբողջ monorepo-ի node_modules (`pnpm install` արմատից)։ `apps/web`-ում `pnpm run lint` = `next lint` — աշխատում է, երբ workspace-ի packages-ը տեղադրված են։
- **no-console:** `.eslintrc.js`-ում `no-console: ['warn', { allow: ['warn', 'error'] }]` — console.log-երը ESLint-ով warn են։ Մնացած console.log-երը (api-client, services) աստիճանաբար փոխարինել logger-ով։

### 5. Rate limiting
- API route-ներում (հատկապես auth, contact) rate limiting դեռ չի ստուգվել։ Խորհուրդ — ավելացնել (օր. `@upstash/ratelimit` կամ Next.js middleware) login/register/contact endpoint-ների համար։

### 6. Security headers
- Next.js-ում ստուգել `next.config.js` — helmet-ի համարժեք headers (X-Content-Type-Options, X-Frame-Options, CSP) արդյոք կարգավորված են։ Անհրաժեշտության դեպքում ավելացնել middleware-ում։

---

## Դեպլոյից առաջ (08-security)

- [ ] Բոլոր գաղտնիքները env-ում, .env-ն .gitignore-ում
- [ ] HTTPS միացված
- [ ] Security headers (CSP, X-Frame-Options և այլն)
- [ ] CORS սահմանափակված
- [ ] Rate limiting (auth/contact)
- [ ] Մուտքային տվյալների վալիդացիա (Zod/վալիդատորներ)
- [ ] Գաղտնաբառերը հեշավորված (bcrypt/argon2)
- [ ] Լոգերում առանց գաղտնիքների/թոքենների
- [ ] SQL injection-ից պաշտպանություն (Prisma/parameterized)
- [ ] XSS — dangerouslySetInnerHTML միայն sanitized content-ի համար
- [ ] CSRF — SameSite cookies, origin check (Next.js Server Actions)

---

**Հաջորդ ստուգում.** Պարբերաբար `pnpm audit`, կախվածությունների թարմացում, CodeQL/ Dependabot alerts։
