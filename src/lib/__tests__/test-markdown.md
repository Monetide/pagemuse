# Project Documentation

This is a comprehensive **Markdown** document that demonstrates all the parsing capabilities of our *enhanced* ingest system.

## Introduction

Welcome to our `markdown parsing` system! This document contains various elements that should be correctly parsed into IR format.

### Features Overview

Our system supports:

- **Bold text** and *italic text*
- [Links to external sites](https://example.com)
- `inline code` and code blocks
- Tables with proper headers
- Images with captions
- Callouts and admonitions

## Code Examples

Here's a JavaScript code block:

```javascript
function parseMarkdown(text) {
  const lines = text.split('\n');
  return lines.map(line => procesLine(line));
}
```

And here's some Python:

```python
def process_document(content):
    """Process document content into IR format"""
    return {
        'title': extract_title(content),
        'blocks': parse_blocks(content)
    }
```

## Data Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Headings | ✅ Complete | High |
| Lists | ✅ Complete | High |
| Tables | 🔄 In Progress | Medium |
| Images | ⏳ Planned | Low |

### Financial Data

| Quarter | Revenue | Growth |
|---------|---------|--------|
| Q1 2024 | $12.5M | 15% |
| Q2 2024 | $14.2M | 18% |
| Q3 2024 | $16.1M | 22% |
| Q4 2024 | $18.3M | 25% |

## Images and Figures

Here's our company logo:

![Company Logo](https://example.com/logo.png "Our beautiful company logo")

And here's a chart showing our growth:

![Growth Chart](./assets/growth-chart.svg "Revenue growth over the past 4 quarters")

## Lists and Organization

### Unordered Lists

- Project planning
- Development phase
  - Frontend development
  - Backend development  
  - Database design
- Testing and QA
- Deployment

### Ordered Lists

1. **Analysis**: Understand requirements
2. **Design**: Create system architecture
3. **Implementation**: Build the solution
4. **Testing**: Verify functionality
5. **Deployment**: Release to production

### Task Lists

- [x] Set up development environment
- [x] Create project structure
- [ ] Implement core features
- [ ] Write comprehensive tests
- [ ] Deploy to staging

## Quotes and Citations

> The best way to predict the future is to create it.
> -- Peter Drucker

> Innovation distinguishes between a leader and a follower.

## Callouts and Admonitions

> **Note:** This is an informational callout that provides additional context to readers.

> **Warning:** Be careful when modifying configuration files as incorrect changes can break the system.

> **Error:** This represents a critical issue that must be addressed immediately.

> **Success:** The operation completed successfully and all tests are passing.

> **Tip:** Use keyboard shortcuts to improve your productivity when working with the editor.

## Horizontal Rules

Content above this line.

---

Content below this line.

***

Another section separator.

## Advanced Formatting

Here's some text with **bold**, *italic*, and ***bold italic*** formatting.

You can also use `inline code` within sentences, and create [links with titles](https://example.com "This is a link title").

### Strikethrough and Underline

~~This text is struck through~~

## Mathematical Expressions

While not fully supported yet, here's how math might look:
`E = mc²`

## Conclusion

This document demonstrates the comprehensive parsing capabilities of our Markdown ingest system, including:

1. Six levels of headings
2. Various text formatting options
3. Different types of lists
4. Tables with headers and alignment
5. Images with alt text and captions
6. Code blocks with syntax highlighting
7. Blockquotes and callouts
8. Horizontal rules for section breaks

The system should convert all these elements into proper IR format, which can then be mapped to PageMuse documents for rendering and editing.

---

*Document last updated: December 2024*