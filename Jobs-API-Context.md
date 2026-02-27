# Jobs / Vacancy API – Context for Swipy

This file holds documentation references and context for implementing the Job Scanner / Job Search feature using real job and vacancy APIs.

---

## Adzuna API (jobs & vacancies)

Adzuna provides a RESTful API for job ads and employment data. Use it to replace mock data on the job search page and power real listings.

### Documentation links

| Resource | URL |
|----------|-----|
| **Interactive endpoint documentation** (test calls, endpoints, parameters, response codes) | [https://developer.adzuna.com/activedocs#/](https://developer.adzuna.com/activedocs#/) |
| **Overview** (quickstart, API structure, querying, encoding, errors) | [https://developer.adzuna.com/overview](https://developer.adzuna.com/overview) |
| **Search ads** (job search endpoint, examples, response shape) | [https://developer.adzuna.com/docs/search](https://developer.adzuna.com/docs/search) |

### Quick reference (from Adzuna overview)

- **Register** for an **app_id** and **app_key** at [Adzuna developer](https://developer.adzuna.com).
- **Root URL:** `https://api.adzuna.com/v1/api`
- **Example – job search (UK), page 1:**  
  `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id={YOUR_APP_ID}&app_key={YOUR_APP_KEY}`
- **Required parameters:** Every request needs `app_id` and `app_key`.
- **Response format:** Use `Accept: application/json` for JSON (UTF-8).
- **Sections:** Get ads (search), employment data (salaries, vacancies, regional, top companies), categories, version.

Use the **Interactive Endpoint Documentation** for exact search parameters (e.g. keyword, location, salary) and response shape when wiring the job search page and "View Website" links.

### Search endpoint (from [Search ads](https://developer.adzuna.com/docs/search))

- **Purpose:** Retrieve job advertisement listings.
- **Simple query:** `GET .../jobs/gb/search/1?app_id=...&app_key=...&results_per_page=20&what=javascript%20developer&content-type=application/json`
- **Parameters:** `what` (keyword), `where` (location), `results_per_page`, `salary_min`, `full_time`, `permanent`, `what_exclude`, `sort_by`, etc. Full list in the Interactive Endpoint Documentation.
- **Response:** JSON with `results` array; each job has `id`, `title`, `company.display_name`, `location.display_name`, `description` (snippet), `salary_min` / `salary_max`, `redirect_url` (use for "View Website"), `contract_type`, `contract_time`, `category`, `created`.
- **Note:** Only a snippet of the job description is provided in the API response.

---

*Last updated for use with Swipy Job Scanner / vacancy feature.*
