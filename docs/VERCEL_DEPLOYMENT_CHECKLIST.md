# Vercel deployment checklist – narrow down why build uses old code

## 1. Check the build log (after next deploy)

When the build runs, look at the **very beginning** of the build output for:

```
[build-diagnostic] Git commit: XXXXX
[build-diagnostic] insights route.ts: NEW (combinedMonthKeys) | OLD (...)
[build-diagnostic] Expected latest commit: 0afaa1e (...)
```

- **If Git commit is different from 0afaa1e** → Vercel is building an old commit (wrong branch or cache).
- **If insights route.ts is OLD** → The repo Vercel cloned has old code (wrong repo/branch or cache).
- **If you don’t see these lines at all** → Build Command is not `npm run build` (see step 2).

## 2. Build command (must run our script)

1. In Vercel: open your **project** (gym-retention-saas / rippsaas).
2. Go to **Settings** (top tab).
3. In the left sidebar click **General** (or **Build & Development**).
4. Find **Build Command**.
   - It must be **empty** (so Vercel uses `npm run build` from package.json),  
     **or** exactly: `npm run build`
   - If it is `next build` or anything else → change it to **empty** or `npm run build` and save.

## 3. Git repo and branch

1. Still in **Settings**, click **Git** in the left sidebar.
2. Under **Connected Git Repository**:
   - Repository must be: **eddieone1/rippsaas** (or the repo you actually push to).
   - If it shows a different repo or a fork → disconnect and connect the correct repo.
3. Look for **Production Branch** or **Branch**:
   - Set to **main** (same branch you push: `git push origin main`).
   - If it’s `master` or something else and you use `main` locally → change to **main** and save.

## 4. Root directory

1. In **Settings → General** (or **Build & Development**).
2. **Root Directory** should be **empty** (project root where `package.json` and `app/` live).
   - If it’s set to e.g. `frontend` or `app`, our scripts and paths may be wrong; clear it unless you really use a subdir.

## 5. Redeploy correctly

1. Go to **Deployments**.
2. Open the **⋮** menu on the **latest** deployment.
3. Click **Redeploy**.
4. When asked, **do not** use the existing build cache (uncheck “Use existing build cache” or choose “Clear cache and deploy”).
5. After the new build starts, open it and confirm the **commit** shown is your latest (e.g. 0afaa1e or newer).

---

**Quick reference**

| What you want              | Where in Vercel                    | Correct value        |
|---------------------------|------------------------------------|----------------------|
| Build runs our patch      | Settings → General → Build Command | Empty or `npm run build` |
| Build from latest code    | Settings → Git → Production Branch| `main`               |
| Repo we push to           | Settings → Git → Connected Repository | eddieone1/rippsaas |
| Fresh build (no old code) | Redeploy → options                 | Clear cache / don’t use cache |

After changing anything, trigger a **new deployment** and check the `[build-diagnostic]` lines in the log to confirm what’s being built.
