// GitHub Pages'ga joylash: npm run deploy
// dist/ ni gh-pages tarmog'iga yuboradi (Actions/workflow kerak emas).
import { execSync } from 'node:child_process'
import { mkdtempSync, cpSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' })
const out = (cmd) => execSync(cmd).toString().trim()

const remote = out('git remote get-url origin')
const repo = remote.replace(/\.git$/, '').split('/').pop()

run('npm run build', undefined) // tekshiruv (tsc) uchun
execSync('npx vite build', { stdio: 'inherit', env: { ...process.env, BASE_PATH: `/${repo}/`, MSYS_NO_PATHCONV: '1' } })

const tmp = mkdtempSync(join(tmpdir(), 'pages-'))
cpSync('dist', tmp, { recursive: true })
writeFileSync(join(tmp, '.nojekyll'), '')
run('git init -q -b gh-pages', tmp)
run('git add -A', tmp)
run('git -c user.name=deploy -c user.email=deploy@local commit -q -m "Deploy"', tmp)
run(`git push -f ${remote} gh-pages`, tmp)
rmSync(tmp, { recursive: true, force: true })
console.log(`\nTayyor: https://${out('gh api user --jq .login').toLowerCase()}.github.io/${repo}/`)
