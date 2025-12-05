# Technical Debt Management and Reduction Strategies

## 1. Technical Debt Identification and Analysis
Starting from **Sprint 3**, the team integrated **SonarQube** into the workflow. This is a popular Automatic Static Analysis tool designed to identify technical debt in the code .

The analysis highlighted multiple critical issues across the three main categories monitored by the tool :
* **Security (Vulnerabilities/Hotspots):** Issues related to system security and potential breaches.
* **Maintainability (Code Smells):** Violations of good practices that make code difficult to maintain (e.g., *God Class*, *Duplicated Code*) .
* **Reliability (Bugs):** Defects that impact the software's stability and reliability .

Adopting this tool allows us to manage technical debt explicitly rather than implicitly, leading to better planning and lower future maintenance costs .

## 2. Quality Objectives (Quality Gates)
The primary goal established by the team is to achieve and maintain at least a **Grade B** rating across all analysis sections (Security, Reliability, Maintainability).

Specifically, we have placed the highest focus on **Security**. Acknowledging the professional responsibility to take special care of systems , we are committed to resolving detected vulnerabilities and security hotspots with absolute priority.

## 3. Repayment Strategy (Sprint Planning)
To reduce accumulated debt (repaying the "principal" of the technical loan) , we adopted a targeted intervention strategy distributed over the current and future sprints:

* **Sprint 3 (Immediate Prioritization):** At the beginning of the sprint, we prioritized resolving existing critical issues. We applied a prioritization logic, focusing on items with high impact (severity) and high interest (the cost of not fixing them) .
* **Sprint 4 (Clean Code Delivery):** To avoid accruing new debt by shipping code that is "not quite right" , we have planned specific correction and refactoring tasks at the end of the sprint. This ensures the delivery of the cleanest possible product increment.

## 4. Improving Test Coverage
A significant aspect of the identified technical debt is **Testing Debt** (e.g., missing test cases or lack of automation) . To bridge the gap between the current code and "perfect" code (which implies high test coverage) , we are expanding our testing strategy:

* **Manual Testing:** Continuing manual tests for UI validation.
* **E2E Testing (Cypress):** Introducing **Cypress** for automated End-to-End testing. The goal is to automate critical scenarios to reduce the risk of regressions and mitigate the high long-term interest costs associated with manual maintenance and undetected defects .