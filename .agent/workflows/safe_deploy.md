---
description: Safely deploy to Railway by verifying the build locally first. Use this before every deploy.
---

1. Run type checking to catch code errors
// turbo
   `npm run check`

2. Run the build process locally to ensure no build errors. If this fails, DO NOT DEPLOY.
// turbo
   `npm run build`

3. If both steps above succeed, push the changes to Railway
   `git push`
