# MCP AI Dev Tasks

A Model Context Protocol (MCP) server that helps AI assistants create Product Requirements Documents (PRDs) and generate structured task lists for software development projects.

> **Note**: This MCP is based on the excellent workflow and templates from [snarktank/ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks) repository. The original project provides a collection of markdown files designed to supercharge feature development workflow with AI-powered IDEs and CLIs. This MCP adapts those concepts into a structured MCP server for seamless integration with AI assistants.

## Key Benefit

The main point of this MCP tool is to **automate the manual prompting needed** when doing the PRD generation, tasks generation, and initial task execution steps. 

With this MCP, users can focus on describing the features needed and references, then follow the agent like an installation wizard! 🚀

## Overview

This MCP provides three main tools to streamline the software development workflow:

1. **`create-prd`** - Generates detailed Product Requirements Documents from feature descriptions
2. **`generate-tasks`** - Creates structured task lists from PRDs for implementation
3. **`process-task-list`** - Provides guidance for working through tasks systematically

## Installation

### 1. Add to MCP Configuration

Add this to your MCP configuration file (typically `~/.cursor/mcp.json` or similar):

```json
{
  "mcpServers": {
    "mcp-ai-dev-tasks": {
      "command": "npx",
      "args": ["@sean12mps/mcp-ai-dev-tasks@latest"]
    }
  }
}
```

### 2. Add Cursor Rules

Create or update your Cursor rules file (`.cursor/rules/ai-tasks.mdc`) with the following content:

```markdown
Use the mcp-ai-dev-tasks MCP.

Process:
1. Read the initial user prompt and references - then use the create-prd tool.
2. Use the response from create-prd tool as a user prompt.
3. The response will command you to create a series of questions for the user to clarify the task description for PRD.
4. After you've created the PRD file, verify user approval by asking them to proceed with generating tasks for it.
5. After user approval use the generate-tasks tool. Send the full content of the PRD file.
6. Use the response from generate-tasks tool as a user prompt.
7. The response will command you to generate tasks based on the PRD file with guided instructions. Follow the provided instructions.
8. The *first time* the user asked you to "start" or work on a particular task, use the process-task-list tool. Send the task pointer string. Example: 1.1 or 1.0 or 2.3.
9. The response will provide you with the instruction on how to move through the tasks.
10. Follow the instructions and do not call any of the tool again in the current chat thread.
```

## Usage

### Getting Started

To use this MCP, start your conversation with a prompt like this:

```
use @ai-tasks.mdc

Create feature: User authentication system with email/password login
- Users should be able to register with email and password
- Users should be able to login with their credentials
- Users should be able to reset their password via email
- Session management with JWT tokens

References:
- Existing auth patterns in the codebase
- Security requirements document
```

### How It Works

The MCP follows a structured workflow:

#### Phase 1: PRD Creation
1. **Initial Analysis**: The AI reads your feature description and references
2. **Clarifying Questions**: The AI asks targeted questions to understand requirements better
3. **PRD Generation**: Based on your responses, it creates a comprehensive Product Requirements Document
4. **File Creation**: Saves the PRD as `prd-[feature-name].md` in the `/tasks` directory

#### Phase 2: Task Generation
1. **PRD Review**: The AI analyzes the completed PRD
2. **High-Level Tasks**: Generates main parent tasks (typically 5-7 tasks)
3. **User Confirmation**: Waits for your "Go" approval
4. **Sub-Task Breakdown**: Creates detailed sub-tasks for each parent task
5. **File Mapping**: Identifies relevant files that will need to be created or modified

#### Phase 3: Task Execution
1. **Task Selection**: You specify which task to start (e.g., "1.1" or "2.3")
2. **Implementation**: The AI works on one sub-task at a time
3. **Progress Tracking**: Updates the task list as work is completed
4. **Testing & Commits**: Runs tests and commits changes following best practices

### Task Structure

Tasks are organized hierarchically:

```markdown
- [ ] 1.0 Setup Authentication Infrastructure
  - [ ] 1.1 Create user model and database schema
  - [ ] 1.2 Set up JWT token utilities
  - [ ] 1.3 Configure authentication middleware
- [ ] 2.0 Implement Registration Flow
  - [ ] 2.1 Create registration API endpoint
  - [ ] 2.2 Add email validation logic
  - [ ] 2.3 Implement password hashing
```

### Best Practices

- **One Task at a Time**: The AI works on one sub-task at a time and waits for your approval
- **File Tracking**: All created/modified files are tracked in the task list
- **Progress Updates**: The task list is updated in real-time as work progresses

## Features

### PRD Generation
- Structured document creation with clear sections
- Clarifying questions to ensure complete requirements
- Junior developer-friendly language and explanations
- Comprehensive coverage of functional requirements, user stories, and success metrics

### Task Management
- Hierarchical task organization (parent tasks → sub-tasks)
- Automatic file identification and tracking
- Built-in testing and commit workflows
- Progress tracking with checkboxes

### Development Workflow
- Systematic approach to feature implementation
- Clear separation of planning and execution phases
- Documentation of all changes and decisions

## Version

Current version: 1.0.3

## License

ISC

## Credits

This MCP is based on the workflow and templates from [snarktank/ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks) by [@snarktank](https://github.com/snarktank).

## Author

[@sean12mps](https://github.com/sean12mps) 