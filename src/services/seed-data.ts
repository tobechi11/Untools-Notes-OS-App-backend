import { prisma } from "../lib/prisma.ts";
import { extractNodes, deriveMetadata } from "./node-extractor.ts";
import { randomUUID } from "crypto";

const TAGS = ["growth", "geo", "fx", "hiring", "product", "strategy", "ops", "risk-mgmt", "infra", "compliance", "partnerships", "finance"];

function sn(nodeType: string, label = "") {
  return { id: randomUUID(), nodeType, label };
}

function p(texts: (string | { type: string; attrs: ReturnType<typeof sn> })[]) {
  return {
    type: "paragraph",
    content: texts.map((t) =>
      typeof t === "string" ? { type: "text", text: t } : { type: "structuredNode", attrs: t.attrs },
    ),
  };
}

function li(texts: (string | { type: string; attrs: ReturnType<typeof sn> })[]) {
  return { type: "listItem", content: [p(texts)] };
}

function bullet(...items: (string | { type: string; attrs: ReturnType<typeof sn> })[][]) {
  return { type: "bulletList", content: items.map((i) => li(i)) };
}

function h2(text: string) {
  return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] };
}

function h3(text: string) {
  return { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text }] };
}

function node(nodeType: string, label = "") {
  return { type: "structuredNode", attrs: sn(nodeType, label) };
}

function empty() {
  return { type: "paragraph" };
}

const SAMPLE_MEMOS = [
  {
    title: "Kenya Market Expansion — Phase 1 Readiness",
    tags: ["geo", "growth", "fx", "hiring", "strategy"],
    tiptapJson: {
      type: "doc",
      content: [
        p(["We've been evaluating East Africa for 18 months. Kenya is the top candidate due to regulatory clarity, mobile money penetration (93% of adults use M-Pesa), and a growing B2B SaaS market. This memo captures the go/no-go decision for Q4 2026."]),
        empty(),
        h2("Core Decision"),
        bullet(
          [node("Decision"), " Launch in Nairobi with a two-channel B2B strategy: direct enterprise sales and a reseller partnership with Safaricom Business. Target 50 paying accounts in the first 6 months. #geo #growth"],
          [node("Option"), " Alternative A: License the product to a local distributor and take royalties — lower risk but caps upside at ~$200k ARR"],
          [node("Option"), " Alternative B: Full subsidiary with local team of 12 — highest control but $450k upfront burn before break-even"],
        ),
        empty(),
        h2("Assumptions & Risks"),
        bullet(
          [node("Assumption"), " Customer acquisition cost stays below $40 in East Africa, based on comparable SaaS benchmarks from Nigeria expansion (actual: $33)"],
          [node("Assumption"), " Safaricom partnership closes by September — we have verbal commitment from their VP of Partnerships but no signed term sheet yet"],
          [node("Assumption"), " Local engineering team (3 devs, 1 PM) can be hired within 6 weeks via Andela and local networks #hiring"],
          [node("Risk"), " FX volatility: KES has depreciated 12% against USD in the past year. If the trend continues, margins compress by 5-8% #fx"],
          [node("Risk"), " Data residency requirements may force us to deploy a local Kubernetes cluster, adding $3k/month in infra costs #infra"],
          [node("Risk"), " Political instability ahead of 2027 elections could slow enterprise buying decisions for 2-3 months"],
        ),
        empty(),
        h2("Expected Outcomes"),
        bullet(
          [node("Metric"), " Target activation rate: 30% of trial users convert to paid within 90 days"],
          [node("Metric"), " Revenue target: $180k ARR by month 12, break-even by month 18"],
          [node("Metric"), " NPS > 40 within first cohort of 20 customers"],
          [node("Upside"), " If Safaricom partnership performs, distribution costs drop 60% and we gain credibility with enterprise buyers"],
          [node("FirstOrderEffect"), " Direct revenue and market presence in East Africa's largest economy"],
          [node("SecondOrderEffect"), " Creates a beachhead for Tanzania and Uganda expansion in 2027, leveraging shared Swahili-language support"],
        ),
        empty(),
        h2("Mental Models Applied"),
        bullet(
          [node("CircleOfCompetence"), " We have strong experience in mobile-first B2B markets from our India launch — similar dynamics apply"],
          [node("PreMortem"), " If this fails in 12 months, the most likely cause is: (1) Safaricom deal falls through, (2) we underestimate localization effort, (3) political environment deteriorates"],
          [node("MarginOfSafety"), " Budget includes 25% contingency buffer ($112k) to absorb FX or timeline surprises"],
        ),
        empty(),
        p([node("Confidence", "High"), " — strong signal from discovery interviews and comparable India expansion data"]),
        p([node("ReviewDate", "2026-04-01"), " — revisit after Safaricom term sheet decision"]),
        p([node("Status", "In Progress")]),
      ],
    },
  },
  {
    title: "Q3 Product Roadmap — AI Summaries vs. Real-Time Collaboration",
    tags: ["product", "strategy", "growth"],
    tiptapJson: {
      type: "doc",
      content: [
        p(["Engineering bandwidth for Q3 is capped at two major initiatives. We need to choose between AI-powered memo summaries (code-named \"Sage\") and real-time collaborative editing (code-named \"Sync\"). Both have strong customer demand but very different strategic implications."]),
        empty(),
        h2("Decision"),
        p([node("Decision"), " Prioritize AI summaries (Sage) for Q3. Defer real-time collab (Sync) to Q4 or Q1 2027. #product #strategy"]),
        empty(),
        h2("Analysis"),
        h3("Option A: AI Summaries (Sage)"),
        bullet(
          ["4-week build with current team (2 engineers + 1 ML engineer)"],
          ["Unlocks self-serve growth: users can share auto-generated decision briefs externally"],
          ["Reduces churn by an estimated 15% based on exit survey data — #1 requested feature from churned users"],
          ["Lower technical risk — uses existing Claude API integration, mostly prompt engineering + UI work"],
          ["Monetization: can gate behind Pro tier immediately, estimated $8k MRR uplift in first quarter"],
        ),
        empty(),
        h3("Option B: Real-Time Collab (Sync)"),
        bullet(
          ["8-10 week build requiring CRDT infrastructure (Yjs) and significant editor rewrite"],
          ["Top request from enterprise prospects — three $50k+ deals are contingent on this feature"],
          ["Higher technical risk: editor stability, conflict resolution, and operational complexity"],
          ["Strategic moat: once shipped, it's hard for competitors to replicate quickly"],
        ),
        empty(),
        h2("Trade-offs"),
        bullet(
          [node("TradeOff"), " Sync has 3x the revenue potential ($150k pipeline) but 2.5x the dev time and significantly higher risk of timeline slip"],
          [node("TradeOff"), " Shipping Sage first means those enterprise deals slip to Q4 at earliest — two of the three prospects have alternatives they're evaluating"],
          [node("Upside"), " Sage unlocks a viral loop: generated summaries get shared → new sign-ups. Sync doesn't have this property"],
          [node("OpportunityCost"), " Every week spent on Sync is a week we're not improving retention, which is our current #1 growth lever"],
        ),
        empty(),
        h2("Risks"),
        bullet(
          [node("Risk"), " Competitors may ship collab first and lock in enterprise accounts — Notion already has it, Coda is beta-testing"],
          [node("Risk"), " AI summary quality may disappoint if we can't solve multi-memo context well (current prototype handles single memos only)"],
          [node("Assumption"), " Claude API costs stay under $0.02 per summary at current volume — need to re-evaluate if usage 5x"],
        ),
        empty(),
        p([node("Confidence", "Medium"), " — data supports Sage but enterprise pipeline for Sync is compelling"]),
        p([node("ReviewDate", "2026-05-15")]),
        p([node("Status", "In Progress")]),
      ],
    },
  },
  {
    title: "Engineering Leadership Hiring — Direct vs. Agency",
    tags: ["hiring", "ops", "growth", "finance"],
    tiptapJson: {
      type: "doc",
      content: [
        p(["We need two senior engineering leads by end of Q2 to support the platform and AI teams. The current team is stretched thin — release velocity has dropped 30% over the past two sprints. This is blocking both the Kenya expansion (needs dedicated backend lead) and the AI summaries roadmap."]),
        empty(),
        h2("Decision"),
        p([node("Decision"), " Go direct-hire for both roles. Skip external agencies. Use a combination of inbound content pipeline, LinkedIn outreach, and referral bonuses ($5k per hire). #hiring"]),
        empty(),
        h2("Context"),
        p(["We've used agencies twice before (TechRecruit and Hired) with mixed results. First hire was excellent (stayed 2+ years), second was a mis-hire who left after 4 months. Agency fees were $38k and $42k respectively — nearly 20% of first-year comp."]),
        empty(),
        p(["Our blog and engineering newsletter have grown significantly since then. The last two technical posts generated 15k+ views each and drove 40+ inbound applications for a mid-level role. We believe senior-level inbound is now viable."]),
        empty(),
        h2("Key Factors"),
        bullet(
          [node("Assumption"), " Inbound pipeline from blog posts and newsletter will generate 20+ qualified senior-level applications within 4 weeks"],
          [node("Assumption"), " Referral program ($5k bonus) will surface at least 5 warm introductions from current team"],
          [node("Constraint"), " Total comp budget capped at $380k for both roles combined ($175-205k range each, depending on location) #finance"],
          [node("Constraint"), " Must have at least one offer accepted by May 15 to hit Kenya launch timeline"],
          [node("Risk"), " Timeline slip if pipeline underperforms — fallback to agency engagement in week 4 #ops"],
          [node("Risk"), " Remote-first policy limits candidate pool for those who prefer in-office — both roles are fully remote"],
        ),
        empty(),
        h2("Evaluation Framework"),
        bullet(
          [node("Metric"), " Week 2 checkpoint: 15+ applications received, 5+ phone screens scheduled"],
          [node("Metric"), " Week 4 checkpoint: 3+ candidates in final round, 1+ offer extended"],
          [node("Metric"), " Quality bar: candidates must have 5+ years experience, led a team of 4+, and passed our system design interview"],
        ),
        empty(),
        h2("Fallback Plan"),
        p(["If we haven't extended an offer by week 4, immediately engage TopTal and Hired in parallel. Budget $40k per role in agency fees (already earmarked in contingency). This gives us a 2-week overlap where both channels are active."]),
        empty(),
        p([node("Confidence", "Low"), " — direct hiring at senior level is unproven for us, but the cost savings ($80k+) justify trying first"]),
        p([node("ReviewDate", "2026-03-28")]),
        p([node("Status", "In Progress")]),
      ],
    },
  },
  {
    title: "SOC 2 Compliance — Build vs. Buy Assessment",
    tags: ["compliance", "infra", "ops", "strategy"],
    tiptapJson: {
      type: "doc",
      content: [
        p(["Three enterprise prospects ($200k+ combined ACV) have flagged SOC 2 Type II as a hard requirement. We don't have it. Current security practices are solid but undocumented. This memo evaluates how to get compliant fastest."]),
        empty(),
        h2("Decision"),
        p([node("Decision"), " Use Vanta for automated compliance + external auditor (Prescient Assurance). Target SOC 2 Type I by August, Type II by February 2027. #compliance"]),
        empty(),
        h2("Options Evaluated"),
        h3("Option A: Vanta + External Auditor (Recommended)"),
        bullet(
          ["Vanta annual: $15k. Auditor: $20k for Type I, $25k for Type II"],
          ["Automates 70%+ of evidence collection — integrates with AWS, GitHub, Slack, HR systems"],
          ["Time to Type I: ~12 weeks. Type II: 6 months observation window after Type I"],
          ["Vanta provides policy templates and employee training modules"],
        ),
        empty(),
        h3("Option B: Manual Process + Auditor"),
        bullet(
          ["Auditor only: $30k for Type I, $35k for Type II"],
          ["Requires dedicated internal owner (estimated 15-20 hrs/week for 4 months)"],
          ["No ongoing monitoring — evidence collection is manual and error-prone"],
          ["Higher risk of audit findings due to inconsistent evidence"],
        ),
        empty(),
        h3("Option C: Defer Compliance"),
        bullet(
          ["Risk losing $200k+ pipeline and future enterprise deals"],
          ["Competitors already SOC 2 compliant — this is becoming table stakes"],
          [node("Risk"), " Delaying 6+ months means those three prospects likely choose a competitor"],
        ),
        empty(),
        h2("Implementation Plan"),
        bullet(
          [node("Assumption"), " Engineering can complete required infra changes (encryption at rest, audit logging, access reviews) in 3 weeks #infra"],
          [node("Assumption"), " Vanta onboarding takes 2 weeks, not the advertised 1 week — based on feedback from founders in our network"],
          [node("Constraint"), " Cannot assign more than 1 engineer to compliance work — rest of team is committed to product roadmap"],
          [node("Risk"), " If audit reveals gaps in our data deletion process, remediation could add 4-6 weeks"],
          [node("Metric"), " Readiness score in Vanta dashboard > 90% before engaging auditor"],
          [node("Metric"), " Zero critical findings in Type I audit"],
        ),
        empty(),
        h2("Financial Impact"),
        p(["Total cost: ~$60k over 12 months. Expected revenue unlocked: $200k+ in enterprise pipeline, plus removal of the #1 objection in 40% of enterprise sales conversations. ROI is clear even if only one of the three deals closes."]),
        empty(),
        p([node("Confidence", "High"), " — well-trodden path, clear ROI, low technical risk"]),
        p([node("ReviewDate", "2026-04-15")]),
        p([node("Status", "In Progress")]),
      ],
    },
  },
  {
    title: "Series A Fundraise — Timing and Strategy",
    tags: ["finance", "strategy", "growth"],
    tiptapJson: {
      type: "doc",
      content: [
        p(["Current runway: 14 months at current burn ($85k/mo). Revenue: $42k MRR, growing 12% month-over-month. We're approaching the inflection point where we either raise to accelerate or stay lean and grow into profitability. This memo frames the decision."]),
        empty(),
        h2("Decision"),
        p([node("Decision"), " Begin Series A process in June 2026, targeting $6-8M raise at $30-40M pre-money. Use the Kenya expansion and AI product launches as narrative catalysts. #finance #strategy"]),
        empty(),
        h2("Why Now"),
        bullet(
          ["MRR growth rate (12% MoM) is at Series A benchmarks — waiting risks the rate decelerating as we hit current TAM ceiling"],
          ["Kenya expansion and SOC 2 compliance both require capital that current runway can't support without cutting product velocity"],
          ["Three tier-1 VCs have proactively reached out in the past 60 days (Accel, Index, Lightspeed)"],
          ["Market window: AI-native productivity tools are hot right now. Waiting 6 months risks missing the cycle"],
        ),
        empty(),
        h2("Key Assumptions"),
        bullet(
          [node("Assumption"), " We can hit $65k MRR by June (requires maintaining 12% MoM growth for 3 more months)"],
          [node("Assumption"), " Kenya launch provides a credible international expansion story that justifies higher valuation multiple"],
          [node("Assumption"), " AI summaries feature ships before fundraise, demonstrating product-led AI capabilities #product"],
          [node("Assumption"), " Founding team can dedicate 50% of time to fundraise for 8-10 weeks without product velocity collapsing"],
        ),
        empty(),
        h2("Risks"),
        bullet(
          [node("Risk"), " Fundraising takes longer than expected (12-16 weeks instead of 8-10) — burns runway to <8 months #risk-mgmt"],
          [node("Risk"), " Valuation expectations reset if AI funding market cools — could be forced to accept $20-25M pre instead of $30-40M"],
          [node("Risk"), " Distraction cost: historical data shows product velocity drops 40% during active fundraise"],
          [node("Risk"), " If Kenya expansion stumbles before close, it undermines the growth narrative"],
        ),
        empty(),
        h2("Alternative: Bootstrap to Profitability"),
        bullet(
          [node("Option"), " Cut burn to $60k/mo (defer Kenya, reduce team by 2), reach profitability at ~$75k MRR in 5-6 months"],
          [node("TradeOff"), " Preserves equity but caps growth rate — competitors with funding will outpace us on features and distribution"],
          [node("Inversion"), " If we imagine looking back in 3 years, which scenario do we regret more: raising too early at a lower valuation, or missing the growth window entirely?"],
        ),
        empty(),
        p([node("Confidence", "Medium"), " — timing feels right but market conditions are volatile"]),
        p([node("ReviewDate", "2026-05-01")]),
        p([node("Outcome", "pending")]),
      ],
    },
  },
  {
    title: "Infrastructure Migration — AWS to Fly.io",
    tags: ["infra", "ops", "finance"],
    tiptapJson: {
      type: "doc",
      content: [
        p(["Our AWS bill has grown to $4,200/month for infrastructure that primarily serves a single-region application. Most of this cost is ECS Fargate, RDS, and ALB. We've been evaluating Fly.io as a simpler, cheaper alternative that also gives us multi-region capabilities for the Kenya expansion."]),
        empty(),
        h2("Decision"),
        p([node("Decision"), " Migrate primary application workloads from AWS ECS to Fly.io. Keep RDS on AWS (connect via Fly's private networking). Target completion by end of May. #infra #ops"]),
        empty(),
        h2("Cost Comparison"),
        bullet(
          ["Current AWS: $4,200/mo (ECS $1,800, RDS $1,200, ALB $400, misc $800)"],
          ["Projected Fly.io: $1,600/mo (3x shared-4x VMs $450, Fly Postgres $200, bandwidth $150, misc $800 for remaining AWS services)"],
          ["Net savings: ~$2,600/month = $31,200/year"],
          [node("Metric"), " Verify actual costs stay within 20% of projection after first full billing cycle"],
        ),
        empty(),
        h2("Technical Assessment"),
        bullet(
          [node("Assumption"), " Our Hono/Bun backend deploys cleanly on Fly.io — validated with a proof-of-concept last week (cold start: 180ms vs 2.1s on Fargate)"],
          [node("Assumption"), " Fly's private networking (WireGuard) provides acceptable latency to AWS RDS in us-east-1 (<5ms)"],
          [node("Risk"), " Fly.io has had multiple outages in 2025 (3 incidents affecting Machines in the past 6 months) — availability SLA is 99.95% vs AWS 99.99%"],
          [node("Risk"), " Team has no production Fly.io experience — debugging production issues will be slower initially"],
          [node("Risk"), " If Fly.io pricing changes or the company struggles financially, migration back to AWS would take 2-3 weeks"],
        ),
        empty(),
        h2("Migration Plan"),
        bullet(
          ["Week 1: Deploy staging environment on Fly.io, run automated test suite against it"],
          ["Week 2: Shadow production traffic (dual-write, compare responses)"],
          ["Week 3: Gradual cutover with Fly.io as primary, AWS as fallback"],
          ["Week 4: Decommission AWS ECS resources, keep RDS"],
          [node("Constraint"), " Zero-downtime migration required — we have customers on annual contracts with 99.9% uptime SLAs"],
        ),
        empty(),
        h2("Multi-Region Benefit"),
        p(["Fly.io makes it trivial to deploy to Nairobi (NBO region). For the Kenya expansion, this means <50ms latency for local users vs 200ms+ routing to us-east-1. This is a significant UX advantage and was a key factor in this evaluation."]),
        empty(),
        p([node("Confidence", "Medium"), " — cost savings are clear but operational risk is non-trivial"]),
        p([node("ReviewDate", "2026-04-10")]),
        p([node("Status", "In Progress")]),
      ],
    },
  },
];

export async function seedUserData(userId: string): Promise<{ memos: number; tags: number; nodes: number }> {
  const tagRecords = await Promise.all(
    TAGS.map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: {},
      }),
    ),
  );

  const tagMap = Object.fromEntries(tagRecords.map((t) => [t.name, t.id]));
  let totalNodes = 0;

  for (const sample of SAMPLE_MEMOS) {
    const tiptapJson = JSON.parse(JSON.stringify(sample.tiptapJson));

    // Replace all structuredNode IDs with fresh UUIDs so the seed can
    // be called multiple times without duplicate-key errors.
    (function refreshIds(node: any) {
      if (node?.type === "structuredNode" && node.attrs?.id) {
        node.attrs.id = randomUUID();
      }
      if (Array.isArray(node?.content)) {
        node.content.forEach(refreshIds);
      }
    })(tiptapJson);

    const memo = await prisma.memo.create({
      data: {
        userId,
        title: sample.title,
        tiptapJson,
      },
    });

    const memoTagIds = sample.tags
      .map((name) => tagMap[name])
      .filter(Boolean);

    if (memoTagIds.length > 0) {
      await prisma.memoTag.createMany({
        data: memoTagIds.map((tagId) => ({ memoId: memo.id, tagId: tagId! })),
      });
    }

    const extracted = extractNodes(tiptapJson);
    totalNodes += extracted.length;

    for (const node of extracted) {
      await prisma.node.create({
        data: {
          id: node.id,
          memoId: memo.id,
          nodeType: node.nodeType,
          content: node.content,
          position: node.position,
          tags: node.tags,
        },
      });
    }

    const metadata = deriveMetadata(extracted);
    await prisma.memo.update({
      where: { id: memo.id },
      data: {
        confidence: metadata.confidence,
        reviewDate: metadata.reviewDate,
        outcome: metadata.outcome,
        status: metadata.status,
      },
    });
  }

  return { memos: SAMPLE_MEMOS.length, tags: TAGS.length, nodes: totalNodes };
}

export async function seedAllUsers(): Promise<{ users: number; memos: number; tags: number; nodes: number }> {
  const users = await prisma.user.findMany({ select: { id: true } });

  let totalMemos = 0;
  let totalTags = 0;
  let totalNodes = 0;

  for (const user of users) {
    const result = await seedUserData(user.id);
    totalMemos += result.memos;
    totalTags += result.tags;
    totalNodes += result.nodes;
  }

  return { users: users.length, memos: totalMemos, tags: totalTags, nodes: totalNodes };
}
