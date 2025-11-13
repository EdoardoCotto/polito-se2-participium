TEMPLATE FOR RETROSPECTIVE (Team 3)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed 5 vs. done 5
- Total points committed 27 vs. done 27
- Nr of hours planned 96 vs. spent 100 (as a team)

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _Uncategorized_  |    3    |      |   17,5         |      17,5        |
|   1   |    7     |    5    |      15,5      |       17       |  
|   2   |    6     |    3    |      15        |       12      |
|   3   |    7     |    3    |      14,5      |       14,5    |
|   4   |    11    |    13   |      22        |       22,5    |
|   5   |    8     |    3    |      11,5      |        16,5   |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 2.3  |       | 
| Actual     | 2.4  |       |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1=0.0417

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n = 0.000992

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated 4,5
  - Total hours spent 7
  - Nr of automated unit test cases 123
  - Coverage 98%
- E2E testing:
  - Total hours estimated 4,5
  - Total hours spent 2
  - Nr of test cases  4
- Code review 
  - Total hours estimated 6
  - Total hours spent 6
  


## ASSESSMENT

- What did go wrong in the sprint?
  
  We arrived a little late with the end of the stories

- What caused your errors in estimation (if any)?

  We don't estimate well the test beacuse we put it together

- What lessons did you learn (both positive and negative) in this sprint?

  We have to divide the test and scrum meeting, code review
  Good collaborations and no problem in merge branch bacuase we organized

- Which improvement goals set in the previous retrospective were you able to achieve? 

  Better task division and  we have a correspondence between story point and estimation hour that we don't have last time
  
- Which ones you were not able to achieve? Why?

  The division of task is improved but not perfect

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two
    - Better division of tasks
    - Better time management

- One thing you are proud of as a Team!!
  
    - Problem solving