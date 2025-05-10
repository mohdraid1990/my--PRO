// src/editor.js
import tinymce from 'tinymce';
import 'tinymce/models/dom/model';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/skins/ui/oxide/skin.css';
import 'tinymce/skins/ui/oxide/content.css';
import 'tinymce/skins/content/default/content.css';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/lists';
import { TemplateManager } from './templateManager.js';

export class Editor {
  constructor() {
    this.templateManager = new TemplateManager();
    this.editor = null;
    this.insertButton = document.getElementById('insert-button');
    this.setupButtons();
    this.initEditor();
  }

  setupButtons() {
    if (this.insertButton) {
      this.insertButton.disabled = true;
      this.insertButton.addEventListener('click', () => {
        this.insertTemplateComponent();
      });
    }
  }

  initEditor() {
    tinymce.init({
      selector: '#editor',
      height: '100%',
      menubar: false,
      statusbar: false,
      plugins: ['advlist', 'link', 'lists', 'image'],
      toolbar: 'undo redo | bold italic | bullist numlist | link image',
      noneditable_class: 'template-component',
      content_style: `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
          padding: 16px; 
        }
        .template-component { 
          display: inline-flex; 
          align-items: center; 
          background-color: rgba(59, 130, 246, 0.1); 
          border: 1px solid rgba(59, 130, 246, 0.3); 
          border-radius: 4px; 
          padding: 2px 6px; 
          margin: 0 2px; 
          vertical-align: middle; 
          user-select: none; /* Important for non-editable experience */
        }
        .template-component[data-mce-selected] {
            outline: 2px solid #3B82F6; /* TinyMCE's selection outline */
        }
        .template-component select { 
          border: 1px solid #ccc; 
          background: white; 
          color: #1e293b; 
          padding: 2px 20px 2px 4px;
          font-size: 14px; 
          min-width: 150px; 
          width: auto; 
          max-width: 250px;
          height: 26px; 
          cursor: pointer; 
          appearance: menulist; 
          -webkit-appearance: menulist; 
          -moz-appearance: menulist; 
          outline: none; 
          border-radius: 2px; 
          font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
        }
        .template-component select:focus { 
            border-color: #3B82F6;
        }
        .template-component.error { 
          background-color: rgba(239, 68, 68, 0.1); 
          border-color: rgba(239, 68, 68, 0.3); 
          color: #ef4444; 
          padding: 4px 8px;
        }
        .template-component.error select {
            display: none;
        }
      `,
      extended_valid_elements: 'span[id|class|contenteditable|data-component|data-current-template-index|data-error-message],select[data-template-select|data-id],option[value]', // Added data-error-message
      
      setup: (editor) => {
        this.editor = editor;
        
        editor.on('init', () => {
          console.log('TinyMCE editor initialized. Enabling insert button.');
          if (this.insertButton) {
            this.insertButton.disabled = false;
          }
          this.updateAllTemplateComponentsInEditor();
          this.setupDelegatedEventListeners();
        });
        
        this.templateManager.on('templatesChanged', () => {
          console.log('Event: templatesChanged - updating components in editor.');
          this.updateAllTemplateComponentsInEditor();
        });

        editor.on('click', (e) => {
            const clickedElement = e.target;
            if (clickedElement.nodeName === 'SELECT' && clickedElement.hasAttribute('data-template-select')) {
                return;
            }
        });
      }
    });
  }

  insertTemplateComponent() {
    if (!this.editor) {
      console.error('Editor not initialized. Cannot insert template component.');
      return;
    }
    
    const templates = this.templateManager.getTemplates();
    console.log('Inserting template component. Available templates:', templates);
    
    const componentId = `tpl-comp-${Date.now()}`;
    let componentHTML;

    if (templates.length > 0) {
      let optionsHTML = '';
      const defaultSelectedTemplateIndex = 0; 
      templates.forEach((template, index) => {
        const sanitizedTemplateText = this.editor.dom.encode(template);
        const selectedAttr = index === defaultSelectedTemplateIndex ? ' selected' : '';
        optionsHTML += `<option value="${index}"${selectedAttr}>${sanitizedTemplateText}</option>`;
      });

      componentHTML = `
        <span id="${componentId}" class="template-component" data-component="template" contenteditable="false" data-current-template-index="${defaultSelectedTemplateIndex}">
          <select data-template-select data-id="${componentId}-select">
            ${optionsHTML}
          </select>
        </span> `; // Added   for spacing, often helpful
    } else {
      componentHTML = `
        <span id="${componentId}" class="template-component error" data-component="template" contenteditable="false" data-error-message="No Templates Available">
          No Templates Available
        </span> `; // Added  
    }
    
    this.editor.insertContent(componentHTML);
    this.editor.nodeChanged(); 
    console.log(`Inserted component HTML for ID ${componentId}`);
  }
  
  setupDelegatedEventListeners() {
    if (!this.editor || !this.editor.getBody()) {
        console.warn('Delegated event listeners: Editor or body not ready.');
        return;
    }

    const editorBody = this.editor.getBody();
    
    editorBody.addEventListener('mousedown', (event) => {
      const targetSelect = event.target;
      if (targetSelect && targetSelect.matches('select[data-template-select]')) {
        event.stopPropagation();
      }
    }, false); 

    editorBody.addEventListener('change', (event) => {
      const targetSelect = event.target;
      if (targetSelect && targetSelect.matches('select[data-template-select]')) {
        event.stopPropagation(); 
        this.handleTemplateSelectionChange(targetSelect);
      }
    });

    editorBody.addEventListener('click', (event) => {
      const targetSelect = event.target;
      if (targetSelect && targetSelect.matches('select[data-template-select]')) {
        event.stopPropagation(); 
      }
    });
  }

  handleTemplateSelectionChange(selectElement) {
    const componentSpan = selectElement.closest('.template-component');
    if (!componentSpan) return;

    const selectedIndex = selectElement.value;
    componentSpan.setAttribute('data-current-template-index', selectedIndex);
    
    // If selection changes, it's no longer in an "ERROR" state from previous invalid selection
    componentSpan.classList.remove('error');
    componentSpan.removeAttribute('data-error-message');
    // Ensure any direct text node (like "ERROR") is removed if select is now active
    Array.from(componentSpan.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node !== selectElement) {
            componentSpan.removeChild(node);
        }
    });


    console.log(`Template selection changed for component ${componentSpan.id}. New index: ${selectedIndex}`);
    this.editor.nodeChanged();
    this.editor.undoManager.add(); 
  }
  
  updateAllTemplateComponentsInEditor() {
    if (!this.editor || !this.editor.getDoc() || !this.editor.getBody()) {
      console.warn('Editor not fully ready for updating components.');
      return;
    }
    
    const templates = this.templateManager.getTemplates();
    const editorBody = this.editor.getBody();
    const componentsInEditor = editorBody.querySelectorAll('.template-component[data-component="template"]');
    
    console.log(`Updating ${componentsInEditor.length} components in editor. Templates count: ${templates.length}`);

    componentsInEditor.forEach(componentSpan => {
      const currentStoredIndexString = componentSpan.getAttribute('data-current-template-index');
      let currentStoredIndex = currentStoredIndexString ? parseInt(currentStoredIndexString, 10) : -1;
      let selectElement = componentSpan.querySelector('select[data-template-select]');

      // 1. Clear previous dynamic text content (like "ERROR" or "No Templates Available")
      //    but preserve the select element itself.
      Array.from(componentSpan.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node !== selectElement) {
          componentSpan.removeChild(node);
        }
      });
      componentSpan.removeAttribute('data-error-message');


      if (templates.length > 0) {
        // 2. Ensure select element exists if there are templates
        if (!selectElement) {
          selectElement = this.editor.getDoc().createElement('select'); 
          selectElement.setAttribute('data-template-select', '');
          if (componentSpan.id) {
            selectElement.setAttribute('data-id', `${componentSpan.id}-select`);
          }
          // Insert select, preferably before any other non-text child, or append
          const firstChild = componentSpan.firstChild;
          if (firstChild) {
            componentSpan.insertBefore(selectElement, firstChild);
          } else {
            componentSpan.appendChild(selectElement);
          }
        }
        selectElement.style.display = ''; // Make sure it's visible
        selectElement.innerHTML = ''; // Clear existing options

        // 3. Populate select with current templates
        templates.forEach((template, index) => {
          const option = this.editor.getDoc().createElement('option'); 
          option.value = index.toString();
          option.textContent = this.editor.dom.encode(template);
          selectElement.appendChild(option);
        });

        // 4. Determine state: valid selection, error, or default
        if (currentStoredIndex >= 0 && currentStoredIndex < templates.length) {
          // Previous selection is still valid
          selectElement.value = currentStoredIndex.toString();
          componentSpan.classList.remove('error');
        } else {
          // Previous selection is no longer valid (deleted) OR it was an error state.
          // Requirement: Show ERROR, even if other templates exist.
          componentSpan.classList.add('error');
          selectElement.style.display = 'none'; // Hide select as per .error CSS
          
          const errorTextNode = this.editor.getDoc().createTextNode('ERROR');
          // Insert error text. If select was first child, insert after it, otherwise before.
          if (selectElement === componentSpan.firstChild && componentSpan.childNodes.length > 1) {
             componentSpan.insertBefore(errorTextNode, selectElement.nextSibling);
          } else if (componentSpan.firstChild) {
             componentSpan.insertBefore(errorTextNode, componentSpan.firstChild);
          } else {
             componentSpan.appendChild(errorTextNode);
          }
          componentSpan.setAttribute('data-error-message', 'ERROR');
          // We keep data-current-template-index as is (or set to -1) to remember it was invalid
          // This is important if templates are added back and it becomes valid again.
          // Or, if you prefer to reset:
          // componentSpan.setAttribute('data-current-template-index', '-1');
        }
      } else { 
        // 5. No templates available at all
        if (selectElement) {
          selectElement.style.display = 'none'; // Hide select if it exists
        }
        componentSpan.classList.add('error');
        const noTemplatesTextNode = this.editor.getDoc().createTextNode('No Templates Available');
        componentSpan.appendChild(noTemplatesTextNode);
        componentSpan.setAttribute('data-error-message', 'No Templates Available');
        componentSpan.removeAttribute('data-current-template-index'); // No valid index possible
      }
    });
    
    this.editor.nodeChanged(); 
  }
}