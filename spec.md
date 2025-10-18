## Specification: Interactive LLM-Enabled Desktop Interface

### Overview

The app is a JavaScript-based user interface that emulates a desktop environment. Users can create and interact with folders and text files visually. Files contain editable plain text intended as prompts. Users can send prompts from text files to a Large Language Model (LLM) via a custom right-click context menu. Responses from the LLM generate new text files automatically within the same folder.

### Key Features

#### Visual Desktop Interface
- Display icons representing files and folders.
- Icons are clickable, draggable, and visually distinct.
- Users can visually organize files and folders via drag-and-drop.

#### Folder & File Functionality
- **Folders:** Can contain multiple files and subfolders. Clickable to open visually.
- **Files:** Contain plain text prompts, editable through a simple inline editor or modal textarea.

#### Context Menu (Right-Click)
- Custom context menu triggered on right-click, containing:
  - **Send to LLM** (only visible for text files)
  - **Rename**
  - **Delete**
  - **Create New File** (when clicking desktop background or inside a folder)
  - **Create New Folder** (when clicking desktop background or inside a folder)

#### Interaction with LLM
- Selecting **Send to LLM** sends the file content (prompt) to an LLM via an API call.
- Responses from the LLM are received asynchronously.
- Each response generates a new text file, named by appending "_response" plus a timestamp or incremental suffix to the original filename (e.g., `prompt_response_20250306.txt`).

#### Persistent Storage (Optional)
- Files and folders persist using local browser storage (localStorage or IndexedDB).

### Technical Requirements
- **Front-End:** HTML, CSS, JavaScript (optionally React/Vue)
- **Back-End (Minimal):** API server (Node.js/Express or Next.js API Routes) to securely call the LLM provider (e.g., OpenAI). (Back-end is optional in the first version of the app)
- **LLM Provider:** External service such as OpenAI (GPT-3.5/4 or compatible).

### UI/UX Considerations
- Icons clearly distinguish between files and folders.
- Visual feedback for drag-and-drop and right-click interactions.
- Immediate creation and visual feedback when new files are generated from LLM responses.

### Future Enhancements (Optional)
- Multiple LLM selection options.
- Editing and saving file history.
- File search functionality.
- Multi-user collaboration capabilities.


