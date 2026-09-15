# HANDOFF — Molecule compliance pipeline (read this first after /clear)

Updated 2026-09-15 (session 4; the plan is ROADMAP.md, one version; review sheets REVIEW-*.md). Repo /Users/pranjal/Code/poneglyph (app in poneglyph/), branch `molecule`,
origin = github.com/moleculesurat/poneglyph. ROADMAP.md has the plan + status board; REVIEW-2026-09-10.md the draft review.

## Roles (do not drift)
- Pranjal runs a SEPARATE worker session that edits code. I (Claude) never edit code; I commit only docs
  (ROADMAP.md, HANDOFF.md, REVIEW-*.md).
- Loop: I write ONE self-contained task prompt (files, exact changes, acceptance commands with expected output,
  "commit, push, report") -> Pranjal pastes it -> worker reports -> I VERIFY by running the checks myself (tsc, build,
  wrangler dry-run, greps, `npx -y tsx` probes, curl against `npx wrangler dev --port 8787`) -> accept/reject -> next.
- Ponytail on: shortest working diff, no new deps, verbatim regulatory text, never invent rules or facts about Molecule.
  Unknown facts become [PRANJAL: …] slots. Pranjal is the human gate; I only recommend.

## What exists (all verified)
- Corpus: `npm run collect` -> data/collected/mc-pm-2025.json, mc-aif-2026.json (paragraph JSON from given/sources/*.txt).
- Profile: data/entity.ts + data/tenant.ts = Molecule Ventures LLP, PM INP000007216 + aif-manager (Cat II in prep),
  AUM Rs 1,000 cr+, 500 clients (Sep 2026, declared by Pranjal), segments ["pms-discretionary"], CSCRF self-cert,
  NOT M-SOC exempt. Team = ROLE PLACEHOLDERS ("Compliance Officer", "Principal Officer").
- Worker (Cloudflare, /api/*): one shared session sid "molecule"; x-gate-token (env GATE_TOKEN) on all write routes;
  applicability (capacities + chapter title + AIF-category regexes) -> OpenRouter extraction (OPEN_ROUTER_KEY, MODEL
  default z-ai/glm-5.3-flash, 16k tokens, no reasoning cap by Pranjal's order) -> 5-check verifier -> gate ->
  evidence bind (POST /api/obligations/:id/evidence, sha256 of the file, file stays with the firm) -> SHA-256 chain.
  tamper/reset/onboard/mcp demo routes deleted.
- Scripts: `npm run paras -- list|run <circ> <paras|all>` (skips drafted paras, survives dropped connections),
  `npm run decide -- approve|reject ids`, `npm run attach -- OBL-x --title … --file path`, `npm run pull`
  (worker -> data/collected/register.json: approved obligations + evidence + audit chain; idempotent; the worker
  reseeds a fresh KV from it). All need `npx wrangler dev --port 8787` running and `export GATE_TOKEN=$(grep
  '^GATE_TOKEN=' .dev.vars | cut -d= -f2)`. .dev.vars is gitignored (GATE_TOKEN, OPEN_ROUTER_KEY).
- Register in git (43628bf): 119 approved (pm-1, pm-2 decided as recommended), 7 rejected in KV only, EV-001 + EV-002 (browser
  attach test passed). Older 31 rejections were lost at a reseed — register.json did not carry `rejected` (task 22 fixes).
- Earlier register (0f65e97, 3025146): 86 approved (40 PMS / 46 AIF; 31 periodic, 41 event-driven, 10 ongoing,
  4 one-time), 31 rejected, 0 pending, EV-001 (test file ev.txt) bound to OBL-001, 355 events, tip a94246dffa92.
  Every excerpt verbatim in the corpus. All 75 "shall + time limit" paragraphs are drafted or ruled out.
- lib/schedule.ts: parseSchedule (period + window from the excerpt only), nextDue (from the LAST period end),
  effectiveStatus (met periodic duty re-opens as gap once evidence is older than the last period end). 20 date cases pass.
- UI: /live (run one paragraph, gate queue, chain), /register (live overlay from /api/state, attach-evidence form,
  hash computed in browser), /dashboard (upcoming filings + runway from schedule), /onboarding = profile stub.
  Hackathon residue purged (Angel One, CUSPA, QSB, fake MCP). Left: given/*.pdf, DEMO-SCRIPT.txt, chat.txt,
  poneglyph/DESIGN.md + poneglyph/README.md still hackathon-flavoured.

## Pranjal's facts/decisions so far
Discretionary PMS only; distributors YES; ETCD no; CDS no; real-estate investees no; overseas limit YES;
co-investment PMS no; NO debt / money-market securities (2026-09-11 -> withdraw OBL-157); NO investments in associates /
related parties (2026-09-11; limits OBL-178/179/189 stay, complied at zero; consent-form lines OBL-181..188 stay as agreement
template duties — Pranjal may withdraw later); placeholders for names OK for now;
OpenRouter + GLM; no reasoning cap; deployment target = Molecule's AWS, not Cloudflare (2026-09-11).

## Open on PRANJAL's side (as of 2026-09-14)
- Officer names + appointment dates (CO, PO, the 7(2)(e) person); performance fees y/n; superseded 'absolute and final'
  clause y/n; books-location intimation y/n; last 3-yearly registration fee date (OBL-368); sqlite+EFS vs Postgres (1e-ii).
- Approve OBL-401 + pull if not done (expect 287 approved). Kill the leftover `node server.mjs` on :8788 (PID 68004,
  the worker's 31a test instance) and Pranjal's wrangler dev on :8787 — `npm run serve` (port 8787 by default) replaces it.
- Create the Secrets Manager secret `compliance-secrets` before 31b's plan (the task prompt says how).
- Task 31b ISSUED 2026-09-15 (verbatim prompt at the bottom of this file, so a lost paste can be re-sent).

### Older items (kept for history; all resolved)
1. Browser test of Task 17: open localhost:8787/register/, expand an approved row, attach a real file (hash only is
   sent), gate token in the password box; row flips to Met without rebuild; then `npm run pull` + commit register.json.
2. YES/NO on extracting the other ~445 "shall" paragraphs (ongoing duties, e.g. PMS MC 2.7.3.1 automated order
   system now triggered by AUM >= Rs 1,000 cr). Suggested order: PMS ch 2, AIF ch 3, then the rest, ~50 paras a batch,
   review sheet per batch.
3. AIF Regulations 2012 consolidated PDF into given/ (or permission to fetch from sebi.gov.in) -> collect -> the AIF
   registration/launch checklist. Today the register holds only post-registration AIF duties.
4. Real Compliance Officer / Principal Officer names before anyone relies on the register (86 approvals signed
   "Compliance Officer").

## Next worker tasks (ROADMAP.md BUILD ORDER, phase 1)
- Task 18 (1a) ACCEPTED 2026-09-10 (8cdf009; worker found pdftotext form-feeds hiding 22(4), 24(7), 30(2) -> 108 paras): PM Regulations 2020 collect -> data/collected/reg-pm-2020.json (7 chapters, ~106 sub-regulation units,
  ids like 4(1), 22A; optional `heading`). Verify: regs set 1-43 + 22A/34A/42A, no dup ids, no footnote leak, MC JSONs byte-identical.
  Coordinator prototype (scratchpad proto.mjs) got 3/19/6/59/12/6/1 paras per chapter.
- given/1741061994339.pdf (untracked, Pranjal's) = the ORIGINAL Gazette notification of 16 Jan 2020, unamended; not used.
- Task 19 (1a') ACCEPTED 2026-09-10 (91e2d96; REG-PM-2020 = 10 chapters, 144 paras). First cut REJECTED (d7c8be6): Schedule III has 13 items in the source; my spec said 10 (grep missed items
  opening with a sub-marker) and the worker added a fold rule to hit 10 instead of reporting. Fix issued: 5/13/18, total 144. Schedule I (forms), VI (declarations) and the amendment history are not collected.
- Task 20 (1b start) ACCEPTED 2026-09-10 (d3fd652). Batch pm-1: 14 drafts pending -> REVIEW-2026-09-10-pm-1.md (10 approve / 4 reject
  recommended), Pranjal to decide + pull. Task 21 ACCEPTED 2026-09-11 (no code): pm-2 -> 26 drafts, REVIEW-2026-09-11-pm-2.md (23 approve / 3 reject).
  40 drafts pending Pranjal's decisions. Model failures (glm-5.3-flash): invalid JSON on long paras, empty evidenceSpec on
  lead-ins — 2.2.2.2, 2.3.3, 2.5.1.2, 2.9.2, 2.2.2.4, 2.4.1.2, 2.7.4 + re-run 2.7.2.2 (mis-titled). Task 22 ACCEPTED 2026-09-11 (9f09f5f): withdraw route, `rejected` persisted, OBL-157 withdrawn, pm-3 run -> 38 drafts,
  REVIEW-2026-09-11-pm-3.md (20 approve / 18 reject: debt/CB, ETCD, non-discretionary, advisory not applicable).
  Task 23 ACCEPTED 2026-09-11 (be3d5b2): parse errors fed back as correction; pm-4 + pm-5 -> 32 drafts,
  REVIEW-2026-09-11-pm-4-5.md (30 approve / 2 reject). Holdouts: 3.5.3 (bad JSON twice), 4.7.1 (ungrounded), 5.4.4, 5.6.4.
  Task 24 ACCEPTED 2026-09-11 (no code): holdouts recovered, pm-6/pm-7 done, pmr-2 run -> 35 drafts,
  REVIEW-2026-09-11-pm-6-7-pmr-2.md (26 approve / 9 reject). PMS MASTER CIRCULAR EXTRACTION COMPLETE (all 154 shall paras).
  Task 25 ACCEPTED 2026-09-11 (no code): pmr-4 -> 78 drafts, REVIEW-2026-09-11-pmr-4.md (51 approve / 27 reject, mostly
  duplicates of MC lines). Note: a reg-11 run that reported a 300s timeout still wrote drafts later -> the re-run duplicated it.
  Task 26 ACCEPTED 2026-09-11 (no code): -> 60 drafts, REVIEW-2026-09-11-pmr-rest.md (41 approve / 19 reject).
  REG-PM-2020 EXTRACTION COMPLETE except 21, 24(7), 37(1) (one more pass in task 27; 24(7) derivatives-leverage ban matters).
  PMS related-party circular 2022 (given/sources) is NOT collected on purpose: MC 2025 ch 3.4–3.7 consolidates it.
  Task 27 (1c) ACCEPTED 2026-09-12 (a01a9ee): document vault = 284 requirements from evidenceSpec, EV-002 bound, EV-001
  volunteered (OBL-001 has only a data-check spec — correct). 24(7) drafted (OBL-401, approve). Holdouts 21 (code-of-conduct
  pointer, covered by S3 lines) and 37(1) (produce books on inspection, covered by OBL-360–363) are CLOSED, not chased.
  Task 28 (1d) ACCEPTED 2026-09-12 (c2e3b1e) with a BLOCKER: workerd (wrangler dev, local) cannot fetch sebi.gov.in at all
  ("internal error; reference = …" on every source, reproduced by me on a fresh port; curl and Node fetch get 200). Parser +
  triage verified offline against the real pages: 112 unique items, 104323 monitor, 101817 applies, _96560 applies. The live
  poll works only from a runtime that can reach SEBI — the AWS port (Node fetch) removes the blocker; Cloudflare edge untested.
  Pranjal's 8787 dev server is on old code with two workerd processes — restart it.
- Task 29 ACCEPTED 2026-09-12 (82cd8d0): + SEBI press releases (links live under /media-and-notifications/, filter widened)
  + APMI circular PDFs (131 on the home page, diffed by link). `npm run watch:selftest` runs the parsers on fixtures.
  Hardening note: worker/__fixtures__/apmi.html is 1.5 MB; trim to the circulars block when convenient.
- Task 30 (1e-i) ACCEPTED 2026-09-12: INFRA-2026-09.md committed in the INFRA repo (58611bd on master), not here. Port
  sized in ROADMAP 1e-ii. Infra repo on disk: /Users/pranjal/Code/Molecule/molecule_infra (Terraform, S3 backend, admin profile).
- Task 31a ACCEPTED 2026-09-15 (f1d8889): server.mjs (http -> Request -> worker.fetch; static out/ with auto-trailing-slash;
  hourly scheduled()), store.mjs (KV shim on node:sqlite, no WAL), Dockerfile (node:26-slim, bundle via wrangler's esbuild,
  runtime stage has no node_modules), `npm run bundle` / `npm run serve`. Verified by me on :8790 with a fresh store: health
  seeded 286/2/1198, /register 200, /nope 404, traversal 404, /api/state 286/83 tip 689d4373bb9c, LIVE POLL from Node all
  SEVEN sources HTTP 200 (rss 30, circulars 25, afd 25, master 25, regulations 42, press 25, apmi 131 = 295 catches),
  persisted across restart, audit verify intact. Pull round-trip: only line 2 (`source` URL, carries the port) differs —
  my acceptance was wrong, the data is byte-stable. The workerd->sebi blocker is closed by the Node runtime.
  FOUND (pre-existing, not 31a): POST /api/watch/poll is NOT behind the gate token (worker/index.ts ~105); watch.mjs sends
  the token but the worker never checks it. Public on AWS = anyone can make us hit SEBI x7 on demand. Fix in 31c/31d.
- PHASE 1 STATUS 2026-09-12: 1a done, 1b done, 1c done (vault) minus officer names, 1d done minus live poll (workerd blocker),
  1e waiting on Pranjal's infra study. Everything left in phase 1 is on Pranjal's side; phase 2 (AIF) not started. Task 27 was: retry 21, 24(7), 37(1); document vault requirements derived from the approved register's
  evidenceSpec (kind document) and companyDocuments from bound evidence; no new UI. Holiday calendar deferred to hardening
  (only a handful of 'working days' duties; a day's drift changes nothing yet).
- Register in git after pm-3: 138 approved, 26 rejected/withdrawn, tip 39fbe1ebd00a.
- Deployment: task 1e-i = infra STUDY (worker, no code) before any port; Pranjal schedules it.
- Task 20 was: run-paras `shall[:<chapter>]` selector + S2.5 leading-marker nit; then run MC-PM-2025 pm-1.
  PMS shall inventory: MC-PM 154 paras (pm-1 26, pm-2 35, pm-3 32, pm-4 16, pm-5 28, pm-6 15, pm-7 2), REG-PM 114
  (pmr-2 16, pmr-3 4, pmr-4 55, pmr-5 9, pmr-6 5, s2 5, s3 12, s4 6, pmr-1 2). 24 + 26 of these are shall+cadence.
  Batch order: pm-1, pm-2, pm-3, pm-4, pm-5, pm-6+7, pmr-2, pmr-4, pmr-3+5+6+1, s2+s3+s4. REVIEW sheet per batch.
- Then: 1c proof pages; 1d watchtower; 1e deployment.

## Watchtower facts (probed 2026-09-10 from a laptop, curl with a browser UA, no cookies)
- RSS: HTTP 200, 30 items, 29 enforcement/recovery + 1 circular. Missed circular 104323 (AIF, Sep 2026).
- Circulars listing GET (sid=1&ssid=7&smid=0): HTTP 200, 25 items; &deptId=75 -> 25 AIF/FPI items; &deptId=9 -> IMD
  (mutual funds). No intermediary filter in the GET form. Master circulars ssid=6, regulations ssid=3 (deptId ignored).
- Ajax paginator POST sebiweb/ajax/home/getnewslistinfo.jsp -> HTTP 530 from laptop.
- AIF Regulations 2012 consolidated (last amended 14 Jul 2026) page _102975.html, PDF attachdocs/jul-2026/1785301664601.pdf.

## Lessons (keep)
- A count in a spec is a claim about the source, not a target. If the parse disagrees, the worker reports; nobody adds a
  rule to make the number come out. Put this sentence in every collect/parse prompt.
- Validate the plan before cutting tasks; derive data from sources, never hand-type it.
- For text transforms and term lists, spec the false-positive cases and say "grep X must return N lines".
- Run the checks yourself; write date/logic probes with expected values — my own nextDue spec had a bug the
  probe caught (started from the current period, skipped an open window).
- Read the chapter title, not only the paragraph: AIF chapter 7 is Category III throughout.
- One task per prompt; the worker executes literally; a `[PRANJAL: …]` slot beats an invented fact.
- An issued prompt that lives only in chat gets lost (31a had to be re-derived from the code). Paste the verbatim prompt of
  the in-flight task at the bottom of HANDOFF.md when issuing it; delete it on acceptance.
- Before running acceptance curls, `lsof -nP -iTCP:<port> -sTCP:LISTEN`: a leftover server on the port silently answers
  for the one you think you started (my first 31a run hit the worker's stale instance and read newCount 0).
- `npm run pull` stamps the base URL into register.json line 2 — compare from line 3 on, or pull from the same port.

## In-flight task prompt (verbatim) — delete on acceptance

### Task 31b — Terraform for the compliance service (infra repo) + deploy workflow (this repo)

Two repos. Infra: /Users/pranjal/Code/Molecule/molecule_infra (Terraform, master, S3 backend, AWS profile `admin`,
region ap-south-1). App: /Users/pranjal/Code/poneglyph, branch `molecule`, app dir `poneglyph/` (Dockerfile there, task 31a).
Read INFRA-2026-09.md in the infra repo first. No `terraform apply` in this task — plan only; Pranjal applies in 31c.
Expected counts below are claims, not targets: if the plan disagrees, report the plan, do not change resources to hit a number.
The infra repo has two untracked files (bonkers_egress.tf, scripts/bonkers-nat-user-data.sh) — leave them alone, do not commit them.
Every `aws` command on this machine needs `--profile admin` (a shell guard refuses unnamed profiles).

**0. Baseline** (before any edit): `cd molecule_infra && AWS_PROFILE=admin terraform init -input=false && AWS_PROFILE=admin terraform plan -no-color -input=false | tail -3`.
Record the summary line verbatim (the untracked bonkers file may already show adds; that is the baseline, not yours).

**1. Secret** (out of band, as every other secret here). If `aws --profile admin --region ap-south-1 secretsmanager describe-secret --secret-id compliance-secrets` fails, create it:
```
aws --profile admin --region ap-south-1 secretsmanager create-secret --name compliance-secrets --description "poneglyph compliance app (mv-compliance)" \
  --secret-string "{\"GATE_TOKEN\":\"$(openssl rand -hex 24)\",\"OPEN_ROUTER_KEY\":\"$(grep '^OPEN_ROUTER_KEY=' /Users/pranjal/Code/poneglyph/poneglyph/.dev.vars | cut -d= -f2-)\",\"MODEL\":\"z-ai/glm-5.3-flash\"}"
```
Never print the values. Report only the key list:
```
aws --profile admin --region ap-south-1 secretsmanager get-secret-value --secret-id compliance-secrets --query SecretString --output text | python3 -c 'import json,sys;print(sorted(json.load(sys.stdin)))'
#   ['GATE_TOKEN', 'MODEL', 'OPEN_ROUTER_KEY']
```

**2. Module: EFS volumes** — `modules/ecs-service-on-alb/variables.tf` add
```
variable "efs_volumes" {
  type    = list(object({ name = string, file_system_id = string }))
  default = []
}
```
and in `main.tf`'s `aws_ecs_task_definition.task_definition`, after `container_definitions`:
```
  dynamic "volume" {
    for_each = var.efs_volumes
    content {
      name = volume.value.name
      efs_volume_configuration {
        file_system_id     = volume.value.file_system_id
        transit_encryption = "ENABLED"
      }
    }
  }
```
Default `[]` keeps every existing service's task definition unchanged (the plan must show no diff on them).

**3. `ecr_repos.tf`** — `module "mv_compliance_ecr" { source = "./modules/ecr-repo"  name = "mv-compliance-images" }`, same shape as mv_governor_ecr.

**4. `secrets-manager.tf`** — `data "aws_secretsmanager_secret" "compliance_secrets" { name = "compliance-secrets" }` with a one-line comment: keys GATE_TOKEN, OPEN_ROUTER_KEY, MODEL.
**`iam.tf`** — append `data.aws_secretsmanager_secret.compliance_secrets.arn` to the Resource list of `aws_iam_policy.read_sm_secrets_policy` (the execution role cannot read the secret otherwise; this is the one expected "change").

**5. New file `compliance_state.tf`** — the sqlite file's home:
```
# mv-compliance keeps its working state (a node:sqlite file) here; data/collected/register.json in git is the durable truth.
resource "aws_efs_file_system" "compliance_state" {
  encrypted = true
  tags      = { Name = "mv-compliance-state" }
}

resource "aws_security_group" "compliance_efs_sg" {
  name        = "mv-compliance-efs-sg"
  description = "NFS from the mv-compliance service only"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "mv-compliance-efs-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "compliance_efs_from_service" {
  security_group_id            = aws_security_group.compliance_efs_sg.id
  referenced_security_group_id = module.mv_compliance.security_group_id
  description                  = "Allow NFS from mv-compliance service"
  from_port                    = 2049
  to_port                      = 2049
  ip_protocol                  = "tcp"
}

resource "aws_efs_mount_target" "compliance_state" {
  for_each        = { primary = aws_subnet.public_subnet.id, secondary = aws_subnet.public_subnet_secondary.id }
  file_system_id  = aws_efs_file_system.compliance_state.id
  subnet_id       = each.value
  security_groups = [aws_security_group.compliance_efs_sg.id]
}
```

**6. `ecs_services.tf`** — add `compliance = "latest"` to `local.latest_image_tags`, then append, modelled on `module "mv_governor"`:
```
module "mv_compliance" {
  source     = "./modules/ecs-service-on-alb"
  depends_on = [aws_efs_mount_target.compliance_state] # a task cannot mount a volume whose targets do not exist yet

  service_name       = "mv-compliance"
  task_def_family    = "mv-compliance-task-def"
  execution_role_arn = module.ecs_default_task_execution_role.role_arn
  ecs_cluster_id     = aws_ecs_cluster.mv_ecs_cluster.id

  cpu                = "256"
  memory             = "512"
  desired_task_count = 1

  container_name = "compliance"
  container_port = 8080

  efs_volumes = [{ name = "state", file_system_id = aws_efs_file_system.compliance_state.id }]

  container_definitions_json = jsonencode([
    {
      name  = "compliance"
      image = "${module.mv_compliance_ecr.ecr_repository.repository_url}:${local.latest_image_tags.compliance}"
      portMappings = [{ containerPort = 8080, protocol = "tcp", appProtocol = "http" }]
      environment = [
        { name = "PORT", value = "8080" },
        { name = "STATE_DIR", value = "/data" }
      ]
      # every key must exist in compliance-secrets before this task def references it, or the container cannot start
      secrets = [for key in ["GATE_TOKEN", "OPEN_ROUTER_KEY", "MODEL"] : {
        name      = key
        valueFrom = "${data.aws_secretsmanager_secret.compliance_secrets.arn}:${key}::"
      }]
      mountPoints = [{ sourceVolume = "state", containerPath = "/data", readOnly = false }]
      essential   = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/mv-compliance"
          mode                  = "non-blocking"
          awslogs-create-group  = "true"
          max-buffer-size       = "25m"
          awslogs-region        = "ap-south-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  health_check = { path = "/api/health", matcher = "200" }

  vpc_id           = aws_vpc.main.id
  subnet_ids       = [aws_subnet.public_subnet.id, aws_subnet.public_subnet_secondary.id]
  assign_public_ip = true

  ingress_rules = [{ name = "allow-alb", source_sg = aws_security_group.moleculeatomsapis_alb_sg.id, port = 8080, protocol = "tcp" }]
}
```

**7. `lb_moleculeatomsapis.tf`** — listener rule `mv_compliance`, priority 1070, forward to `module.mv_compliance.lb_target_group_arn`,
path `/*`, host `compliance.moleculeatomsapis.com`, same shape as the mcp connector rule. No DNS change: `*.moleculeatomsapis.com` already aliases the ALB.
**README.md** — one line under Backends: `compliance.moleculeatomsapis.com`: Compliance register (poneglyph).

**8. App repo — `.github/workflows/deploy.yml`** at /Users/pranjal/Code/poneglyph (repo root, not poneglyph/). The `aws` calls below run on the GitHub runner, where the OIDC role is the only credential, so they take no profile:
```
name: Deploy compliance

on:
  workflow_dispatch: {}
  push:
    branches: [molecule]
    paths:
      - "poneglyph/**"
      - "!poneglyph/**/*.md"
      - ".github/workflows/deploy.yml"

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: mv-compliance-images
  ECS_CLUSTER: mv-ecs-cluster
  ECS_SERVICE: mv-compliance

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@0e613a0980cbf65ed5b322eb7a1e075d28913a83
        with:
          role-to-assume: arn:aws:iam::484907499667:role/github-actions-role
          aws-region: ${{ env.AWS_REGION }}
      - id: login-ecr
        uses: aws-actions/amazon-ecr-login@62f4f872db3836360b72999f4b87f1ff13310f3a
      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest -t $ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }} poneglyph
          docker push --all-tags $ECR_REGISTRY/$ECR_REPOSITORY
      - name: Roll the service
        run: aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION
      - name: Wait for the rollout
        run: aws ecs wait services-stable --cluster $ECS_CLUSTER --service $ECS_SERVICE --region $AWS_REGION
```
The OIDC role already trusts `repo:moleculesurat/*:*` (github.tf), so no IAM change. The workflow will fail until 31c applies the
Terraform (no ECR repo yet) — expected; do not run it.

**Acceptance** (infra repo, `AWS_PROFILE=admin`):
```
terraform fmt -check -recursive                 # no output
terraform validate                              # Success! The configuration is valid.
terraform plan -no-color -input=false -out=/tmp/31b.plan | tail -3
#   Plan: <baseline adds + 13 or 14> to add, <baseline changes + 1> to change, 0 to destroy.
#   the 13: task def, service, target group, service SG, its ingress + egress rules, listener rule, EFS fs, EFS SG,
#   EFS ingress rule, 2 mount targets, ECR repo; 14 if modules/ecr-repo also emits a lifecycle policy. The 1 change =
#   aws_iam_policy.read_sm_secrets_policy. 0 to destroy is a hard requirement.
terraform show -no-color /tmp/31b.plan | grep -E "^  # .* will be (created|updated|destroyed|replaced)" | sort
#   paste this list verbatim; no existing service's task definition may appear in it
grep -c compliance ecr_repos.tf secrets-manager.tf iam.tf ecs_services.tf lb_moleculeatomsapis.tf README.md   # each >= 1
git status --short                              # your files + the two pre-existing untracked bonkers files, nothing else
```
App repo: `git status --short` shows only `.github/workflows/deploy.yml`; `python3 -c 'import yaml,sys;yaml.safe_load(open(".github/workflows/deploy.yml"));print("yaml ok")'` (if PyYAML is missing, say so and skip).

Commit infra on master: `Add mv-compliance: Fargate service + EFS state + ALB rule (task 31b)`; push if origin is configured, else say so.
Commit app on molecule: `molecule: deploy workflow for mv-compliance (task 31b)`; push. Report the verbatim output of every acceptance
command, the baseline plan line, the secret's key list, and anything that deviated. Skipped on purpose: EFS backup policy (register.json
in git is the truth), autoscaling (one task), a task role (the app touches no AWS API).
