# Definition Box Templates

These templates provide consistent formatting for key term definitions throughout the book.

## Basic Definition Box

```markdown
{% hint style="info" %}
**[Term Name]**: [Clear, concise definition]
{% endhint %}
```

## Extended Definition Box

```markdown
{% hint style="info" %}
**[Term Name]**: [Primary definition]

**Key Points:**
- [Important aspect 1]
- [Important aspect 2]
- [Important aspect 3]

**Example**: [Brief example or use case]
{% endhint %}
```

## Warning Definition Box

```markdown
{% hint style="warning" %}
**[Term Name]**: [Definition with important caveats]

**⚠️ Important**: [Critical information or common misconception to avoid]
{% endhint %}
```

## Success/Best Practice Definition Box

```markdown
{% hint style="success" %}
**[Term Name]**: [Definition]

**✅ Best Practice**: [Recommended approach or usage]
{% endhint %}
```

## Technical Definition Box

```markdown
{% hint style="info" %}
**[Technical Term]**: [Technical definition]

**Technical Details:**
- **Protocol**: [If applicable]
- **Port**: [If applicable]
- **RFC**: [If applicable]
- **Implementation**: [Brief implementation note]

**Common Use Cases**: [Where this is typically used]
{% endhint %}
```

## Comparison Definition Box

```markdown
{% hint style="info" %}
**[Term A] vs [Term B]**

**[Term A]**: [Definition and key characteristics]
**[Term B]**: [Definition and key characteristics]

**Key Differences:**
| Aspect | [Term A] | [Term B] |
|--------|----------|----------|
| [Aspect 1] | [Value A] | [Value B] |
| [Aspect 2] | [Value A] | [Value B] |
| [Aspect 3] | [Value A] | [Value B] |
{% endhint %}
```

## Formula/Calculation Definition Box

```markdown
{% hint style="info" %}
**[Formula Name]**: [What it calculates]

**Formula**: `[Mathematical formula]`

**Where:**
- [Variable 1] = [Description]
- [Variable 2] = [Description]
- [Variable 3] = [Description]

**Example**: [Worked example with numbers]
{% endhint %}
```