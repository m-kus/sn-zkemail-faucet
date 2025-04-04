# Lu.ma Proof Generator App

This is a React application that generates proofs of registration from Lu.ma event emails. Upload your event confirmation email and the app will generate a cryptographic proof through a step-by-step process.

## Getting Started

### Prerequisites

Make sure you have Node.js (v14 or higher) and npm installed on your system.

### Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

To start the development server:

```bash
npm start
```

This will launch the application in your default web browser at [http://localhost:3000](http://localhost:3000).

## How to Use

1. Drag and drop an .eml file onto the dropzone, or click the dropzone to select a file from your system.
2. The application will guide you through the proof generation process with a visual progress indicator.
3. The process consists of three stages:
   - Parsing Email - Extracting and verifying email contents
   - Generating Witness - Preparing verification data
   - Generating Proof - Creating the zero-knowledge proof
4. Upon successful proof generation, you can create a pre-funded account.

## Browser Compatibility

This application uses the `@zk-email/zkemail-nr` library which primarily targets Node.js environments. To make it work in the browser, we use:

1. `react-app-rewired` to customize webpack configuration
2. Node.js polyfills for various core modules (crypto, stream, path, etc.)

## Technologies Used

- [React](https://reactjs.org/) for the UI
- [react-dropzone](https://react-dropzone.js.org/) for drag-and-drop functionality
- [@zk-email/zkemail-nr](https://www.npmjs.com/package/@zk-email/zkemail-nr) for email parsing and ZK proof generation
- [@noir-lang/noir_js](https://noir-lang.org/) for executing Noir circuits

## ZK Email Integration

The application uses the [`@zk-email/zkemail-nr`](https://www.npmjs.com/package/@zk-email/zkemail-nr) package to parse emails and generate inputs for Noir proofs.

## Dependencies

This project uses the following main libraries:

- React for the UI
- react-dropzone for drag-and-drop functionality
- Buffer for handling binary data

## Node.js Polyfills

The application uses the following Node.js polyfills for browser compatibility:

```assert
buffer
crypto-browserify
fs-browserify (stub)
os-browserify
path-browserify
process
stream-browserify
timers-browserify
url
util
```

These are configured in the `config-overrides.js` file.

## Notes About Email Parsing

- The application uses basic string parsing to extract information from .eml files.
- Not all emails contain DKIM signatures. If an email doesn't have DKIM information, those fields will show as "Not found".
- DKIM public keys are typically not included in the email itself but are retrieved from DNS records. This application doesn't perform DNS lookups, so this field will usually show as "Not found".
- Large emails may take a moment to process.

## Node.js Polyfills

The application uses the following Node.js polyfills for browser compatibility:

```assert
buffer
crypto-browserify
fs-browserify (stub)
os-browserify
path-browserify
process
stream-browserify
timers-browserify
url
util
```

These are configured in the `config-overrides.js` file.

## ZK Email Integration

The application attempts to use the [`@zk-email/zkemail-nr`](https://www.npmjs.com/package/@zk-email/zkemail-nr) package to parse emails and generate inputs for Noir proofs. If this integration is not fully available in the browser environment, the app will fall back to a simpler parsing method.

The proofs generated can be used with compatible Noir circuits to create zero-knowledge proofs about the contents of the emails without revealing the full email contents. 