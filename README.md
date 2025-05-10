# TinyMCE Template Editor

A rich text editor project built on TinyMCE with the ability to insert and manage text templates.

## Features

- Full-featured text editor with basic formatting tools
- Insert text templates into content
- Template management (add, delete, edit)
- Simple and easy-to-use interface

## Requirements

- Node.js (version 14 or later)
- npm (Node.js package manager)

## Installation

1. Download or clone the project to your machine:

```bash
git clone https://github.com/yourusername/tinymce-template-editor.git
cd tinymce-template-editor
```

2. Install dependencies:

```bash
npm install
```

## Running the Project

To run the project in development mode:

```bash
npm run dev
```

The development server will run on port 5173 (or another port if this one is busy). You can access the application in your browser at:

```
http://localhost:5173
```

## Building for Production

To build a production version of the project:

```bash
npm run build
```

Build files will be created in the `dist` folder. You can host these files on any web server.

To preview the production build locally:

```bash
npm run preview
```

## How to Use

1. **Text Editor**: Use the toolbar at the top for formatting (bold, italic, lists, links).
2. **Insert Template**: Click the "Insert" button to insert a template at the cursor position.
3. **Select Template**: After inserting a template, you can click on the dropdown menu to select the desired template.
4. **Manage Templates**: On the right side, you can:
   - See a list of available templates
   - Add a new template by clicking the "+" button
   - Delete the selected template by clicking the "-" button
   - Edit the selected template using the edit field below the list

## Project Structure

- `index.html`: Main HTML page
- `main.js`: Main entry point for the application
- `style.css`: CSS styles for the application
- `src/editor.js`: TinyMCE editor implementation
- `src/templateManager.js`: Template management

## Customization

You can customize the project by:

1. Modifying CSS variables in the `style.css` file to change colors and sizes
2. Adding more plugins to TinyMCE in the `src/editor.js` file
3. Modifying default templates in the `src/templateManager.js` file

## License

This project is licensed under the [MIT License](LICENSE).
