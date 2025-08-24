# Exercise Templates

These templates provide consistent formatting for hands-on exercises throughout the book.

## Basic Exercise Template

```markdown
## Exercise: [Exercise Name]

### Objective
[Clear statement of what the student will accomplish]

### Prerequisites
- [Prerequisite concept 1]
- [Prerequisite concept 2]
- [Prerequisite concept 3]

### Scenario
[Detailed scenario or context for the exercise]

### Your Task
[Specific instructions for what to do]

### Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

### Hints
<details>
<summary>💡 Hint 1</summary>
[First hint to guide thinking]
</details>

<details>
<summary>💡 Hint 2</summary>
[Second hint with more specific guidance]
</details>

<details>
<summary>💡 Hint 3</summary>
[Third hint with implementation details]
</details>

### Solution
<details>
<summary>🔍 Click to view solution</summary>

#### Approach
[Explanation of the approach taken]

#### Implementation
[Detailed solution with code/diagrams as needed]

#### Explanation
[Step-by-step explanation of the solution]

#### Alternative Solutions
[Other valid approaches and their trade-offs]
</details>

### Reflection Questions
1. [Question about the approach taken]
2. [Question about trade-offs]
3. [Question about scaling considerations]

### Extension Challenges
- [Additional challenge 1]
- [Additional challenge 2]
- [Additional challenge 3]
```

## Design Exercise Template

```markdown
## Design Exercise: [System Name]

### Problem Statement
[Clear description of the system to design]

### Business Requirements
- [Business requirement 1]
- [Business requirement 2]
- [Business requirement 3]

### Technical Constraints
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

### Scale Requirements
- [Scale requirement 1]
- [Scale requirement 2]
- [Scale requirement 3]

### Your Design Task
Design a system that meets the above requirements. Your design should include:

1. **High-level architecture diagram**
2. **Component breakdown**
3. **Data flow description**
4. **Technology choices with justification**
5. **Scaling strategy**

### Guided Steps

#### Step 1: Requirements Analysis
<details>
<summary>💡 Guidance</summary>
[Guidance on how to analyze and clarify requirements]
</details>

#### Step 2: Capacity Estimation
<details>
<summary>💡 Guidance</summary>
[Guidance on capacity planning and calculations]
</details>

#### Step 3: High-Level Design
<details>
<summary>💡 Guidance</summary>
[Guidance on creating the overall architecture]
</details>

#### Step 4: Detailed Design
<details>
<summary>💡 Guidance</summary>
[Guidance on component-level design]
</details>

#### Step 5: Scaling Considerations
<details>
<summary>💡 Guidance</summary>
[Guidance on identifying and addressing bottlenecks]
</details>

### Sample Solution
<details>
<summary>🔍 View sample solution</summary>

#### Architecture Overview
[High-level architecture description]

```mermaid
[Architecture diagram]
```

#### Component Details
[Detailed breakdown of each component]

#### Technology Choices
[Justification for technology selections]

#### Scaling Strategy
[How the system scales and handles growth]

#### Trade-offs and Alternatives
[Discussion of design decisions and alternatives]
</details>

### Evaluation Criteria
Rate your solution on:
- [ ] **Completeness**: Does it address all requirements?
- [ ] **Scalability**: Can it handle the required scale?
- [ ] **Reliability**: Is it fault-tolerant?
- [ ] **Performance**: Does it meet performance requirements?
- [ ] **Cost-effectiveness**: Is it economically viable?

### Follow-up Questions
1. How would your design change if [scenario change]?
2. What would be the first bottleneck as the system scales?
3. How would you monitor this system in production?
```

## Coding Exercise Template

```markdown
## Coding Exercise: [Algorithm/Implementation Name]

### Problem Description
[Clear description of the coding problem]

### Input/Output Specification
**Input**: [Description of input format and constraints]
**Output**: [Description of expected output format]

### Examples

#### Example 1
```
Input: [sample input]
Output: [expected output]
Explanation: [why this output is correct]
```

#### Example 2
```
Input: [sample input]
Output: [expected output]
Explanation: [why this output is correct]
```

### Constraints
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

### Approach Hints
<details>
<summary>💡 Hint 1: Algorithm Choice</summary>
[Hint about which algorithm or data structure to consider]
</details>

<details>
<summary>💡 Hint 2: Implementation Strategy</summary>
[Hint about implementation approach]
</details>

<details>
<summary>💡 Hint 3: Edge Cases</summary>
[Hint about important edge cases to consider]
</details>

### Solution Template
```python
def solution_function(input_params):
    """
    Your implementation here
    """
    pass

# Test cases
test_cases = [
    # Add your test cases here
]

for i, (input_data, expected) in enumerate(test_cases):
    result = solution_function(input_data)
    print(f"Test {i+1}: {'PASS' if result == expected else 'FAIL'}")
```

### Complete Solution
<details>
<summary>🔍 View complete solution</summary>

#### Approach
[Explanation of the algorithmic approach]

#### Implementation
```python
[Complete implementation with comments]
```

#### Complexity Analysis
- **Time Complexity**: O([complexity]) - [explanation]
- **Space Complexity**: O([complexity]) - [explanation]

#### Key Insights
- [Insight 1]
- [Insight 2]
- [Insight 3]

#### Alternative Approaches
[Discussion of other possible solutions and their trade-offs]
</details>

### Test Your Understanding
1. What happens if [edge case scenario]?
2. How would you optimize this for [specific constraint]?
3. What would change if [requirement modification]?
```

## Analysis Exercise Template

```markdown
## Analysis Exercise: [Topic Name]

### Scenario
[Detailed scenario to analyze]

### Data Provided
[Any data, metrics, or information given for analysis]

### Analysis Tasks
1. **[Analysis Task 1]**: [Specific question or task]
2. **[Analysis Task 2]**: [Specific question or task]
3. **[Analysis Task 3]**: [Specific question or task]

### Analytical Framework
Use this framework to structure your analysis:

#### 1. Problem Identification
- What are the key issues?
- What are the symptoms vs root causes?

#### 2. Data Analysis
- What does the data tell us?
- What patterns or trends are evident?

#### 3. Options Evaluation
- What are the possible solutions?
- What are the pros and cons of each?

#### 4. Recommendation
- What is your recommended approach?
- Why is this the best option?

### Guided Analysis
<details>
<summary>💡 Analysis Framework</summary>
[Guidance on how to approach the analysis systematically]
</details>

<details>
<summary>💡 Key Metrics to Consider</summary>
[Important metrics and what they indicate]
</details>

<details>
<summary>💡 Common Pitfalls</summary>
[Common mistakes in this type of analysis]
</details>

### Sample Analysis
<details>
<summary>🔍 View sample analysis</summary>

#### Problem Assessment
[Sample problem identification and framing]

#### Data Interpretation
[Sample data analysis with insights]

#### Solution Evaluation
[Sample evaluation of different options]

#### Final Recommendation
[Sample recommendation with justification]

#### Implementation Considerations
[Sample discussion of implementation challenges]
</details>

### Reflection
- What was the most challenging part of this analysis?
- What additional information would have been helpful?
- How confident are you in your recommendation?
```

## Troubleshooting Exercise Template

```markdown
## Troubleshooting Exercise: [System/Issue Name]

### Situation
[Description of the problem scenario]

### Symptoms Observed
- [Symptom 1]
- [Symptom 2]
- [Symptom 3]

### System Information
- [Relevant system details]
- [Configuration information]
- [Recent changes]

### Available Tools/Data
- [Monitoring data available]
- [Logs available]
- [Diagnostic tools available]

### Your Mission
Identify the root cause and propose a solution.

### Troubleshooting Process

#### Step 1: Hypothesis Formation
<details>
<summary>💡 Guidance</summary>
[How to form initial hypotheses based on symptoms]
</details>

**Your hypotheses**:
1. [Your hypothesis 1]
2. [Your hypothesis 2]
3. [Your hypothesis 3]

#### Step 2: Investigation
<details>
<summary>💡 Guidance</summary>
[How to systematically investigate each hypothesis]
</details>

**Investigation steps**:
- [Investigation step 1]
- [Investigation step 2]
- [Investigation step 3]

#### Step 3: Root Cause Analysis
<details>
<summary>💡 Guidance</summary>
[How to identify the true root cause]
</details>

**Root cause**: [Your identified root cause]

#### Step 4: Solution Design
<details>
<summary>💡 Guidance</summary>
[How to design an effective solution]
</details>

**Proposed solution**: [Your solution]

### Expert Analysis
<details>
<summary>🔍 View expert troubleshooting approach</summary>

#### Systematic Investigation
[Step-by-step investigation process]

#### Root Cause Identification
[How the root cause was identified]

#### Solution Implementation
[Detailed solution with implementation steps]

#### Prevention Measures
[How to prevent this issue in the future]

#### Lessons Learned
[Key takeaways from this troubleshooting exercise]
</details>

### Follow-up Questions
1. What monitoring would have helped detect this earlier?
2. How would you prevent this issue in the future?
3. What would you do if the proposed solution didn't work?
```