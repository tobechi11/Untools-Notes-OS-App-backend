import { prisma } from "../lib/prisma.ts";
import { extractNodes, deriveMetadata } from "./node-extractor.ts";
import { randomUUID } from "crypto";

const TAGS = ["growth", "geo", "fx", "hiring", "product", "strategy", "ops", "risk-mgmt", "infra", "compliance", "partnerships", "finance"];

function snode(nodeType: string, label = "", bullets: string[] = []) {
  return {
    type: "structuredNode" as const,
    attrs: { id: randomUUID(), nodeType, label, collapsed: true },
    content: [{
      type: "bulletList" as const,
      content: bullets.length > 0
        ? bullets.map(text => ({
            type: "listItem" as const,
            content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text }] }],
          }))
        : [{ type: "listItem" as const, content: [{ type: "paragraph" as const }] }],
    }],
  };
}

function p(text: string) {
  return {
    type: "paragraph" as const,
    content: [{ type: "text" as const, text }],
  };
}

function li(text: string) {
  return { type: "listItem" as const, content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text }] }] };
}

function bullet(...items: string[]) {
  return { type: "bulletList" as const, content: items.map((i) => li(i)) };
}

function h2(text: string) {
  return { type: "heading" as const, attrs: { level: 2 }, content: [{ type: "text" as const, text }] };
}

function h3(text: string) {
  return { type: "heading" as const, attrs: { level: 3 }, content: [{ type: "text" as const, text }] };
}

function empty() {
  return { type: "paragraph" as const };
}

const SAMPLE_MEMOS = [
  {
    title: "Kenya Market Expansion — Phase 1 Readiness",
    tags: ["geo", "growth", "fx", "hiring", "strategy"],
    tiptapJson: {
      type: "doc",
      content: [
        p("We've been evaluating East Africa for 18 months. Kenya is the top candidate due to regulatory clarity, mobile money penetration (93% of adults use M-Pesa), and a growing B2B SaaS market. This memo captures the go/no-go decision for Q4 2026."),
        empty(),
        h2("Core Decision"),
        snode("Decision", "Launch in Nairobi with a two-channel B2B strategy #geo #growth", [
          "Direct enterprise sales and a reseller partnership with Safaricom Business",
          "Target 50 paying accounts in the first 6 months",
        ]),
        snode("Option", "Alternative A: License to local distributor", [
          "Lower risk but caps upside at ~$200k ARR",
        ]),
        snode("Option", "Alternative B: Full subsidiary with local team of 12", [
          "Highest control but $450k upfront burn before break-even",
        ]),
        empty(),
        h2("Assumptions & Risks"),
        snode("Assumption", "CAC stays below $40 in East Africa", [
          "Based on comparable SaaS benchmarks from Nigeria expansion (actual: $33)",
        ]),
        snode("Assumption", "Safaricom partnership closes by September", [
          "Verbal commitment from their VP of Partnerships but no signed term sheet yet",
        ]),
        snode("Assumption", "Local engineering team hired within 6 weeks #hiring", [
          "3 devs, 1 PM via Andela and local networks",
        ]),
        snode("Risk", "FX volatility #fx", [
          "KES has depreciated 12% against USD in the past year",
          "If trend continues, margins compress by 5-8%",
        ]),
        snode("Risk", "Data residency requirements #infra", [
          "May force local Kubernetes cluster deployment",
          "Adding $3k/month in infra costs",
        ]),
        snode("Risk", "Political instability ahead of 2027 elections", [
          "Could slow enterprise buying decisions for 2-3 months",
        ]),
        empty(),
        h2("Expected Outcomes"),
        snode("Metric", "Target activation rate", ["30% of trial users convert to paid within 90 days"]),
        snode("Metric", "Revenue target", ["$180k ARR by month 12, break-even by month 18"]),
        snode("Metric", "NPS > 40", ["Within first cohort of 20 customers"]),
        snode("Upside", "Safaricom partnership performance", ["Distribution costs drop 60% and credibility with enterprise buyers"]),
        snode("FirstOrderEffect", "Direct revenue and market presence", ["East Africa's largest economy"]),
        snode("SecondOrderEffect", "Beachhead for Tanzania and Uganda in 2027", ["Leveraging shared Swahili-language support"]),
        empty(),
        h2("Mental Models Applied"),
        snode("CircleOfCompetence", "Strong mobile-first B2B market experience from India launch"),
        snode("PreMortem", "If this fails in 12 months", [
          "(1) Safaricom deal falls through",
          "(2) Underestimate localization effort",
          "(3) Political environment deteriorates",
        ]),
        snode("MarginOfSafety", "25% contingency buffer ($112k)", ["To absorb FX or timeline surprises"]),
        empty(),
        snode("Confidence", "High", ["Strong signal from discovery interviews and comparable India expansion data"]),
        snode("ReviewDate", "2026-04-01", ["Revisit after Safaricom term sheet decision"]),
        snode("Status", "In Progress"),
      ],
    },
  },
  {
    title: "Q3 Product Roadmap — AI Summaries vs. Real-Time Collaboration",
    tags: ["product", "strategy", "growth"],
    tiptapJson: {
      type: "doc",
      content: [
        p("Engineering bandwidth for Q3 is capped at two major initiatives. We need to choose between AI-powered memo summaries (code-named \"Sage\") and real-time collaborative editing (code-named \"Sync\"). Both have strong customer demand but very different strategic implications."),
        empty(),
        h2("Decision"),
        snode("Decision", "Prioritize AI summaries (Sage) for Q3 #product #strategy", [
          "Defer real-time collab (Sync) to Q4 or Q1 2027",
        ]),
        empty(),
        h2("Analysis"),
        h3("Option A: AI Summaries (Sage)"),
        bullet(
          "4-week build with current team (2 engineers + 1 ML engineer)",
          "Unlocks self-serve growth: users can share auto-generated decision briefs externally",
          "Reduces churn by an estimated 15% based on exit survey data — #1 requested feature from churned users",
          "Lower technical risk — uses existing Claude API integration, mostly prompt engineering + UI work",
          "Monetization: can gate behind Pro tier immediately, estimated $8k MRR uplift in first quarter",
        ),
        empty(),
        h3("Option B: Real-Time Collab (Sync)"),
        bullet(
          "8-10 week build requiring CRDT infrastructure (Yjs) and significant editor rewrite",
          "Top request from enterprise prospects — three $50k+ deals are contingent on this feature",
          "Higher technical risk: editor stability, conflict resolution, and operational complexity",
          "Strategic moat: once shipped, it's hard for competitors to replicate quickly",
        ),
        empty(),
        h2("Trade-offs"),
        snode("TradeOff", "Sync has 3x revenue potential but 2.5x dev time", [
          "$150k pipeline but significantly higher risk of timeline slip",
        ]),
        snode("TradeOff", "Shipping Sage first delays enterprise deals", [
          "Two of the three prospects have alternatives they're evaluating",
        ]),
        snode("Upside", "Sage unlocks viral loop", [
          "Generated summaries get shared → new sign-ups",
          "Sync doesn't have this property",
        ]),
        snode("OpportunityCost", "Every week on Sync delays retention improvements", [
          "Retention is current #1 growth lever",
        ]),
        empty(),
        h2("Risks"),
        snode("Risk", "Competitors may ship collab first", [
          "Notion already has it, Coda is beta-testing",
        ]),
        snode("Risk", "AI summary quality concerns", [
          "Current prototype handles single memos only",
          "Multi-memo context is unsolved",
        ]),
        snode("Assumption", "Claude API costs stay under $0.02 per summary", [
          "Need to re-evaluate if usage 5x",
        ]),
        empty(),
        snode("Confidence", "Medium", ["Data supports Sage but enterprise pipeline for Sync is compelling"]),
        snode("ReviewDate", "2026-05-15"),
        snode("Status", "In Progress"),
      ],
    },
  },
  {
    title: "Engineering Leadership Hiring — Direct vs. Agency",
    tags: ["hiring", "ops", "growth", "finance"],
    tiptapJson: {
      type: "doc",
      content: [
        p("We need two senior engineering leads by end of Q2 to support the platform and AI teams. The current team is stretched thin — release velocity has dropped 30% over the past two sprints. This is blocking both the Kenya expansion (needs dedicated backend lead) and the AI summaries roadmap."),
        empty(),
        h2("Decision"),
        snode("Decision", "Go direct-hire for both roles #hiring", [
          "Skip external agencies",
          "Use inbound content pipeline, LinkedIn outreach, and referral bonuses ($5k per hire)",
        ]),
        empty(),
        h2("Context"),
        p("We've used agencies twice before (TechRecruit and Hired) with mixed results. First hire was excellent (stayed 2+ years), second was a mis-hire who left after 4 months. Agency fees were $38k and $42k respectively — nearly 20% of first-year comp."),
        empty(),
        p("Our blog and engineering newsletter have grown significantly since then. The last two technical posts generated 15k+ views each and drove 40+ inbound applications for a mid-level role. We believe senior-level inbound is now viable."),
        empty(),
        h2("Key Factors"),
        snode("Assumption", "Inbound pipeline generates 20+ qualified senior applications", ["Within 4 weeks from blog posts and newsletter"]),
        snode("Assumption", "Referral program surfaces 5+ warm introductions", ["$5k bonus from current team"]),
        snode("Constraint", "Total comp budget capped at $380k #finance", ["$175-205k range each, depending on location"]),
        snode("Constraint", "At least one offer accepted by May 15", ["To hit Kenya launch timeline"]),
        snode("Risk", "Timeline slip if pipeline underperforms #ops", ["Fallback to agency engagement in week 4"]),
        snode("Risk", "Remote-first policy limits candidate pool", ["Both roles are fully remote"]),
        empty(),
        h2("Evaluation Framework"),
        snode("Metric", "Week 2 checkpoint", ["15+ applications received, 5+ phone screens scheduled"]),
        snode("Metric", "Week 4 checkpoint", ["3+ candidates in final round, 1+ offer extended"]),
        snode("Metric", "Quality bar", ["5+ years experience, led team of 4+, passed system design interview"]),
        empty(),
        h2("Fallback Plan"),
        p("If we haven't extended an offer by week 4, immediately engage TopTal and Hired in parallel. Budget $40k per role in agency fees (already earmarked in contingency). This gives us a 2-week overlap where both channels are active."),
        empty(),
        snode("Confidence", "Low", ["Direct hiring at senior level is unproven for us, but the cost savings ($80k+) justify trying first"]),
        snode("ReviewDate", "2026-03-28"),
        snode("Status", "In Progress"),
      ],
    },
  },
  {
    title: "SOC 2 Compliance — Build vs. Buy Assessment",
    tags: ["compliance", "infra", "ops", "strategy"],
    tiptapJson: {
      type: "doc",
      content: [
        p("Three enterprise prospects ($200k+ combined ACV) have flagged SOC 2 Type II as a hard requirement. We don't have it. Current security practices are solid but undocumented. This memo evaluates how to get compliant fastest."),
        empty(),
        h2("Decision"),
        snode("Decision", "Use Vanta + external auditor (Prescient Assurance) #compliance", [
          "Target SOC 2 Type I by August, Type II by February 2027",
        ]),
        empty(),
        h2("Options Evaluated"),
        h3("Option A: Vanta + External Auditor (Recommended)"),
        bullet(
          "Vanta annual: $15k. Auditor: $20k for Type I, $25k for Type II",
          "Automates 70%+ of evidence collection — integrates with AWS, GitHub, Slack, HR systems",
          "Time to Type I: ~12 weeks. Type II: 6 months observation window after Type I",
          "Vanta provides policy templates and employee training modules",
        ),
        empty(),
        h3("Option B: Manual Process + Auditor"),
        bullet(
          "Auditor only: $30k for Type I, $35k for Type II",
          "Requires dedicated internal owner (estimated 15-20 hrs/week for 4 months)",
          "No ongoing monitoring — evidence collection is manual and error-prone",
          "Higher risk of audit findings due to inconsistent evidence",
        ),
        empty(),
        h3("Option C: Defer Compliance"),
        bullet(
          "Risk losing $200k+ pipeline and future enterprise deals",
          "Competitors already SOC 2 compliant — this is becoming table stakes",
        ),
        snode("Risk", "Delaying 6+ months loses those three prospects", ["They will likely choose a competitor"]),
        empty(),
        h2("Implementation Plan"),
        snode("Assumption", "Engineering completes infra changes in 3 weeks #infra", ["Encryption at rest, audit logging, access reviews"]),
        snode("Assumption", "Vanta onboarding takes 2 weeks", ["Based on feedback from founders in our network, not the advertised 1 week"]),
        snode("Constraint", "Max 1 engineer on compliance work", ["Rest of team committed to product roadmap"]),
        snode("Risk", "Gaps in data deletion process", ["Remediation could add 4-6 weeks"]),
        snode("Metric", "Readiness score in Vanta > 90%", ["Before engaging auditor"]),
        snode("Metric", "Zero critical findings in Type I audit"),
        empty(),
        h2("Financial Impact"),
        p("Total cost: ~$60k over 12 months. Expected revenue unlocked: $200k+ in enterprise pipeline, plus removal of the #1 objection in 40% of enterprise sales conversations. ROI is clear even if only one of the three deals closes."),
        empty(),
        snode("Confidence", "High", ["Well-trodden path, clear ROI, low technical risk"]),
        snode("ReviewDate", "2026-04-15"),
        snode("Status", "In Progress"),
      ],
    },
  },
  {
    title: "Series A Fundraise — Timing and Strategy",
    tags: ["finance", "strategy", "growth"],
    tiptapJson: {
      type: "doc",
      content: [
        p("Current runway: 14 months at current burn ($85k/mo). Revenue: $42k MRR, growing 12% month-over-month. We're approaching the inflection point where we either raise to accelerate or stay lean and grow into profitability. This memo frames the decision."),
        empty(),
        h2("Decision"),
        snode("Decision", "Begin Series A in June 2026 targeting $6-8M #finance #strategy", [
          "$30-40M pre-money valuation",
          "Use Kenya expansion and AI launches as narrative catalysts",
        ]),
        empty(),
        h2("Why Now"),
        bullet(
          "MRR growth rate (12% MoM) is at Series A benchmarks — waiting risks rate decelerating",
          "Kenya expansion and SOC 2 both require capital current runway can't support",
          "Three tier-1 VCs proactively reached out (Accel, Index, Lightspeed)",
          "Market window: AI-native productivity tools are hot right now",
        ),
        empty(),
        h2("Key Assumptions"),
        snode("Assumption", "Hit $65k MRR by June", ["Requires maintaining 12% MoM for 3 more months"]),
        snode("Assumption", "Kenya launch provides international expansion story", ["Justifies higher valuation multiple"]),
        snode("Assumption", "AI summaries ships before fundraise #product", ["Demonstrating product-led AI capabilities"]),
        snode("Assumption", "50% founder time to fundraise for 8-10 weeks", ["Without product velocity collapsing"]),
        empty(),
        h2("Risks"),
        snode("Risk", "Fundraising takes 12-16 weeks #risk-mgmt", ["Burns runway to <8 months"]),
        snode("Risk", "Valuation reset if AI market cools", ["Could be forced to accept $20-25M pre"]),
        snode("Risk", "Product velocity drops 40% during fundraise", ["Historical data shows this pattern"]),
        snode("Risk", "Kenya expansion stumbles before close", ["Undermines the growth narrative"]),
        empty(),
        h2("Alternative: Bootstrap to Profitability"),
        snode("Option", "Cut burn to $60k/mo, reach profitability in 5-6 months", [
          "Defer Kenya, reduce team by 2",
          "Reach profitability at ~$75k MRR",
        ]),
        snode("TradeOff", "Preserves equity but caps growth rate", ["Competitors with funding will outpace on features and distribution"]),
        snode("Inversion", "Which scenario do we regret more in 3 years?", [
          "Raising too early at lower valuation?",
          "Or missing the growth window entirely?",
        ]),
        empty(),
        snode("Confidence", "Medium", ["Timing feels right but market conditions are volatile"]),
        snode("ReviewDate", "2026-05-01"),
        snode("Outcome", "pending"),
      ],
    },
  },
  {
    title: "Infrastructure Migration — AWS to Fly.io",
    tags: ["infra", "ops", "finance"],
    tiptapJson: {
      type: "doc",
      content: [
        p("Our AWS bill has grown to $4,200/month for infrastructure that primarily serves a single-region application. Most of this cost is ECS Fargate, RDS, and ALB. We've been evaluating Fly.io as a simpler, cheaper alternative that also gives us multi-region capabilities for the Kenya expansion."),
        empty(),
        h2("Decision"),
        snode("Decision", "Migrate from AWS ECS to Fly.io #infra #ops", [
          "Keep RDS on AWS (connect via Fly's private networking)",
          "Target completion by end of May",
        ]),
        empty(),
        h2("Cost Comparison"),
        bullet(
          "Current AWS: $4,200/mo (ECS $1,800, RDS $1,200, ALB $400, misc $800)",
          "Projected Fly.io: $1,600/mo (3x shared-4x VMs $450, Fly Postgres $200, bandwidth $150, misc $800)",
          "Net savings: ~$2,600/month = $31,200/year",
        ),
        snode("Metric", "Verify costs within 20% of projection", ["After first full billing cycle"]),
        empty(),
        h2("Technical Assessment"),
        snode("Assumption", "Hono/Bun backend deploys cleanly on Fly.io", ["Validated with POC last week (cold start: 180ms vs 2.1s on Fargate)"]),
        snode("Assumption", "Fly private networking latency <5ms to AWS RDS", ["In us-east-1"]),
        snode("Risk", "Fly.io availability (99.95% vs AWS 99.99%)", ["3 incidents affecting Machines in the past 6 months"]),
        snode("Risk", "Team has no production Fly.io experience", ["Debugging production issues will be slower initially"]),
        snode("Risk", "Fly.io pricing or financial stability risk", ["Migration back to AWS would take 2-3 weeks"]),
        empty(),
        h2("Migration Plan"),
        bullet(
          "Week 1: Deploy staging environment on Fly.io, run automated test suite",
          "Week 2: Shadow production traffic (dual-write, compare responses)",
          "Week 3: Gradual cutover with Fly.io as primary, AWS as fallback",
          "Week 4: Decommission AWS ECS resources, keep RDS",
        ),
        snode("Constraint", "Zero-downtime migration required", ["Customers on annual contracts with 99.9% uptime SLAs"]),
        empty(),
        h2("Multi-Region Benefit"),
        p("Fly.io makes it trivial to deploy to Nairobi (NBO region). For the Kenya expansion, this means <50ms latency for local users vs 200ms+ routing to us-east-1. This is a significant UX advantage and was a key factor in this evaluation."),
        empty(),
        snode("Confidence", "Medium", ["Cost savings are clear but operational risk is non-trivial"]),
        snode("ReviewDate", "2026-04-10"),
        snode("Status", "In Progress"),
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
