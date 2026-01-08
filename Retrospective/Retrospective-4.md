RETROSPECTIVE 4 (Team 3)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed 7 vs done 7
- Total points committed 58 vs done 58
- Nr of hours planned 96h vs spent 100h 30m 

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing 722
- Code review completed 7
- Code present on VCS
- End-to-End tests performed 56

> Please refine your DoD 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _#0_   |    3    |    -   |     14     |      14      |
|   28   |    6    |    3   |      7     |       8      |
|   27   |    7    |   13   |     10     |      10      |
|   30   |    8    |   13   |    12,5    |      14,5    |
|  10bis |    8    |    5   |     9,5    |      10,5    |
|   11   |   10    |   13   |    15,5    |      16      |
|   12   |    8    |   13   |    19,5    |      19,5    |
|   13   |    8    |    5   |      8     |       8      |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 1,65 |  1,47 | 
| Actual     | 1,73 |  1,50 |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1 = 0,047

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated 8,5
  - Total hours spent 8,5
  - Nr of automated unit test cases  722
  - Coverage (if available) 87,8%
- Integration testing:
  - Total hours estimated
  - Total hours spent
- E2E testing:
  - Total hours estimated 6,5
  - Total hours spent 6,5
- Code review: 
  - Total hours estimated 7,5
  - Total hours spent 8,5
- Technical Debt management:
  - Strategy adopted: we decide to obtain at least grade B across all analysis sections and focus on items with high impact.
  - Total hours estimated at sprint planning 10 h
  - Total hours spent 10 h
  
  ![Graph](image2.png)

## ASSESSMENT

- What caused your errors in estimation (if any)?
  
  Our estimation error was very low this sprint (around 4%). This minor discrepancy was mainly due to a misunderstanding of the effort required for User Story 10bis as you can see in the low number of history points we gave to it. Initially, we planned only to allow admins to change technical officer roles; however, during the sprint, we realized technical users needed to support multiple roles, which led to a significant backend refactor.

- What lessons did you learn (both positive and negative) in this sprint?

  Positive: We learned how to do a good role division: in this way it was more difficult to have cases where one person had to wait 

  Negative (Velocity Trade-off): We learned that there is a trade-off between "Technical Tasks" and "User Stories." Because we spent more than 50% of our time on SonarQube, we could only complete 23 Story Points of new features (compared to 51 points in the previous sprint). We learned we need to balance this better so the customer sees more new features.

- Which improvement goals set in the previous retrospective were you able to achieve? 

  "Better task time estimation": We successfully achieved this goal. In Retrospective 2, we promised to discuss tasks more deeply to find hidden details. We did this, and the result is that our estimation error is now only 4%.

  "Better time management / Coordination": We improved our coordination between Backend and Frontend. The proof is that we successfully passed 22 End-to-End tests. In the previous sprint, we had issues with tasks depending on each other, but this time we managed the flow better.
  
- Which ones you were not able to achieve? Why?

  We actually achieved the main goals we set in the previous retrospective (Estimation and Coordination).
  However, one area we are still perfecting is the optimization of technical tasks. We spent a lot of effort on infrastructure to ensure high quality. While this was necessary, we want to find a way to do these technical tasks faster in the future so we can spend even more time on user features.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  Goal: Balance Technical Debt vs. New Features.

  How: In the next Sprint Planning, we will set a strict limit on SonarQube. We will try to allocate maximum 30% of our hours to technical tasks and 70% to User Stories. This will help us deliver more value to the stakeholders.

  Goal: Maintain Granular Breakdown.

  How: We want to keep our estimation accuracy high. We will continue the rule of breaking down tasks until they are smaller than 4 hours. If a task is bigger, we must split it during the planning meeting.



- One thing you are proud of as a Team!!

  We are proud of our reliability. In this sprint, we proved that we can deliver exactly what we promise. We combined high-quality engineering (98% test coverage) with precise planning (only 4% estimation error), showing that we have successfully overcome the coordination struggles of the previous sprint.