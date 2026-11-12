# Nineteen fixes make the SDV deck safe

Not every claim in the interactive SDV deck holds up as of 13 October 2026, but most do. Of roughly 60 checkable statements in `interactive/index.html` and `interactive/data.js`, about two-thirds are correct as written. That includes all of the McKinsey market-sizing numbers, the QNX, Qualcomm, Mobileye, Samsara and Rivian figures, the FTC order terms, the BIS rule dates and the Upstream incident statistics. The problems fall into a few groups:

- **One wrong claim:** China and Korea do not have "drafts". Their R155-aligned rules are already in force.
- **One stale figure:** GM's $300M driver-data accrual is now **$0.5B**.
- **One unsourced claim:** no source supports "90%+ of OEMs committed to zonal".
- **One stale logo:** Airbiquity's assets were bought by Karma in February 2024.
- **About fifteen loose wordings that would fail a careful reader's check:**
  - Tesla's 1.48M figure counts FSD *users*, not subscriptions.
  - The "16% fixed OTA" figure counts vehicles *eligible* for an OTA remedy.
  - "Software keeps 70¢" is really GM's ~70% gross margin on OnStar and Super Cruise.
  - Ford didn't just scale back FNV4. It scrapped it.

The deck also credits sources too loosely. Several survey and analyst figures sit next to "Source: McKinsey, January 2026" or "McKinsey Jan 2026, company filings" footers, but they actually come from:

- QNX/BlackBerry's October 2025 developer survey
- BizzyCar's recall tracker
- ABI Research forecasts
- S&P Global Mobility
- a Sacra revenue estimate

None of these is an error that sinks the deck's argument, and the four whitespace candidates still stand. But the errors are concentrated on the cover, the Why-SDVs slide and the Risks slide, where an evaluator is most likely to check. The fixes are cheap text edits in `data.js` and `index.html`. The deck's header says its text is transcribed from `diagrams/*.tex` and `01 Executive Summary.md`, so make the same edits there too.

## At a glance: what must change before the deck is shown

The edits fall into three tiers. Tier A items are factually wrong or out of date and must change. Tier B items are true numbers with misleading wording or the wrong source credit. Tier C items need a date stamp or label polish. Field names refer to `data.js` (L1–L8 = `LAYERS` by `id`) unless `index.html` is named.

| Tier | Where | Current text | Change to | Why |
|---|---|---|---|---|
| A | L7 `moats[1]` | "China, India and Korea have aligned drafts" | "China (GB 44495/44496, in force Jan 2026) and Korea (CSMS, in force Aug 2025) have R155/R156-aligned rules; India's AIS-189/190 are still draft (June 2026)" | China's standards are mandatory national standards ([TÜV SÜD](https://www.tuvsud.com/en/knowledge-hub/technical-updates/consumer-products-and-retail-essentials/china-implements-vehicle-cybersecurity-technical-requirements)). Korea's rules have applied to new types since 14 Aug 2025 ([Korea Herald](https://www.koreaherald.com/article/10660606)). India published only draft rules, on 27 Jun 2026 ([Autocar Pro](https://www.autocarpro.in/news/india-drafts-mandatory-cybersecurity-software-update-rules-for-connected-and-autonomous-vehicles-133260)) |
| A | L6 `moats[2]` | "GM accrued $300M for related litigation" | "GM has accrued $0.5B for Smart Driver data investigations and litigation (10-Q, 30 Jun 2026)" | $0.3B was the figure through Q3 2025. It was $0.5B at end-2025 and still $0.5B at 30 Jun 2026 ([GM 10-Q Q2 2026](https://www.sec.gov/Archives/edgar/data/1467858/000146785826000051/gm-20260630.htm)) |
| A | `CANDIDATES[0].text` | "90%+ of OEMs are committed to zonal architecture" | "Most OEMs are moving to zonal/central E/E: McKinsey expects 77% of architectures produced by 2035 to be zonal or central, up from under 30% today" | No source for 90%+ was found. The closest is a vendor-cited Tier-1 survey (~96% "in some way or shape" by 2029) ([Design News](https://www.designnews.com/automotive-engineering/why-cars-are-migrating-zonal-electric-architecture)) |
| A | L4 `logos` | Airbiquity chip | Remove; swap in Elektrobit (OTA with PlaxidityX) or Aurora Labs | Karma Automotive bought Airbiquity's assets, IP, staff and contracts on 28 Feb 2024 ([Karma](https://karmaautomotive.com/news/karma-automotive-acquires-assets-and-key-personnel-from-connected-vehicle-pioneer-airbiquity/)) |
| A | L4 `statcap`; `SHIFTS[2].text` | "~16% of recalled US vehicles fixed over the air (Q3 2025)"; "already fixed OTA" | "~15% of recalled US vehicles since 2022 (17.3M) were eligible for an OTA remedy (BizzyCar)" | BizzyCar measures vehicles *eligible* for an OTA remedy. The quarterly share swings from 3% to 47% ([BizzyCar Q4 2025](https://bizzycar.com/blog/automotive-recall-alert-8.6-million-vehicles-recalled-in-q4-2025)) |
| A | L4 `statcap`; `index.html` "Cheaper recalls" | "29.2M vehicles"; "About 900 US recalls" | "891 US vehicle recalls covered 29.3M vehicles in 2025 (NHTSA)" | NHTSA 2025 annual recall report ([NHTSA PDF, Mar 2026](https://www.nhtsa.gov/sites/nhtsa.gov/files/2026-03/2025-annual-recalls-report.pdf)) |
| A | L3 `winning[2]` | "Tesla: 1.48M active FSD subscriptions" | "Tesla: 1.48M active FSD (Supervised) users, Q2 2026 (~45% on subscription)" | The figure counts buyers and subscribers together ([InsideEVs](https://insideevs.com/news/802547/tesla-fsd-subscription-half/)) |
| A | `HUB.sdv`; `index.html` Risks | "Ford scaled back its centralized architecture" | "Ford scrapped its FNV4 zonal architecture in 2025, folding it into FNV3" | Reuters, 30 Apr 2025 ([Automotive News Europe](https://europe.autonews.com/ford/an-ford-kills-electronics-project-0430)) |
| B | `SHIFTS[1].text`; `index.html` "Recurring revenue" | "software keeps about 70¢ of each dollar" | "GM targets ~70% gross margins on OnStar and Super Cruise" | The figure comes from GM's Q3 2025 letter and covers OnStar and Super Cruise only ([Repairer Driven News](https://www.repairerdrivennews.com/2025/10/23/gm-reports-double-digit-revenue-growth-from-onstar-expects-trend-to-continue/)) |
| B | L5 `statcap` | "from ~13M subscribers paying ~$20 a month" | "~12M subscribers (end-2025), targeting 13M by end-2026, at ~$20 average monthly revenue per subscriber" | 13M is a target and $20 is an average, not a price ([GM Q1 2026 call](https://www.fool.com/earnings/call-transcripts/2026/04/28/gm-q1-2026-earnings-call-transcript/)) |
| B | L8 `moats[1]`; `CANDIDATES[1].text`; `index.html` Growth pools | "Integration is the top SDV challenge for 52% of engineering VPs" | "52% of engineering VPs name integration complexity as a top SDV challenge (QNX, 2025)" | The source is a QNX executive's byline, not McKinsey, and it says "a top challenge", not "the top challenge" ([Design News, 5 Jan 2026](https://www.designnews.com/automotive-engineering/why-software-defined-vehicles-are-the-ultimate-test-for-automakers)) |
| B | L8 `winning[1]` | "Applied Intuition: $15B valuation, serves 18 of the top 20 OEMs, ~$830M ARR" | "Applied Intuition: $15B valuation (June 2025; ~$30B offers reported Oct 2026); says it serves 18 of the top 20 OEMs; ~$830M ARR (2025, Sacra estimate)" | The company has not disclosed ARR ([Sacra](https://sacra.com/c/applied-intuition/)) |
| B | `index.html` cover and Why-SDVs | "$519B SDV software & electronics" | "$519B automotive software & electronics by 2035" | McKinsey's label is the automotive software and electronics market, in a light-vehicle base-case scenario ([McKinsey](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape)) |
| B | L4 `callStat` | "OTA recall fixes save US OEMs $1.5B by 2028" | "OTA recall fixes could save US OEMs $1.5B by 2028 (ABI Research forecast, 2023)" | It's a forecast. The layer text already says "could" but the callout drops it ([ABI Research](https://abiresearch.com/press/by-2028-automakers-will-save-us15-billion-using-over-the-air-updates-to-fix-recalled-cars)) |
| B | L3 `statcap`; `POOLS[0].note` | "the biggest growth pool in the stack (19.4%/yr)" | "the largest software growth pool: ~$9B (2025) to ~$50B (2035), nearly 20%/yr (McKinsey: 19.4%)" | Rounded $9B→$50B works out to 18.7%/yr. Compute units grow faster in % terms over 2030–35 |
| B | `index.html` value-chain footer | "Public sources only (McKinsey Jan 2026, company filings)" | "Public sources: McKinsey (Jan 2026), company filings and releases, NHTSA, FTC, QNX developer survey (Oct 2025), ABI Research, BizzyCar, Upstream, S&P Global Mobility" | Many figures are not from McKinsey or filings |
| B | `ACTORS` consumers `logos` | OnStar and Super Cruise chips under "Consumers" | Generic "drivers / households" chip, or rename the group "Consumer-facing services" | GM products are not consumers |
| C | L7 `moats[2]`; `REGULATORS.detail` | "hardware from 2030" | "hardware from MY2030 (1 Jan 2029 for units without a model year)" | [BIS, 14 Jan 2025](https://www.bis.gov/press-release/commerce-finalizes-rule-secure-connected-vehicle-supply-chains-foreign-adversary-threats) |
| C | L1 `winning[1]` | "Qualcomm: record $1.6B automotive quarter, +61%; Snapdragon Cockpit in 75M+ vehicles" | "Qualcomm: record $1.59B auto revenue in fiscal Q3 2026 (June qtr), +61% YoY; Snapdragon Cockpit in 75M+ vehicles (as of June 2025)" | Adds the quarter and the as-of date |

## Claim-by-claim verdicts, slide by slide

Each table gives the deck claim, its verdict, the corrected figure, suggested replacement wording, and the best primary source available. Where the primary source was blocked, the table names the secondary source the figure was taken from.

### Cover and "Why companies are betting on SDVs"

The headline McKinsey numbers are sound. The problems are a mislabelled market, a recall total that is off by 0.1M, and a margin claim that stretches GM's wording. McKinsey's 2035 report is credited as "January 2026". Search summaries and press coverage support that month, but McKinsey's own page metadata and the PDF could not be read to confirm it.

| Claim (location) | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "$519B SDV software & electronics by 2035" (cover, Why-SDVs) | Partly correct | $519B by 2035 is right, but McKinsey's market is "automotive software and electronics" (light vehicles, Current Trajectory scenario), not SDV-only | "$519B automotive software & electronics market by 2035 (McKinsey)" | [McKinsey, "The automotive software and electronics market through 2035"](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape) (~Jan 2026) |
| 4.5%/yr vs vehicles ~1%/yr | Correct | "4.5 percent CAGR" vs "around 1.0 percent CAGR" | Keep | Same McKinsey article |
| "Software and electronics are the only part of the car still growing fast" | Unverifiable as worded | McKinsey supports "growing ~4.5× faster than the vehicle market", not "the only part" | "Software and electronics are growing about 4.5× faster than the vehicle market" | Same McKinsey article |
| "GM expects OnStar to pass $3B in 2026" | Correct | Guided $3.1B of recognized revenue, +15% YoY; "more than $3B" after Q2 | "GM guides ~$3.1B OnStar revenue in 2026 (+15%)" | [GM Q1 2026 call, 28 Apr 2026](https://www.fool.com/earnings/call-transcripts/2026/04/28/gm-q1-2026-earnings-call-transcript/); [GM Authority, Jul 2026](https://gmauthority.com/blog/2026/07/gm-onstar-business-revenue-increases-20-percent-in-q2-2026/) |
| "software keeps about 70¢ of each dollar" | Partly correct | ~70% gross margin projected for OnStar and Super Cruise only. The CFO says margins are lower once service costs are included | "…and targets ~70% gross margins on OnStar and Super Cruise" | [Repairer Driven News on GM Q3 2025 letter, 23 Oct 2025](https://www.repairerdrivennews.com/2025/10/23/gm-reports-double-digit-revenue-growth-from-onstar-expects-trend-to-continue/) |
| "Rivian's Gen 2 cut ECUs from 17 to 7" | Correct | "from 17 ECUs to 7", plus 1.6 miles of wiring removed | Keep | [Rivian / Business Wire, 6 Jun 2024](https://www.businesswire.com/news/home/20240606335706/en/Rivian-Introduces-Second-Generation-R1S-R1T) |
| "About 900 US recalls hit 29.2M vehicles in 2025" | Partly correct | 891 vehicle recalls, 29.3M vehicles (997 recalls and 31.3M units if equipment, tires and child seats are included) | "891 US vehicle recalls covered 29.3M vehicles in 2025" | [NHTSA 2025 Annual Report: Safety Recalls, Mar 2026](https://www.nhtsa.gov/sites/nhtsa.gov/files/2026-03/2025-annual-recalls-report.pdf) (read via [EngiMarket](https://www.engimarket.com/blog/vehicle-recall-statistics/)) |
| "OTA fixes could save US OEMs $1.5B by 2028" | Correct (forecast, dated) | ABI forecast, US only. It's unclear whether the figure is annual or cumulative | "…could save US OEMs $1.5B by 2028 (ABI Research, 2023)" | [ABI Research, 3 May 2023](https://abiresearch.com/press/by-2028-automakers-will-save-us15-billion-using-over-the-air-updates-to-fix-recalled-cars) |
| "Chinese rivals already run development cycles of about 18 to 24 months" | Correct (minor wording) | Chinese makers "routinely target" 18–24 months, about half the Western norm | "Chinese rivals target 18–24-month development cycles, about half the Western norm" | [S&P Global Mobility AutoTechInsight, 14 Jul 2026](https://autotechinsight.spglobal.com/news/5289482/the-real-meaning-of-china-speed) |

The "$1.5B" figure also appears as the "Cheaper recalls" headline. It is a three-year-old forecast, and nothing shows that ABI has updated it. Label it as a forecast wherever it appears.

### Ecosystem slide (actors, hub, regulators, four shifts)

The ecosystem narrative is directionally right, but two shift texts overstate their evidence. Direct chip deals between OEMs and chipmakers are well documented. Qualcomm and BMW co-developed Snapdragon Ride Pilot (September 2025), and in July 2026 Qualcomm signed a long-term deal to supply BMW's main compute chips. No source found puts a number on how much Tier 1s are being "squeezed", and Qualcomm still partners with Bosch. Dealers losing visits is also well supported in qualitative terms, but every dollar estimate found is from 2016–2023.

| Claim (location) | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| Chipmakers win lead-compute deals directly from OEMs (Qualcomm with BMW), "squeezing Tier 1s" (`semis.sdv`, `SHIFTS[0]`, `tier1.sdv`) | Partly correct | Direct deals confirmed. The squeeze isn't quantified | "OEMs increasingly source central compute directly from chipmakers (BMW–Qualcomm, 2025–26), shrinking Tier 1s' share of the content" | [Reuters via The Star, 29 Jul 2026](https://www.thestar.com.my/tech/tech-news/2026/07/29/qualcomm-wins-bmw-chip-supply-deal-for-future-vehicle-platforms); [Qualcomm, 5 Sep 2025](https://www.qualcomm.com/news/releases/2025/09/qualcomm-and-bmw-group-unveil-groundbreaking-automated-driving-s) |
| Platform competition is concentrating: "QNX, Google, Vector, RV Tech, Applied Intuition" (`swp.sdv`, L2 `critical[1]`) | Partly correct | RV Tech is a captive Rivian–VW joint venture. No evidence was found that it licenses to other OEMs | "…QNX, Google, Vector and Applied Intuition, plus OEM-built platforms such as Rivian–VW's RV Tech" | [Rivian–VW JV launch, Nov 2024](https://www.automotiveworld.com/news/faster-leaner-more-efficient-rivian-and-volkswagen-group-announce-the-launch-of-their-joint-venture/) |
| "Dealers lose software-fix visits as updates move over the air" (`dealers.sdv`, `SHIFTS[2]`) | Correct (qualitative) | ABI: a fully OTA industry costs dealers repair revenue and foot traffic. Nearly half of ~10M software-recall vehicles still needed a dealer visit | Keep. Optionally add "(ABI Research)" | [ABI Research press release](https://www.abiresearch.com/press//abi-research-anticipates-accelerated-adoption-auto?hsLang=en); [Canadian Auto Dealer, May 2023](https://canadianautodealer.ca/2023/05/ota-updates-to-fix-recalled-cars-will-save-oems-1-5b/) |
| "About 16% of recalled US vehicles were already fixed OTA in Q3 2025" (`SHIFTS[2]`) | Partly correct (wrong metric; one quarter is not representative) | 16.0% *eligible* in Q3 2025; 15% in Q4 2025; ~47% in Q1 2026; 3.1% in Q2 2026; ~15% since 2022 | "About 15% of recalled US vehicles since 2022 could be fixed over the air (BizzyCar)" | [BizzyCar Q3 2025, 14 Oct 2025](https://www.bizzycar.com/blog/automotive-recall-alert-8.5-million-vehicles-recalled-in-q3-2025); [BizzyCar Q2 2026](https://www.bizzycar.com/blog/quarterly-recall-report-nearly-11-million-vehicles-recalled-in-q2-2026) |
| "GM expects OnStar to pass $3B in 2026" (`consumers.sdv`, `SHIFTS[1]`) | Correct | $3.1B guided | Keep | [GM Q1 2026 call](https://www.fool.com/earnings/call-transcripts/2026/04/28/gm-q1-2026-earnings-call-transcript/) |
| "only about 40% of Super Cruise owners renew after the trial" (`consumers.sdv`) | Correct (wording) | ~40% (range 30–40%) keep paying after **3 years of included service**. GM presents the rate as strong | "about 30–40% of owners keep paying for Super Cruise after the 3 included years" | [GM Q1 2026 call](https://www.fool.com/earnings/call-transcripts/2026/04/28/gm-q1-2026-earnings-call-transcript/); [GM Q4 2025 call, 27 Jan 2026](https://www.fool.com/earnings/call-transcripts/2026/01/27/gm-gm-q4-2025-earnings-call-transcript/) |
| "software keeps about 70 cents of each dollar" (`SHIFTS[1]`) | Partly correct | See Cover table | See Cover table | See Cover table |
| "FTC's 2026 order … makes opt-in consent the gate for data revenue" (`partners.sdv`, `REGULATORS.detail`) | Correct | Final order 14 Jan 2026 (2–0 vote): affirmative express consent for 20 years; 5-year ban on sharing with consumer reporting agencies; no fine | Keep | [FTC, 14 Jan 2026](https://www.ftc.gov/news-events/news/press-releases/2026/01/ftc-finalizes-order-settling-allegations-gm-onstar-collected-sold-geolocation-data-without-consumers) |
| "VW's Cariad lost €2.4B in 2023" (`HUB.sdv`) | Correct | €2,392M operating loss in 2023, then €2,431M in 2024 | Optionally: "…€2.4B in 2023 and again in 2024" | [InsideEVs](https://insideevs.com/news/753673/vw-group-cariad-billions-losses-2024); [Marqstats](https://marqstats.com/insights/cariad-volkswagen-software-losses-lesson/) |
| "Ford scaled back its centralized architecture in 2025" (`HUB.sdv`) | Partly correct (understated) | FNV4 was cancelled and its learnings folded into FNV3 | "Ford scrapped its FNV4 architecture in 2025" | [Automotive News Europe (Reuters), 30 Apr 2025](https://europe.autonews.com/ford/an-ford-kills-electronics-project-0430) |
| "UN R155/R156 mandatory for new EU registrations since July 2024" (`REGULATORS.detail`) | Correct | New types from 6 Jul 2022; all new registrations from 7 Jul 2024 | Keep | [UN R155](https://unece.org/transport/documents/2021/03/standards/un-regulation-no-155-cyber-security-and-cyber-security); [Reg. (EU) 2019/2144](https://eur-lex.europa.eu/eli/reg/2019/2144/oj) |
| "US Commerce rule bars Chinese/Russian connected-vehicle software from MY2027 and hardware from 2030" (`REGULATORS.detail`) | Correct (add precision) | Final rule 14 Jan 2025, effective 17 Mar 2025; software MY2027; hardware MY2030 (1 Jan 2029 for units without a model year); vehicles ≤10,000 lb | "…software from MY2027 and hardware from MY2030" | [BIS, 14 Jan 2025](https://www.bis.gov/press-release/commerce-finalizes-rule-secure-connected-vehicle-supply-chains-foreign-adversary-threats); [Federal Register, 16 Jan 2025](https://www.federalregister.gov/documents/2025/01/16/2025-00592/securing-the-information-and-communications-technology-and-services-supply-chain-connected-vehicles) |
| Regulator list: NHTSA, UNECE R155/R156, US Commerce, FTC, ISO 26262/21434 (`REGULATORS.list`) | Correct | The group is already titled "Regulators & standards", so ISO is acceptable. "US Commerce" is more precisely BIS | "US Commerce (BIS)". Optionally add China MIIT/SAMR and ISO 24089 | [BIS Connected Vehicles](https://www.bis.gov/connected-vehicles) |

### Value chain: layers 1–8

#### Layer 1, Compute & E/E

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| Central compute $5B→$17B, 2030–35 (`callStat`, `stat`) | Correct | McKinsey Exhibit 6: CCUs $5B→$17B (~28%/yr) | Keep | [McKinsey 2035 article](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape) |
| Zonal units $4B→$13B (`statcap`) | Correct | ZCUs $4B→$13B (~27%/yr) | Keep | Same |
| "Qualcomm: record $1.6B automotive quarter, +61%" (`winning[1]`) | Correct | $1.59B in fiscal Q3 2026 (quarter ended 28 Jun 2026), +61% YoY, a record | Add "(fiscal Q3 2026)" | [Qualcomm Q3 FY26 release, Jul 2026](https://www.qualcomm.com/news/releases/2026/07/qualcomm-announces-third-quarter-fiscal-2026-results); [Futurum](https://futurumgroup.com/insights/qualcomm-q3-fy-2026-automotive-growth-offsets-handset-weakness/) |
| "Snapdragon Cockpit in 75M+ vehicles" (`winning[1]`) | Correct (date-stamp) | "more than 75 million vehicles" as of June 2025 | "…75M+ vehicles (June 2025)" | [Qualcomm CES 2026 release, Jan 2026](https://www.qualcomm.com/news/releases/2026/01/qualcomm-drives-the-future-of-mobility-with-strong-snapdragon-di) |
| "SDV platforms need 30–50% spare compute for future OTA features" (`critical[0]`) | Partly correct (analyst opinion) | One ABI analyst says "up to 30% to 50%". OEM expectations vary by segment, and premium vehicles expect more than 50% | "Analysts advise 30–50% compute headroom for future OTA features (more for premium)" | [EE Times Asia, ABI Research, 31 Oct 2024](https://www.eetasia.com/support-from-chip-partners-needed-for-sdv-success/); [WardsAuto/NXP survey, 10 Apr 2024](https://www.wardsauto.com/news/tackling-oems-dilemmas-in-software-defined-vehicle-transition/798163/) |

#### Layer 2, Software platforms

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "275M+ vehicles running QNX, across 45+ automakers including the top 10" (`stat`, `statcap`) | Correct | >275M vehicles; 45+ automakers incl. the top 10 and 24 of the top 25 EV OEMs | Keep | [BlackBerry FY2026 10-K (FY ended 28 Feb 2026)](https://www.sec.gov/Archives/edgar/data/1070235/000107023526000039/bbry-20260228.htm) |
| "Android Automotive powers Volvo, GM, Ford, Renault-Nissan and others" (`winning[1]`) | Mostly correct | Volvo/Polestar, GM and Renault are confirmed. Ford calls its Digital Experience "built with Google". Nissan shipping was not confirmed | "Android Automotive powers Volvo/Polestar, GM, Renault and others; Ford's system is built with Google" | [9to5Google (GM)](https://9to5google.com/2019/09/05/gm-android-automotive-2021/); [ABC News 4 (Alliance)](https://abcnews4.com/news/auto-matters/renault-nissan-to-use-android-system-in-its-dashboards); [Ford Authority, Nov 2024](https://fordauthority.com/2024/11/ford-digital-experience-developed-in-partnership-with-google) |
| "OS and middleware ~$3B → ~$13B by 2035 (~16%/yr)" (`moats[2]`, `callStat`) | Correct | Exhibit 4: 16.2%, 2025–35; the arithmetic checks out | Keep | [McKinsey 2035 article](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape) |
| "Open source (Eclipse S-CORE) pressures price" (`critical[2]`) | Partly correct (analysis, not fact) | S-CORE exists and is OEM-backed (BMW, Mercedes-Benz, Bosch, QNX and others). It is pre-1.0 (v0.8) and not yet in series production | "OEM-backed open source (Eclipse S-CORE, v0.8, pre-production) is likely to pressure middleware pricing" | [Automotive World, Nov 2025](https://www.automotiveworld.com/news/eclipse-s-core-releases-version-0-5-alpha-for-vehicle-middleware/); [aeemobility](https://aeemobility.de/english-content/eclipse-s-core-v0-8-released/) |
| Competition list incl. RV Tech and Applied Intuition (`critical[1]`) | Partly correct | See Ecosystem table | See Ecosystem table | See Ecosystem table |

#### Layer 3, ADAS & automated driving

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "$9B → $50B in ADAS software by 2035" (`callStat`, `stat`) | Correct | Exhibit 4: ~$9B (2025) → ~$50B (2035) | Keep, adding "(2025)" for the start year | [McKinsey 2035 article](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape) |
| "the biggest growth pool in the stack (19.4%/yr)" (`statcap`) | Partly correct | 19.4% is McKinsey's number, but rounded $9B→$50B gives 18.7%. It is the largest *software* pool by dollar growth (+~$41B), not the fastest-growing segment in the stack (CCU/ZCU grow faster over 2030–35) | "the largest software growth pool, nearly 20%/yr (McKinsey: 19.4%)" | Same |
| "Mobileye: ~38M EyeQ chips in 2026" (`winning[1]`) | Correct (date-stamp) | FY26 outlook "underpinned by about 38 million EyeQ units" (Apr 2026; not restated in July) | "~38M EyeQ units in FY26 outlook (Apr 2026)" | [Mobileye Q1 2026 call, 23 Apr 2026](https://www.fool.com/earnings/call-transcripts/2026/04/23/mobileye-mbly-q1-2026-earnings-transcript/) |
| "Surround ADAS at $100–150 and ~70% gross margin" (`winning[1]`) | Correct | ASP of about $100–150, with "similar gross margins to our base ADAS volume, which is roughly 70%" | Keep | Same |
| "Tesla: 1.48M active FSD subscriptions" (`winning[2]`) | Partly correct (wrong noun) | 1.48M active FSD (Supervised) **users** at Q2 2026: ~55% bought it upfront, ~45% subscribe | "1.48M active FSD users (Q2 2026)" | [Not a Tesla App](https://www.notateslaapp.com/news/4483/tesla-fsd-reaches-148-million-active-subscriptions); [InsideEVs](https://insideevs.com/news/802547/tesla-fsd-subscription-half/) |
| "L2 could be 52% of sales by 2030, L3 16% by 2035" (`moats[2]`) | Correct (per McKinsey text) | L2 52% by 2030; L3 16% by 2035 (from <1% in 2025). One press write-up says 52% by 2035, so check Exhibit 1 | Keep | [McKinsey 2035 article](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape) |

#### Layer 4, OTA & software lifecycle

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "OTA recall fixes save US OEMs $1.5B by 2028" (`callStat`) | Correct only as a forecast | ABI forecast, 2023 | "could save … (ABI Research forecast)" | [ABI Research, 3 May 2023](https://abiresearch.com/press/by-2028-automakers-will-save-us15-billion-using-over-the-air-updates-to-fix-recalled-cars) |
| "~16% of recalled US vehicles fixed over the air (Q3 2025)" (`stat`, `statcap`) | Partly correct, outdated | 16% *eligible* in Q3 2025; ~15% since 2022 | "~15% of recalled US vehicles OTA-remediable since 2022" | [BizzyCar Q4 2025, 19 Jan 2026](https://bizzycar.com/blog/automotive-recall-alert-8.6-million-vehicles-recalled-in-q4-2025) |
| "29.2M vehicles were recalled in 2025" (`statcap`) | Partly correct | 29.3M | "29.3M" | [NHTSA, Mar 2026](https://www.nhtsa.gov/sites/nhtsa.gov/files/2026-03/2025-annual-recalls-report.pdf) |
| "Tesla and Rivian build in-house; Harman, Sibros and Excelfore supply everyone else" (`winning[1]`) | Correct but simplified | Excelfore has 20+ OEM customers; Harman OTA dates back to Red Bend. Other vendors exist | "…specialists such as Harman, Sibros and Excelfore supply many others" | [Frost & Sullivan (Excelfore), 2024](https://www.frost.com/news/press-releases/excelfore-recognized-with-frost-sullivans-2024-global-enabling-technology-leadership-award-for-its-revolutionary-ota-solutions-for-the-automotive-industry/); [Harman OTA](https://car.harman.com/solutions/ota/harman-ota-over-air-solution) |
| "UN R156 software-update compliance" (`moats[1]`) | Correct | Same EU phase-in as R155 | Keep | [UN R156](https://unece.org/transport/documents/2021/03/standards/un-regulation-no-156-software-update-and-software-update) |
| "most recall root causes are still hardware" (`pain[2]`) | Correct | Software is ~20–25% of campaigns (183 of 891 in 2025 by one analysis). It is the largest single category and growing | Keep, or add "though software is now the largest single category" | [EngiMarket analysis of NHTSA data](https://www.engimarket.com/blog/vehicle-recall-statistics/); [Recall Masters](https://www.recallmasters.com/sor/) |

#### Layer 5, Telematics & connectivity

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "OnStar $3B+ in 2026" (`callStat`, `stat`) | Correct | $3.1B guided | Keep | [GM Q1 2026 call](https://www.fool.com/earnings/call-transcripts/2026/04/28/gm-q1-2026-earnings-call-transcript/) |
| "from ~13M subscribers paying ~$20 a month" (`statcap`) | Partly correct | 12M at end-2025; 13M is the end-2026 target; ~$20 is average revenue per subscriber, and many are on bundled plans | "~12M subscribers, targeting 13M by end-2026, at ~$20 average monthly revenue each" | Same; [GM Q4 2025 call](https://www.fool.com/earnings/call-transcripts/2026/01/27/gm-gm-q4-2025-earnings-call-transcript/) |
| "Samsara: $2.1B ARR, growing 30% a year" (`winning[1]`) | Correct | $2,124.7M ARR, +30% YoY, Q2 FY2027 (quarter ended 1 Aug 2026) | Optionally add "(Aug 2026)" | [Samsara Q2 FY27, 3 Sep 2026](https://secure.businesswire.com/news/home/20260903120692/en/Samsara-Reports-Second-Quarter-Fiscal-Year-2027-Financial-Results) |
| "Samsara: 25T+ data points a year" (`moats[0]`) | Correct | "more than 25T data points annually" | Keep | [Samsara Q4 FY26, 5 Mar 2026](https://www.samsara.com/company/news/press-releases/q4-fiscal-year-2026-results) |

#### Layer 6, Data & cloud services

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "20 years of opt-in consent required by the FTC's January 2026 order against GM" (`stat`, `statcap`) | Correct | Affirmative express consent for the order's 20-year life (with exceptions such as data for first responders) | Keep | [FTC, 14 Jan 2026](https://www.ftc.gov/news-events/news/press-releases/2026/01/ftc-finalizes-order-settling-allegations-gm-onstar-collected-sold-geolocation-data-without-consumers) |
| "bars GM from sharing driving data with reporting agencies for 5 years" (`moats[1]`) | Correct | Covers geolocation and driver-behavior data shared with *consumer* reporting agencies | "…with consumer reporting agencies…" | Same |
| "GM accrued $300M for related litigation" (`moats[2]`) | Outdated | $0.5B accrued (31 Dec 2025, 31 Mar and 30 Jun 2026); GM "cannot yet estimate" further loss | "GM has accrued $0.5B for related investigations and litigation" | [GM 10-Q Q2 2026](https://www.sec.gov/Archives/edgar/data/1467858/000146785826000051/gm-20260630.htm); [GM 10-K FY2025](https://www.sec.gov/Archives/edgar/data/1467858/000146785826000013/gm-20251231.htm) |

#### Layer 7, Cybersecurity

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "494 public automotive cyber incidents in 2025; 92% remote, ~44% ransomware (Upstream)" (`stat`, `statcap`) | Correct | 494; 92% remote; 44% "ransom-related", more than double 2024 | Optionally "~44% ransom-related" | [Upstream via PR Newswire, 26 May 2026](https://en.prnasia.com/releases/global/ransomware-attacks-on-automotive-and-smart-mobility-more-than-doubled-in-2025-according-to-new-research-by-upstream-security-534351.shtml); [WardsAuto, 18 Feb 2026](https://www.wardsauto.com/news/ai-doubles-automotive-cyber-attacks-sdvs-updtream/813455/) |
| "UN R155/R156 mandatory for new EU registrations since July 2024" (`moats[0]`) | Correct | 7 Jul 2024 for all new registrations | Keep | [UN R155](https://unece.org/transport/documents/2021/03/standards/un-regulation-no-155-cyber-security-and-cyber-security) |
| "China, India and Korea have aligned drafts" (`moats[1]`) | **Wrong** | China: in force 1 Jan 2026 (new types). Korea: in force 14 Aug 2025 (new types). India: draft only | See Tier A wording | [TÜV SÜD](https://www.tuvsud.com/en/knowledge-hub/technical-updates/consumer-products-and-retail-essentials/china-implements-vehicle-cybersecurity-technical-requirements); [Korea Herald](https://www.koreaherald.com/article/10660606); [Autocar Pro, 27 Jun 2026](https://www.autocarpro.in/news/india-drafts-mandatory-cybersecurity-software-update-rules-for-connected-and-autonomous-vehicles-133260) |
| "US Commerce rule bars … software from MY2027, hardware from 2030" (`moats[2]`) | Correct | Hardware applies from MY2030 | "…hardware from MY2030" | [BIS, 14 Jan 2025](https://www.bis.gov/press-release/commerce-finalizes-rule-secure-connected-vehicle-supply-chains-foreign-adversary-threats) |
| "PlaxidityX was formerly Argus Cyber Security" (`winning[1]`) | Correct | Renamed 15 Aug 2024; Continental subsidiary, now under Aumovio | "PlaxidityX (formerly Argus; Aumovio)" | [S&P Global AutoTechInsight](https://autotechinsight.spglobal.com/news/5277522/argus-cyber-security-changes-corporate-name-to-plaxidityx) |
| "42 ISO/SAE 21434 work products" (`pain[2]`) | Correct per secondary sources (standard is paywalled) | 42 | Keep | [ISO/SAE 21434:2021](https://www.iso.org/standard/70918.html); [Yarix](https://www.yarix.com/Workbook) |

#### Layer 8, Integration, V&V & tooling

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "11.4%/yr, the fastest-growing SDV software service through 2035 (McKinsey)" (`stat`, `statcap`, `callStat`) | Correct (loose label) | "the highest CAGR of 11.4% … within software integration, verification, and validation services" (Exhibit 3, 2025–35) | "11.4%/yr: the fastest-growing component of the auto software market (McKinsey)" | [McKinsey 2035 article](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape) |
| "Applied Intuition: $15B valuation, serves 18 of the top 20 OEMs, ~$830M ARR" (`winning[1]`) | Partly correct / outdated | $15B as of June 2025; ~$30B offers reported 13 Oct 2026, not closed. "18 of top 20" is the company's own claim. $830M ARR is a Sacra estimate | See Tier B wording | [Applied Intuition Series F, 17 Jun 2025](https://www.appliedintuition.com/news/series-f); [Sacra](https://sacra.com/c/applied-intuition/); [Tech Startups, 13 Oct 2026](https://techstartups.com/2026/10/13/applied-intuition-receives-investment-offers-at-30-billion-valuation-doubling-its-15-billion-valuation/) |
| "Integration is the top SDV challenge for 52% of engineering VPs" (`moats[1]`) | Partly correct, weakly sourced | 52% of VPs of Engineering name integration complexity as *a* top challenge. No VP sample size is published | See Tier B wording | [Design News (QNX's Justin Moon), 5 Jan 2026](https://www.designnews.com/automotive-engineering/why-software-defined-vehicles-are-the-ultimate-test-for-automakers) |
| "Developers cite long cycles (37%) and debugging and testing (36%)" (`critical[0]`) | Correct | 37% / 36% (integration complexity also 36%); n=1,100, vendor survey | Add "(QNX survey, n=1,100)" | [QNX press release, 14 Oct 2025](https://www.nasdaq.com/press-release/qnx-research-reveals-regulatory-pressure-and-development-bottlenecks-are-stalling-sdv) |

### Growth pools ("Where the money grows")

All four bars match McKinsey. The issue is how the slide is put together. The footer credits McKinsey for everything, but the slide also carries QNX's 52% VP figure. It also shows ADAS software growing at 19.4% right beside a callout calling integration and V&V the "fastest-growing software service" at 11.4%. Both numbers are McKinsey's, but they come from different exhibits that slice the market differently: Exhibit 4 splits the market by software domain, while Exhibit 3 splits it into software development, integration and V&V services, power electronics and so on. A reader who sees them together will think the slide contradicts itself.

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| ADAS/AD software 9→50, "by 2035 · 19.4%/yr" (`POOLS[0]`) | Correct (rounding gap) | Rounded $9B→$50B over 10 years is 18.7%. 19.4% implies a 2025 base of ~$8.5B | Note: "2025–35 · ~19%/yr" | [McKinsey 2035 article](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape) |
| Central compute 5→17; zonal 4→13, 2030–35 (`POOLS[1–2]`) | Correct | Exhibit 6 | Keep | Same |
| OS & middleware 3→13, ~16%/yr (`POOLS[3]`) | Correct | 16.2% | Keep | Same |
| "OnStar alone is expected to pass $3B in 2026" | Correct | $3.1B | Keep | [GM Q1 2026 call](https://www.fool.com/earnings/call-transcripts/2026/04/28/gm-q1-2026-earnings-call-transcript/) |
| "11.4%/yr Integration and V&V is the fastest-growing software service" | Correct, but reads as contradicting the 19.4% bar | Exhibit 3 component split | "11.4%/yr: integration and V&V services are the fastest-growing slice of auto software spend (a different McKinsey cut from the bars above)" | Same |
| "Integration is the top SDV challenge for 52% of engineering VPs" | Partly correct; credited to the wrong source by the slide footer | QNX, "a top challenge" | Add "(QNX, 2025)" inline | [Design News, 5 Jan 2026](https://www.designnews.com/automotive-engineering/why-software-defined-vehicles-are-the-ultimate-test-for-automakers) |

### Whitespace (candidate positions)

The dot placements and "open pocket" calls are labelled as team hypotheses, so this report does not fact-check them. Only the factual supports in the candidate texts are checked.

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "90%+ of OEMs are committed to zonal architecture" (`CANDIDATES[0]`) | **Unverifiable** | The closest data: ~80% fully or semi-zonal by 2026 and ~96% "in some way" by 2029 (unnamed Tier-1 survey, 2021–22). Only ~32% of OEMs expect body-zonal to be the main production architecture by 2030. McKinsey: 77% of architectures zonal/central by 2035 | See Tier A wording | [McKinsey 2035 article](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape); [WardsAuto/NXP, 10 Apr 2024](https://www.wardsauto.com/news/tackling-oems-dilemmas-in-software-defined-vehicle-transition/798163/) |
| "Integration is the top SDV challenge for 52% of engineering VPs" (`CANDIDATES[1]`) | Partly correct | As above | As above | As above |
| "UN R155 and the US Commerce rule turn supplier provenance and patching into approval gates" (`CANDIDATES[3]`) | Partly correct | R155 is a type-approval gate. The BIS rule is a sale and import prohibition enforced through annual Declarations of Conformity, not an approval | "…into type-approval (R155) and compliance (BIS declarations) gates" | [Mayer Brown, Jan 2025](https://www.mayerbrown.com/en/insights/publications/2025/01/us-commerce-department-finalizes-rule-on-connected-vehicles-with-supply-chain-links-to-china-and-russia) |

### Risks and next steps

Every risk number on this slide is real. Two need rewording so they don't overstate the source.

| Claim | Verdict | Corrected figure | Suggested wording | Best source (date) |
|---|---|---|---|---|
| "€2.4B lost by VW's Cariad in 2023" | Correct | €2,392M; €2,431M in 2024 | Optionally add "and again in 2024" | [InsideEVs](https://insideevs.com/news/753673/vw-group-cariad-billions-losses-2024) |
| "2025 Ford scaled back its centralized architecture" | Partly correct | FNV4 cancelled | "2025: Ford scrapped its FNV4 zonal architecture" | [Automotive News Europe, 30 Apr 2025](https://europe.autonews.com/ford/an-ford-kills-electronics-project-0430) |
| "~40% of Super Cruise owners renew after the trial" | Correct (wording) | 30–40% after 3 included years | "~30–40% keep paying after 3 included years" | [GM Q1 2026 call](https://www.fool.com/earnings/call-transcripts/2026/04/28/gm-q1-2026-earnings-call-transcript/) |
| "The FTC's 2026 order against GM makes consent the gate for data revenue" | Correct | 14 Jan 2026 final order | Keep | [FTC, 14 Jan 2026](https://www.ftc.gov/news-events/news/press-releases/2026/01/ftc-finalizes-order-settling-allegations-gm-onstar-collected-sold-geolocation-data-without-consumers) |

## Who plays where: one stale logo, three mislabelled groups, five ownership changes

The company-to-role map is sound at its core. Every chipmaker, OS vendor and OTA specialist is in a defensible layer, and companies that span layers (Qualcomm, NVIDIA, Mobileye, Vector) are correctly shown more than once. The only hard error is **Airbiquity**. The rest of the changes come from a wave of 2025–26 deals that changed ownership:

- **Synopsys** closed its ~$35B Ansys purchase on 17 Jul 2025 ([Synopsys](https://news.synopsys.com/2025-07-17-Synopsys-Completes-Acquisition-of-Ansys)).
- **NXP** closed its $625M TTTech Auto deal in June 2025 ([TTTech Auto](https://www.tttech-auto.com/newsroom/nxp-completes-acquisition-tttech-auto-accelerate-transformation-software-defined-vehicles)).
- **Elektrobit and PlaxidityX** moved into Aumovio, Continental's automotive spin-off, in September 2025 ([Elektrobit](https://www.elektrobit.com/about/)).
- **Aptiv** spun its wiring business off as Versigent on 1 Apr 2026 ([Aptiv 8-K](https://www.sec.gov/Archives/edgar/data/0001521332/000152133226000057/aptvq22026ex991.htm)).
- **Harman** agreed in December 2025 to buy ZF's ADAS business for €1.5B ([Brake & Front End](https://www.brakeandfrontend.com/harman-to-acquire-zfs-adas-business/)). No closing announcement was found.

| Group or layer | Chip | Verdict | Fix | Source |
|---|---|---|---|---|
| L4 OTA | Airbiquity | **Wrong (stale)** | Remove. Replace with Elektrobit or Aurora Labs | [Karma, 28 Feb 2024](https://karmaautomotive.com/news/karma-automotive-acquires-assets-and-key-personnel-from-connected-vehicle-pioneer-airbiquity/) |
| Ecosystem "Consumers" | OnStar, Super Cruise | **Mislabelled** | Generic "drivers / households" chip, or rename the group "Consumer-facing services" | [TechCrunch, 14 Jan 2026](https://techcrunch.com/2026/01/14/the-ftcs-data-sharing-order-against-gm-is-finally-settled) |
| Ecosystem "SDV specialists" | Harman | Weak | Harman is a Samsung-owned Tier 1 buying ZF ADAS. Swap for Sibros or Excelfore | [Brake & Front End](https://www.brakeandfrontend.com/harman-to-acquire-zfs-adas-business/); [Excelfore](https://excelfore.com) |
| Ecosystem "Data partners" | Motive, Samsara | Weak (duplicates telematics) | Keep one telematics chip and add an insurance chip, or drop "insurance" from the sub-label | [FreightWaves](https://www.freightwaves.com/news/motive-files-for-ipo-signaling-next-phase-of-fleet-tech-arms-race) |
| L2 platforms, ecosystem text | RV Tech | Weak | Label it "OEM-built platform (Rivian–VW JV)", not a merchant competitor | [Automotive World (1,500 staff)](https://www.automotiveworld.com/news/rivian-and-volkswagen-joint-venture-reaches-1500-employees/) |
| L2 platforms | Elektrobit | OK | Caption "Elektrobit (Aumovio)" | [Wikipedia: Aumovio](https://en.wikipedia.org/wiki/Aumovio_SE) |
| L7 cyber | PlaxidityX | OK | Caption "PlaxidityX (Aumovio)" | [Elektrobit about](https://www.elektrobit.com/about/) |
| L7 cyber | VicOne | OK | Caption "VicOne (Trend Micro)" | [VicOne](https://vicone.com/why-vicone/) |
| L7 cyber | Karamba | Weak | Independent but has had no 2025–26 news. Consider Cybellum or ETAS | [S&P AutoTechInsight](https://autotechinsight.spglobal.com/news/5271618/karamba-securitys-xguard-host-idps-software-reaches-3-million-deployments) |
| L8 V&V | Synopsys | OK, stronger | Caption "Synopsys (incl. Ansys)" | [Synopsys, 17 Jul 2025](https://news.synopsys.com/2025-07-17-Synopsys-Completes-Acquisition-of-Ansys) |
| L1 compute | NXP | OK | Optionally note TTTech/MotionWise (also a software-layer player) | [TTTech Auto](https://www.tttech-auto.com/newsroom/nxp-completes-acquisition-tttech-auto-accelerate-transformation-software-defined-vehicles) |
| L1 compute, ecosystem Tier 1 | Aptiv | OK | Wiring now sits in Versigent; Aptiv keeps Wind River | [Aptiv 8-K Q2 2026](https://www.sec.gov/Archives/edgar/data/0001521332/000152133226000057/aptvq22026ex991.htm) |
| L1 compute | Bosch | Weak-OK | The only non-chipmaker in a chip-heavy row. Fine under "E/E" | n/a |
| Ecosystem Tier 1 | ZF | OK (pending change) | ADAS unit being sold to Harman | [Brake & Front End](https://www.brakeandfrontend.com/harman-to-acquire-zfs-adas-business/) |
| Ecosystem "Fleet operators" | Uber, Lyft | Weak-OK | Caption "ride-hail / robotaxi fleets". Hertz is the only true owner-operator | [TechCrunch (Uber–Lucid–Nuro), 17 Jul 2025](https://techcrunch.com/2025/07/17/uber-makes-multi-million-dollar-investment-in-lucid-nuro-to-build-robotaxi-service); [Lyft–Waymo](https://www.lyft.com/blog/posts/lyft-and-waymo-launch-partnership-to-expand-autonomous-mobility-to-nashville) |
| L3 ADAS | (missing) | Optional | Add Waymo as the leading L4 operator | [Lyft–Waymo](https://www.lyft.com/blog/posts/lyft-and-waymo-launch-partnership-to-expand-autonomous-mobility-to-nashville) |
| L3 ADAS | NVIDIA, Qualcomm | OK | NVIDIA DRIVE AV in the Mercedes CLA; Snapdragon Ride Pilot in the BMW iX3 | [NVIDIA blog](https://blogs.nvidia.com/blog/drive-av-software-mercedes-benz-cla/); [Qualcomm, 5 Sep 2025](https://www.qualcomm.com/news/releases/2025/09/qualcomm-and-bmw-group-unveil-groundbreaking-automated-driving-s) |
| L2 platforms | QNX, Vector, Wind River, Android Automotive | OK | No change. Wind River is still an Aptiv subsidiary | [BlackBerry 10-K](https://www.sec.gov/Archives/edgar/data/1070235/000107023526000039/bbry-20260228.htm) |
| L4, L5 | Excelfore, Harman (OTA), Motive, Samsara, OnStar | OK | Excelfore is active. Motive filed for an IPO in December 2025 | [FreightWaves](https://www.freightwaves.com/news/motive-files-for-ipo-signaling-next-phase-of-fleet-tech-arms-race) |

Some roles were taken from homepages and not re-checked against 2025–26 evidence: Mobileye, Infineon, Renesas, Sibros, Upstream, dSPACE, Applied Intuition's layer placement, TomTom, HERE, AT&T, Verizon, the hyperscalers and the OEM hub brands. They are long-standing and very likely still right, but this pass did not rule out recent changes.

## Source attributions: credit QNX, BizzyCar, ABI and Sacra, not McKinsey

McKinsey's 2035 report contains only the market-sizing figures: $519B, 4.5% vs 1%, the CCU, ZCU, ADAS and OS pools, 11.4%, and L2 52% / L3 16%. It does not mention compute headroom, Chinese development cycles or any "90% committed to zonal" figure ([McKinsey](https://www.mckinsey.com/features/mckinsey-center-for-future-mobility/our-insights/mapping-the-automotive-software-and-electronics-landscape)). The deck seldom names a wrong source in a claim itself. The misattribution comes from two catch-all footers, "Public sources only (McKinsey Jan 2026, company filings)" on the value-chain slide and "Source: McKinsey, January 2026" on the growth-pools slide, which a reader will take to cover every number nearby. The table below gives the correct credit for each figure that is not McKinsey's.

| Figure | Where in deck | Correct credit | Note |
|---|---|---|---|
| 52% of engineering VPs; 37% / 36% developer pain points | L8, Growth pools, Whitespace #2 | QNX (BlackBerry), *Under the Hood: SDV Developer Report*, Oct 2025, n=1,100 ([press release](https://www.nasdaq.com/press-release/qnx-research-reveals-regulatory-pressure-and-development-bottlenecks-are-stalling-sdv)) | Vendor survey. The 52% comes from a QNX executive's byline, not the release |
| 30–50% compute headroom | L1 | James Hodgson, ABI Research ([EE Times Asia, 31 Oct 2024](https://www.eetasia.com/support-from-chip-partners-needed-for-sdv-success/)) | One analyst's opinion, not a standard |
| 18–24-month Chinese cycles | Why SDVs | S&P Global Mobility AutoTechInsight ([14 Jul 2026](https://autotechinsight.spglobal.com/news/5289482/the-real-meaning-of-china-speed)) | McKinsey's separate product-development work says ~24 months |
| ~16% OTA share | L4, Shift 3 | BizzyCar, from NHTSA data ([Q3 2025](https://www.bizzycar.com/blog/automotive-recall-alert-8.5-million-vehicles-recalled-in-q3-2025)) | Not an NHTSA statistic |
| $1.5B OTA savings by 2028 | Why SDVs, L4 | ABI Research forecast ([3 May 2023](https://abiresearch.com/press/by-2028-automakers-will-save-us15-billion-using-over-the-air-updates-to-fix-recalled-cars)) | Forecast, US only |
| ~$830M Applied Intuition ARR | L8 | Sacra estimate ([Sacra](https://sacra.com/c/applied-intuition/)) | Not disclosed by the company |
| "70¢ of each dollar" | Why SDVs, Shift 2 | Media shorthand for GM's "gross margins of approximately 70%" on OnStar and Super Cruise ([RDN](https://www.repairerdrivennews.com/2025/10/23/gm-reports-double-digit-revenue-growth-from-onstar-expects-trend-to-continue/)) | Attribute to GM, Q3 2025 shareholder letter |
| 90%+ committed to zonal | Whitespace #1 | No source found | Replace with McKinsey's 77%-by-2035 figure |
| 494 / 92% / 44% | L7 | Upstream Security, 2026 report ([PR Newswire](https://en.prnasia.com/releases/global/ransomware-attacks-on-automotive-and-smart-mobility-more-than-doubled-in-2025-according-to-new-research-by-upstream-security-534351.shtml)) | Already credited correctly |
| 11.4% integration and V&V | L8 | McKinsey, Exhibit 3 | Already credited correctly |

## Open items a human still needs to confirm

Several figures rest on secondary quotations because the primary pages returned HTTP 403, were paywalled or would not download. Five scheduled releases also land within weeks of this check and could make the deck's latest-quarter figures stale before it is shown. Neither group is likely to change a verdict, but whoever signs off on the deck should clear them.

| Item | What to check | Where | Why it matters |
|---|---|---|---|
| McKinsey 2035 PDF | (a) The publication month really is January 2026. (b) Whether Exhibit 1 shows L2 at 52% in 2030 or 2035. (c) The unrounded 2025 ADAS base (~$8.5B?). (d) The Exhibit 3 $294B→$469B / 4.1% mismatch | [McKinsey PDF](https://www.mckinsey.com/~/media/mckinsey/features/mckinsey%20center%20for%20future%20mobility/our%20insights/mapping%20the%20automotive%20software%20and%20electronics%20landscape/2025/the-automotive-software-and-electronics-market-through-2035.pdf) (blocked to automated fetch) | Cover attribution date; L3 `moats[2]`; the 19.4% rounding |
| NHTSA 2025 recall report | The exact "891 recalls / 29.3M vehicles" wording, and whether Tesla is missing from the list of OTA remedy makers | [NHTSA PDF](https://www.nhtsa.gov/sites/nhtsa.gov/files/2026-03/2025-annual-recalls-report.pdf) (403) | Why-SDVs and L4 figures |
| QNX report PDF | The VP sub-sample size behind the 52%, the research firm and the fieldwork dates | [QNX PDF](https://blackberry.qnx.com/content/dam/blackberry-qnx-com/en/industries/automotive/reports/under-the-hood-sdv-developer-report-oct-2025-v1.2.pdf) (redirects) | Whether to keep the 52% at all |
| GM primary letters | Q3 2025 letter (exact "~70%" wording); Q2 2026 letter (whether the $3.1B guidance was reaffirmed); Q4 2025 deck (Super Cruise subscribers: 620k or 120k) | [GM IR Q2 2026 letter](https://generalmotorscompany.gcs-web.com/news-releases/news-release-details/q2-2026-letter-shareholders) (403) | Recurring-revenue tile, L5 |
| GM Q1/Q2 2026 10-Q accrual text | That the $0.5B accrual wording is verbatim (it came from search excerpts) | [GM 10-Q Q2 2026](https://www.sec.gov/Archives/edgar/data/1467858/000146785826000051/gm-20260630.htm) | L6 replacement figure |
| Qualcomm and Tesla primary releases | The $1.59B "record" wording in Qualcomm's release body; the 1.48M figure and the purchase/subscription split in Tesla's Q2 2026 Update | [Qualcomm Q3 FY26](https://www.qualcomm.com/news/releases/2026/07/qualcomm-announces-third-quarter-fiscal-2026-results) | L1, L3 |
| ISO/SAE 21434 | The 42 work-product count against the standard, and whether a revised edition has been published | [ISO](https://www.iso.org/standard/70918.html) (paywalled) | L7 `pain[2]` |
| China GB 44495 Amendment XG1-2026 and India AIS-189/190 | China's existing-type deadline (2027 or 2028) and the amendment's dates; whether India has gazetted final rules since the June 2026 draft | [Code of China](https://www.codeofchina.com/standard/GB44495-2024.html); [Autocar Pro](https://www.autocarpro.in/news/india-drafts-mandatory-cybersecurity-software-update-rules-for-connected-and-autonomous-vehicles-133260) | L7 `moats[1]` replacement wording |
| Pending deals | Whether the Harman–ZF ADAS deal has closed; whether Applied Intuition's ~$30B round has closed; Motive's IPO status | [Tech Startups, 13 Oct 2026](https://techstartups.com/2026/10/13/applied-intuition-receives-investment-offers-at-30-billion-valuation-doubling-its-15-billion-valuation/) | L8 valuation; Tier 1 and specialist captions |
| Upcoming releases | Tesla Q3 2026 and GM Q3 2026 (late Oct); Qualcomm fiscal Q4 2026 (early Nov, guided ~+60% auto); Samsara Q3 FY27 (early Dec); BizzyCar Q3 2026 (mid-Oct) | Company IR pages | Refresh L1, L3, L5 and the OnStar figures if the deck is shown after these dates |
| Minor primaries not fetched | VW Annual Report 2023 (Cariad); a Ford statement on FNV4; whether Nissan currently ships AAOS | n/a | Low risk; secondary sources agree |

## Conclusion

The deck's errors share a pattern: true numbers with their conditions stripped off. "Eligible for OTA" turned into "fixed OTA", "users" turned into "subscriptions", "a target of 13M" turned into "13M subscribers", "a top challenge" turned into "the top challenge", "draft" stayed in place after the rules came into force, and a 2023 forecast reads as an outcome. Each one is a small step, but every step makes the SDV case look stronger than its sources do. A sceptical evaluator who catches two of them will start doubting the rest. Restoring the conditions costs a few words per claim and leaves the four whitespace candidates fully intact.

Two fixes go further than accuracy. The data partly undercuts the zonal-migration candidate's "90%+" premise: only about a third of OEMs expect body-zonal to be their main production architecture by 2030. That argues for pitching zonal migration as a long transition with many years of mixed fleets, which is arguably a better market for a legacy-ECU porting service than a finished switchover. And once the 52% VP figure is properly credited, the V&V candidate rests on a vendor survey with no published sample size. The team should back it with its own SME interviews, as the deck's next-steps slide already plans, rather than lean on that statistic.
