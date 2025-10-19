# Git Safety Guide — Checkpoints, Backups, and Recovery

## 1️⃣  Create a Safety Branch & Commit
```bash
git checkout -b dev/safe-changes
git add -A
git commit -m "checkpoint: stable before <describe change>"
git push -u origin dev/safe-changes

## 2️⃣  Tag a Stable Restore Point
git tag stable-before-<topic>
git push origin stable-before-<topic>

## 3️⃣  Quick Local Backup for Single File
cp path/to/file.tsx path/to/file.tsx.bak

## 4️⃣  Stage, Commit & Push a Single File (Clean Option B)
git add -A
git status --porcelain
git commit -m "fix(<file>): <short description>"
git push

## 5️⃣  Restore a Single File
git checkout -- path/to/file.tsx
# or, if you made a .bak
cp path/to/file.tsx.bak path/to/file.tsx

## 6️⃣  Roll Back Entire Branch to the Stable Tag

git reset --hard stable-before-<topic>
git push -f origin dev/safe-changes

## 7️⃣  Ignore Local Backups
echo "*.bak" >> .gitignore
git add .gitignore
git commit -m "chore: ignore local .bak files"
git push

## 8️⃣  Verification After Each Change
npx tsc --noEmit   # TypeScript check
npx expo start -c  # Runtime verification




