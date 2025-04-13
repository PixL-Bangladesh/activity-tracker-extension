# Detailed Overview of the ScreenTrail Browser Extension

This document provides a meticulous breakdown of the ScreenTrail browser extension, explaining each file's purpose and how they work together.

## Core Architecture

The extension is built as a browser extension using React, TypeScript, and Tailwind CSS. It uses rrweb for session recording and playback.

## Main Components and Files

### 1. Entry Points

#### `src/manifest.json`
- **Purpose**: Defines the extension's metadata, permissions, and entry points
- **Details**: Contains configurations for both Manifest V2 (older browsers) and V3 (modern browsers)
- **Key sections**:
  - Common settings (name, permissions, icons)
  - Background scripts configuration
  - Content scripts that run on web pages
  - Browser action/popup configuration

#### `src/background/index.ts`
- **Purpose**: Background script that runs persistently
- **Details**: Manages recording sessions, handles messages between content scripts and popup
- **Key responsibilities**:
  - Initializes recording when requested
  - Manages recording state (start, pause, resume, stop)
  - Communicates with content scripts via messaging

#### `src/content/index.ts` and `src/content/inject.ts`
- **Purpose**: Content scripts injected into web pages
- **Details**:
  - `index.ts`: Injects the recording script and handles communication with the background script
  - `inject.ts`: Contains the actual rrweb recording logic
- **Key responsibilities**:
  - Initializes rrweb recorder
  - Captures DOM events
  - Sends recorded events to background script

### 2. User Interface Components

#### `src/popup/App.tailwind.tsx`
- **Purpose**: Main popup UI when clicking the extension icon
- **Details**: Provides controls for recording sessions
- **Key features**:
  - Start/stop recording buttons
  - Pause/resume recording functionality
  - Timer display for recording duration
  - Navigation to settings and session list

#### `src/popup/index.tailwind.tsx`
- **Purpose**: Entry point for the popup
- **Details**: Renders the App component with providers

#### `src/pages/SessionList.tailwind.tsx`
- **Purpose**: Displays list of recorded sessions
- **Details**: Provides a table interface to manage sessions
- **Key features**:
  - Lists all recorded sessions with details
  - Allows editing session names
  - Supports deleting sessions
  - Enables downloading sessions
  - Provides import functionality
  - Pagination and sorting capabilities

#### `src/pages/Player.tailwind.tsx`
- **Purpose**: Playback interface for recorded sessions
- **Details**: Uses rrweb-player to replay recorded sessions
- **Key features**:
  - Video-like controls for session playback
  - Speed controls
  - Timeline navigation

#### `src/options/App.tailwind.tsx`
- **Purpose**: Settings page for the extension
- **Details**: Allows configuring extension behavior
- **Key features**:
  - Recording settings
  - Storage management

### 3. Data Management

#### `src/utils/storage.ts`
- **Purpose**: Manages data storage using IndexedDB
- **Details**: Provides functions to interact with session and event data
- **Key functions**:
  - `addSession`: Stores a new recording session and its events
  - `getSession`: Retrieves a specific session
  - `getAllSessions`: Retrieves all sessions
  - `deleteSession/deleteSessions`: Removes sessions
  - `downloadSessions`: Exports sessions as JSON

#### `src/utils/channel.ts`
- **Purpose**: Communication channel between different parts of the extension
- **Details**: Uses a pub/sub pattern to broadcast and listen for events
- **Key methods**:
  - `emit`: Sends an event
  - `on`: Subscribes to an event

#### `src/types.ts`
- **Purpose**: TypeScript type definitions
- **Details**: Contains interfaces and types used throughout the application
- **Key types**:
  - `Session`: Represents a recording session
  - `RecorderStatus`: Enum for recorder states
  - Message types for inter-component communication

### 4. UI Framework

#### `src/components/ui/*`
- **Purpose**: Reusable UI components using shadcn/ui
- **Details**: Components like buttons, inputs, tables, etc.
- **Key components**:
  - `button.tsx`: Button component
  - `toast.tsx/toaster.tsx`: Notification system
  - `circle-button.tsx`: Custom button for recording controls
  - `sidebar-with-header.tsx`: Layout component for pages

#### `src/lib/utils.ts`
- **Purpose**: Utility functions for UI components
- **Details**: Contains the `cn` function for merging class names

#### `src/globals.css`
- **Purpose**: Global CSS styles
- **Details**: Contains Tailwind directives and CSS variables

### 5. Configuration Files

#### `vite.config.ts`
- **Purpose**: Build configuration
- **Details**: Sets up Vite for building the extension
- **Key configurations**:
  - Web extension plugin setup
  - Entry points for different parts of the extension
  - Build output settings

#### `tailwind.config.js`
- **Purpose**: Tailwind CSS configuration
- **Details**: Customizes Tailwind for the project
- **Key settings**:
  - Theme customization
  - Plugin configuration

#### `package.json`
- **Purpose**: Project metadata and dependencies
- **Details**: Lists all npm packages and scripts
- **Key sections**:
  - Development dependencies
  - Runtime dependencies
  - Build and development scripts

## Data Flow and Interactions

### Recording Flow:
1. User clicks "Start Recording" in the popup (`src/popup/App.tailwind.tsx`)
2. Popup sends a message via Channel (`src/utils/channel.ts`)
3. Background script (`src/background/index.ts`) receives the message
4. Background script sends a message to the content script (`src/content/index.ts`)
5. Content script injects the recorder (`src/content/inject.ts`)
6. Recorder captures DOM events and sends them back through the chain
7. Events are stored in IndexedDB via `src/utils/storage.ts`

### Playback Flow:
1. User views sessions in SessionList (`src/pages/SessionList.tailwind.tsx`)
2. User clicks on a session name
3. Navigation to Player page (`src/pages/Player.tailwind.tsx`)
4. Player retrieves session data from storage
5. rrweb-player replays the session

### Import/Export Flow:
1. User clicks "Import" or "Export" in SessionList
2. For export: `downloadSessions` function creates a JSON file
3. For import: File is read, parsed, and sessions are added to storage

## Key Technical Implementations

### Session Recording
- Uses rrweb to capture DOM mutations, user interactions, and other events
- Events are stored as an array of `eventWithTime` objects
- Recording can be paused, resumed, and stopped

### Data Storage
- Uses IndexedDB through the idb library
- Maintains two stores: sessions and events
- Sessions store contains metadata
- Events store contains the actual recording data

### UI Framework
- Built with React and Tailwind CSS
- Uses shadcn/ui components for consistent design
- Responsive design for different screen sizes

### State Management
- Uses React's useState and useEffect for component state
- Leverages context for global state where needed
- Uses custom Channel for cross-component communication