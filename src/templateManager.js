// File: templateManager.js

export class TemplateManager {
  constructor() {
    this.localStorageKey = 'tinymceEditorTemplates'; // Key for localStorage
    this.templates = this._loadTemplatesFromLocalStorage(); // Load templates on init
    this.selectedIndex = -1; // No template selected initially
    this.eventListeners = {
      'templatesChanged': []
    };

    this.initTemplateList(); // Initialize the visual list of templates
    this.initTemplateActions(); // Initialize add/remove buttons
    this.initTemplateEdit(); // Initialize the edit input field

    // After initializing the list, if there are templates, select the first one by default
    if (this.templates.length > 0) {
      this.selectTemplate(0);
    }
  }

  // Private method to load templates from localStorage
  _loadTemplatesFromLocalStorage() {
    const storedTemplates = localStorage.getItem(this.localStorageKey);
    if (storedTemplates) {
      try {
        const parsedTemplates = JSON.parse(storedTemplates);
        // Ensure it's an array of strings
        if (Array.isArray(parsedTemplates) && parsedTemplates.every(t => typeof t === 'string')) {
          return parsedTemplates;
        }
        console.warn("Templates in localStorage were not in the expected format. Using default.");
      } catch (e) {
        console.error("Error parsing templates from localStorage:", e);
      }
    }
    // Default templates if nothing in localStorage or if parsing failed/malformed
    return ['Default Template 1', 'Default Template 2', 'Another Template'];
  }

  // Private method to save templates to localStorage
  _saveTemplatesToLocalStorage() {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.templates));
      console.log("Templates saved to localStorage:", this.templates);
    } catch (e) {
      console.error("Error saving templates to localStorage:", e);
    }
  }

  getTemplates() {
    return [...this.templates]; // Return a copy to prevent direct modification from outside
  }

  initTemplateList() {
    const templatesList = document.getElementById('templates-list');
    if (!templatesList) return;

    templatesList.innerHTML = ''; // Clear existing list items

    this.templates.forEach((template, index) => {
      const templateItem = document.createElement('div');
      templateItem.className = 'template-item';
      templateItem.textContent = template;
      templateItem.dataset.index = index.toString(); // Store index as string

      templateItem.addEventListener('click', () => {
        this.selectTemplate(index);
      });

      templatesList.appendChild(templateItem);
    });

    // Re-apply selection styling if a template is selected
    if (this.selectedIndex !== -1 && this.selectedIndex < this.templates.length) {
      const items = templatesList.querySelectorAll('.template-item');
      if (items[this.selectedIndex]) {
        items[this.selectedIndex].classList.add('selected');
      }
    } else if (this.templates.length === 0) {
      // If no templates, clear selection and edit field
      this.selectedIndex = -1;
      const templateEdit = document.getElementById('template-edit');
      if (templateEdit) templateEdit.value = '';
    }
  }

  selectTemplate(index) {
    if (index < 0 || index >= this.templates.length) {
        // If index is invalid (e.g., after deleting the last selected template)
        // Clear selection state
        this.selectedIndex = -1;
        const templateItems = document.querySelectorAll('.template-item.selected');
        templateItems.forEach(item => item.classList.remove('selected'));
        const templateEdit = document.getElementById('template-edit');
        if (templateEdit) {
            templateEdit.value = ''; // Clear edit field
        }
        return;
    }

    this.selectedIndex = index;

    // Update UI to show the selection
    const templateItems = document.querySelectorAll('.template-item');
    templateItems.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
    });

    // Update edit field
    const templateEdit = document.getElementById('template-edit');
    if (templateEdit) {
      templateEdit.value = this.templates[index];
      // templateEdit.focus(); // Optionally focus, can be disruptive if selection changes often
    }
  }

  initTemplateActions() {
    const addButton = document.getElementById('add-template');
    const removeButton = document.getElementById('remove-template');

    if (addButton) {
      addButton.addEventListener('click', () => {
        this.addTemplate();
      });
    }

    if (removeButton) {
      removeButton.addEventListener('click', () => {
        this.removeTemplate();
      });
    }
  }

  initTemplateEdit() {
    const templateEdit = document.getElementById('template-edit');
    if (!templateEdit) return;

    // Update template name as user types
    templateEdit.addEventListener('input', (e) => {
      if (this.selectedIndex !== -1) {
        this.templates[this.selectedIndex] = e.target.value;
        // Update the item in the list view immediately
        const currentItemInList = document.querySelector(`.template-item[data-index='${this.selectedIndex}']`);
        if (currentItemInList) {
          currentItemInList.textContent = e.target.value;
        }
        // Defer saving and full emit until blur or specific action
      }
    });
    
    // Save changes when focus is lost from the input field
    templateEdit.addEventListener('blur', () => {
      if (this.selectedIndex !== -1) {
        this._saveTemplatesToLocalStorage();
        this.emit('templatesChanged'); // Notify editor components to update
      }
    });

    // Optionally, save on Enter key as well
    templateEdit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if it's in a form
            templateEdit.blur(); // Trigger blur to save and emit
        }
    });
  }

  addTemplate() {
    const newTemplateName = `Template ${this.templates.length + 1}`;
    this.templates.push(newTemplateName);
    this._saveTemplatesToLocalStorage(); // Save to localStorage

    const newIndex = this.templates.length - 1;
    this.initTemplateList(); // Re-render the list
    this.selectTemplate(newIndex); // Select the newly added template
    
    const templateEdit = document.getElementById('template-edit');
    if (templateEdit) {
      templateEdit.focus(); // Focus the edit field for the new template
    }

    this.emit('templatesChanged'); // Notify listeners (e.g., the editor)
  }

  removeTemplate() {
    if (this.selectedIndex < 0 || this.selectedIndex >= this.templates.length) return; // No template selected or invalid index

    this.templates.splice(this.selectedIndex, 1);
    this._saveTemplatesToLocalStorage(); // Save to localStorage

    // Adjust selection: try to select previous, or first, or clear if empty
    let newSelectedIndex = -1;
    if (this.templates.length > 0) {
      newSelectedIndex = Math.max(0, this.selectedIndex -1); // Try to select previous or first
    }
    
    this.initTemplateList(); // Re-render the list
    this.selectTemplate(newSelectedIndex); // Update selection

    this.emit('templatesChanged'); // Notify listeners
  }

  updateTemplate(value) { // This method is effectively handled by 'input' and 'blur' on the edit field
    if (this.selectedIndex < 0 || this.selectedIndex >= this.templates.length) return;

    this.templates[this.selectedIndex] = value;
    this._saveTemplatesToLocalStorage();

    // Update UI (already handled by 'input' for list item, and selectTemplate handles edit field)
    const currentItemInList = document.querySelector(`.template-item[data-index='${this.selectedIndex}']`);
    if (currentItemInList) {
        currentItemInList.textContent = value;
    }
    
    this.emit('templatesChanged');
  }

  // Simple event emitter system
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, ...args) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
  }
}