<div align="center">

# Swipy

### Discover startups. Build connections. Find opportunities.

**A startup discovery and networking platform with swipe-based matching, direct messaging, and AI-assisted job search.**

[**Live Platform — swipy.space**](https://swipy.space/) · [**Founder on GitHub**](https://github.com/Iluxa-sensei)

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)

</div>

## About Swipy

Finding collaborators, promising startups, and early-stage opportunities shouldn't require jumping between disconnected platforms. **Swipy** brings discovery, networking, conversations, and job exploration into one product.

Users can browse startup profiles, express interest through a swipe-style interface, connect when interest is mutual, and continue conversations in-app. **Swipy Jobs** adds AI-assisted natural-language search and job-description summaries.

**[Explore the live product →](https://swipy.space/)**

## At a glance

| | |
| --- | --- |
| **250+** | Registered users |
| **25** | Countries represented among users |
| [**Top 30**](https://www.producthunt.com/products/swipy?launch=swipy) | Product Hunt ranking (among 400+ products, founder-reported) |
| [**#1 Product of the Day**](https://peerpush.com/p/swipy) | Peerpush (founder-reported) |

Figures reflect reported project milestones; they are not audited analytics.

## Core features

- **Startup discovery:** Explore startup profiles using a swipe-style interface and discovery filters.
- **Mutual matching:** Establish connections through reciprocal interest rather than unsolicited outreach.
- **In-app messaging:** Move from a match into direct conversation.
- **AI-assisted job search:** Describe a desired role in natural language and retrieve relevant live vacancies.
- **Job summaries:** Get concise AI-generated overviews of roles and their requirements.

## Engineering highlights

### AI-assisted jobs

Swipy Jobs combines an LLM with a live job-data service:

```mermaid
flowchart LR
    A[Natural-language job query] --> B[GPT-4o-mini interprets intent]
    B --> C[Structured search filters]
    C --> D[Adzuna vacancy search]
    D --> E[Job results]
    E --> F[AI-assisted job summary]
```

The system interprets conversational queries, maps them to structured job-search parameters, and retrieves vacancies through Adzuna. A separate summarization flow extracts available job-page information and uses GPT-4o-mini to produce readable summaries. The search implementation includes a keyword-based fallback when AI parsing is unavailable.

**Technical distinction:** AI is used for query interpretation and summarization. Startup matching is rule-based mutual-interest logic; this project does **not** claim a custom-trained LLM or an AI-powered startup recommendation engine.

**Relevant code:** [`api/ai-job-search.js`](api/ai-job-search.js) · [`api/job-summary.js`](api/job-summary.js)

### Product architecture

| Layer | Technologies / responsibility |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Authentication and data | Supabase |
| Startup discovery and messaging | Application logic and user-facing interfaces |
| AI integration | OpenAI GPT-4o-mini |
| Job listings | Adzuna API |
| Job-page extraction | ScrapingBee |
| Deployment | Vercel, including API routes |

The repository provides selected implementation details; the best way to assess the user experience is through the deployed product.

## Development and recognition

Swipy began as an independent startup-networking product and expanded into a broader platform for discovering teams and opportunities. It has attracted **250+ registered users across 25 countries**. Its launch reached **Top 30 on Product Hunt** and **#1 Product of the Day on Peerpush** (founder-reported rankings).

The team also held **preliminary discussions with Stripe representatives** about potential collaboration. These discussions did not result in a formal partnership; further engagement depended on implementing payment functionality.

## About this repository

This repository is shared to demonstrate the software engineering and product-development work behind Swipy. It is **not an installation tutorial or an invitation to redistribute the product**. Public visibility does not imply an open-source license. Please contact the maintainer about reuse or collaboration.

**Founder:** Iliyas Serikov
**Cofounder:** Abylaikhan Mukashev 
**Product:** [swipy.space](https://swipy.space/)  
