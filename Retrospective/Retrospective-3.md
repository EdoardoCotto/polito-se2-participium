RETROSPECTIVE 3 (Team 3)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed 3 vs done 3
- Total points committed 23 vs done 23
- Nr of hours planned 99h vs spent 103h 

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing 455
- Code review completed 3
- Code present on VCS
- End-to-End tests performed 22

> Please refine your DoD 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _#0_   |   18    |    -   |     57     |      57,5    |
|   24   |    9    |    5   |    12,5    |      14      |
|   25   |    9    |    5   |    11,5    |      13      |
|   26   |   10    |    13  |    18      |      18,5    |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 2,15 | 1,799 | 
| Actual     | 2,24 | 1,805 |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1 = 0,0404

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated 4,5
  - Total hours spent 5,5
  - Nr of automated unit test cases  455
  - Coverage (if available) 98,3%
- Integration testing:
  - Total hours estimated
  - Total hours spent
- E2E testing:
  - Total hours estimated 7
  - Total hours spent 6,5
- Code review: 
  - Total hours estimated 3
  - Total hours spent 3
- Technical Debt management:
  - Strategy adopted: we decide to obtain at least grade B across all analysis sections and focus on items with high impact.
  - Total hours estimated at sprint planning 27,5h
  - Total hours spent 28h
  


## ASSESSMENT

- What caused your errors in estimation (if any)?
  Our estimation error was very low this sprint (4%), which means our planning process is working very well. We planned 99 hours and spent 103 hours.
  The minor error: The small difference (4 hours total) came mostly from Story 24 and Story 25. In these stories, we encountered some small implementation details we did not expect.
  Why we were successful: The main reason our estimation was accurate is that we kept our tasks small. Our average task duration was 2.2 hours. When tasks are this small, it is much easier to predict how long they will take compared to large tasks of 8 or 10 hours.

- What lessons did you learn (both positive and negative) in this sprint?
  Positive (Quality Strategy): We learned that investing heavily in Story #0 (Technical Infrastructure and Refactoring) pays off in stability. We spent 57.5 hours on this, which allowed us to reach 98.3% code coverage and pass 22 End-to-End tests. This confirms that high quality requires dedicated time.

  Negative (Velocity Trade-off): We learned that there is a trade-off between "Technical Tasks" and "User Stories." Because we spent more than 50% of our time on Story #0, we could only complete 23 Story Points of new features (compared to 51 points in the previous sprint). We learned we need to balance this better so the customer sees more new features.

- Which improvement goals set in the previous retrospective were you able to achieve? 
  "Better task time estimation": We successfully achieved this goal. In Retrospective 2, we promised to discuss tasks more deeply to find hidden details. We did this, and the result is that our estimation error is now only 4%.

  "Better time management / Coordination": We improved our coordination between Backend and Frontend. The proof is that we successfully passed 22 End-to-End tests. In the previous sprint, we had issues with tasks depending on each other, but this time we managed the flow better.
  
- Which ones you were not able to achieve? Why?
  While we improved our process, we were not able to maintain a high velocity (number of completed Story Points). We dropped from 51 points (Sprint 2) to 23 points (Sprint 3).

  Why? This happened because we underestimated how much effort the technical maintenance (Story #0) would require. We let the technical tasks take up too much of the sprint capacity, leaving less time for the actual user stories.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  Goal: Balance Technical Debt vs. New Features.

  How: In the next Sprint Planning, we will set a strict limit on Story #0. We will try to allocate maximum 30% of our hours to technical tasks and 70% to User Stories. This will help us deliver more value to the stakeholders.

  Goal: Maintain Granular Breakdown.

  How: We want to keep our estimation accuracy high. We will continue the rule of breaking down tasks until they are smaller than 4 hours. If a task is bigger, we must split it during the planning meeting.

> Propose one or two

- One thing you are proud of as a Team!!
  We are proud of our reliability. In this sprint, we proved that we can deliver exactly what we promise. We combined high-quality engineering (98% test coverage) with precise planning (only 4% estimation error), showing that we have successfully overcome the coordination struggles of the previous sprint.