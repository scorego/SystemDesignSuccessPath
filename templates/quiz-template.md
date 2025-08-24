# Quiz Templates

These templates provide consistent formatting for interactive quizzes throughout the book.

## Multiple Choice Quiz Template

```markdown
### Knowledge Check: [Topic Name]

{% hint style="question" %}
**Question 1**: [Question text]

A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]

<details>
<summary>Click to reveal answer</summary>

**Correct Answer**: [Letter] - [Correct option text]

**Explanation**: [Detailed explanation of why this is correct and why other options are incorrect]

**Key Concept**: [The main concept this question tests]
</details>
{% endhint %}
```

## True/False Quiz Template

```markdown
### Quick Check: [Topic Name]

{% hint style="question" %}
**Statement**: [True or false statement]

- [ ] True
- [ ] False

<details>
<summary>Click to reveal answer</summary>

**Correct Answer**: [True/False]

**Explanation**: [Explanation of why the statement is true or false, with supporting details]

**Related Concept**: [Link to related concept or chapter]
</details>
{% endhint %}
```

## Multi-Select Quiz Template

```markdown
### Comprehensive Check: [Topic Name]

{% hint style="question" %}
**Question**: [Question asking to select all correct options]

Select all that apply:
- [ ] [Option 1]
- [ ] [Option 2]
- [ ] [Option 3]
- [ ] [Option 4]
- [ ] [Option 5]

<details>
<summary>Click to reveal answer</summary>

**Correct Answers**: [List of correct options]

**Explanation**:
- ✅ **[Correct Option 1]**: [Why this is correct]
- ✅ **[Correct Option 2]**: [Why this is correct]
- ❌ **[Incorrect Option 1]**: [Why this is incorrect]
- ❌ **[Incorrect Option 2]**: [Why this is incorrect]

**Key Takeaway**: [Main learning point from this question]
</details>
{% endhint %}
```

## Scenario-Based Quiz Template

```markdown
### Scenario Analysis: [Scenario Topic]

{% hint style="question" %}
**Scenario**: [Detailed scenario description]

**Question**: [Question about the scenario]

A) [Option A with reasoning]
B) [Option B with reasoning]
C) [Option C with reasoning]
D) [Option D with reasoning]

<details>
<summary>Click to reveal answer</summary>

**Correct Answer**: [Letter] - [Correct option]

**Analysis**:
- **Why this is correct**: [Detailed explanation]
- **Why other options are wrong**:
  - [Option A]: [Why wrong]
  - [Option B]: [Why wrong]
  - [Option C]: [Why wrong]

**Real-World Application**: [How this applies in practice]

**Further Reading**: [Link to related section or external resource]
</details>
{% endhint %}
```

## Fill-in-the-Blank Quiz Template

```markdown
### Concept Completion: [Topic Name]

{% hint style="question" %}
**Complete the statement**: 

[Text with blanks] _______ [more text] _______ [final text].

**Word Bank**: [word1, word2, word3, word4]

<details>
<summary>Click to reveal answer</summary>

**Complete Statement**: [Full statement with correct words filled in]

**Explanation**: [Why these words are correct and how they relate to the concept]

**Memory Tip**: [Helpful way to remember this concept]
</details>
{% endhint %}
```

## Calculation Quiz Template

```markdown
### Capacity Estimation Practice: [Calculation Type]

{% hint style="question" %}
**Problem**: [Calculation problem description]

**Given**:
- [Parameter 1]: [Value]
- [Parameter 2]: [Value]
- [Parameter 3]: [Value]

**Calculate**: [What needs to be calculated]

<details>
<summary>Click to reveal solution</summary>

**Solution**:

**Step 1**: [First calculation step]
```
[Calculation with numbers]
```

**Step 2**: [Second calculation step]
```
[Calculation with numbers]
```

**Final Answer**: [Result with units]

**Key Formula**: `[Formula used]`

**Practical Insight**: [What this calculation tells us in real-world terms]
</details>
{% endhint %}
```

## Progressive Quiz Series Template

```markdown
### Progressive Learning: [Topic Series]

#### Level 1: Basic Understanding
{% hint style="question" %}
[Basic question about the concept]

<details>
<summary>Answer</summary>
[Basic answer and explanation]
</details>
{% endhint %}

#### Level 2: Application
{% hint style="question" %}
[Question requiring application of the concept]

<details>
<summary>Answer</summary>
[More detailed answer showing application]
</details>
{% endhint %}

#### Level 3: Analysis
{% hint style="question" %}
[Question requiring analysis and comparison]

<details>
<summary>Answer</summary>
[Complex answer with trade-offs and considerations]
</details>
{% endhint %}

#### Level 4: Synthesis
{% hint style="question" %}
[Question requiring combining multiple concepts]

<details>
<summary>Answer</summary>
[Comprehensive answer showing mastery]
</details>
{% endhint %}
```

## Chapter Review Quiz Template

```markdown
## Chapter [X] Review Quiz

Test your understanding of [Chapter Topic].

### Question 1: [Subtopic 1]
{% hint style="question" %}
[Question about first major concept]

[Multiple choice options]

<details>
<summary>Answer & Explanation</summary>
[Answer with detailed explanation]
</details>
{% endhint %}

### Question 2: [Subtopic 2]
{% hint style="question" %}
[Question about second major concept]

[Question format]

<details>
<summary>Answer & Explanation</summary>
[Answer with detailed explanation]
</details>
{% endhint %}

### Question 3: [Integration Question]
{% hint style="question" %}
[Question that combines multiple concepts from the chapter]

[Question format]

<details>
<summary>Answer & Explanation</summary>
[Comprehensive answer showing how concepts connect]
</details>
{% endhint %}

### Reflection Questions
1. [Open-ended question for deeper thinking]
2. [Question connecting to previous chapters]
3. [Question about real-world applications]

### Next Steps
Based on your performance:
- **If you got 0-1 correct**: [Recommendation to review specific sections]
- **If you got 2-3 correct**: [Recommendation for additional practice]
- **If you got all correct**: [Recommendation to move forward or explore advanced topics]
```