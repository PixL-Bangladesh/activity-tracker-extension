import type { ActionEvent } from "./action-tracking";

interface InputState {
  element: HTMLInputElement | HTMLTextAreaElement;
  initialValue: string;
  currentValue: string;
  focused: boolean;
  lastUpdateTimestamp: number;
}

export class InputTracker {
  private inputStates: Map<HTMLElement, InputState> = new Map();
  private commitCallback: (event: ActionEvent) => void;
  private debounceTimeout: number = 300; // Reduced debounce time for faster response
  private timers: Map<HTMLElement, NodeJS.Timeout> = new Map();
  private valueChangeListeners: Set<(element: HTMLElement, value: string) => void> = new Set();
  
  constructor(commitCallback: (event: ActionEvent) => void) {
    this.commitCallback = commitCallback;
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Listen for focus events on input and textarea elements
    document.addEventListener('focusin', this.handleFocusIn.bind(this), true);
    document.addEventListener('focusout', this.handleFocusOut.bind(this), true);
    document.addEventListener('input', this.handleInput.bind(this), true);
    document.addEventListener('change', this.handleChange.bind(this), true);
    
    // Add special listener for immediate input value capture
    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      if (this.isTrackableInput(target)) {
        const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
        
        // Skip password fields for security
        if (inputElement instanceof HTMLInputElement && inputElement.type === 'password') return;
        
        // Store the current value on any keypress to catch values more reliably
        const state = this.inputStates.get(inputElement);
        if (state) {
          // Update current value on any key press
          state.currentValue = inputElement.value;
          state.lastUpdateTimestamp = Date.now();
          
          // Notify about value change
          this.notifyValueChange(inputElement, inputElement.value);
        }
        
        // Immediately commit the value on Enter key
        if (event.key === 'Enter') {
          if (state) {
            this.commitInputChange(inputElement, state);
          }
        }
      }
    }, true);
    
    // Also monitor form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (!form) return;
      
      // Find all inputs in the form
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (this.isTrackableInput(input as HTMLElement)) {
          const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
          const state = this.inputStates.get(inputElement);
          
          if (state) {
            state.currentValue = inputElement.value;
            this.commitInputChange(inputElement, state);
          }
        }
      });
    }, true);
  }
  
  private handleInput(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (this.isTrackableInput(target)) {
      const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
      const state = this.inputStates.get(inputElement);
      
      // Skip password fields for security
      if (inputElement instanceof HTMLInputElement && inputElement.type === 'password') return;
      
      if (state) {
        // Update current value
        state.currentValue = inputElement.value;
        state.lastUpdateTimestamp = Date.now();
        
        // Notify any listeners about the value change immediately
        // This ensures other components can react to input changes in real-time
        this.notifyValueChange(inputElement, inputElement.value);
        
        // Debounce the input event for committing
        if (this.timers.has(inputElement)) {
          clearTimeout(this.timers.get(inputElement));
        }
        
        const timer = setTimeout(() => {
          // Only commit if the element is still focused and value has changed
          if (state.focused && state.currentValue !== state.initialValue) {
            // Commit the current value to be stored in the action log
            this.commitInputChange(inputElement, state);
            
            // Update the initial value to avoid duplicate commits
            state.initialValue = state.currentValue;
          }
        }, this.debounceTimeout);
        
        this.timers.set(inputElement, timer);
      } else {
        // If we don't have a state for this element, create one and start tracking it
        const newState: InputState = {
          element: inputElement,
          initialValue: inputElement.value,
          currentValue: inputElement.value,
          focused: true,
          lastUpdateTimestamp: Date.now()
        };
        this.inputStates.set(inputElement, newState);
        this.notifyValueChange(inputElement, inputElement.value);
      }
    }
  }

  private commitInputChange(element: HTMLElement, state: InputState): void {
    const elementType = element.tagName.toLowerCase();
    const inputType = element instanceof HTMLInputElement ? element.type : elementType;
    const inputValue = state.currentValue;
    
    // Skip if input value is empty and matches initial value
    if (!inputValue && inputValue === state.initialValue) return;
    
    // Generate appropriate description based on element type
    let description = '';
    let elementDescription = this.getElementDescription(element);
    
    if (inputType === 'checkbox') {
      const isChecked = (element as HTMLInputElement).checked;
      description = `${isChecked ? 'Check' : 'Uncheck'} "${elementDescription}" checkbox`;
    } else if (inputType === 'radio') {
      description = `Select "${elementDescription}" radio option`;
    } else if (elementType === 'select') {
      const selectedOption = Array.from((element as HTMLSelectElement).options)
        .find(option => option.selected)?.textContent || inputValue;
      description = `Select "${selectedOption}" from ${elementDescription} dropdown`;
    } else {
      // For text inputs, show the actual value that was typed
      description = `Type "${inputValue}" in ${elementDescription}`;
    }
    
    // Collect metadata for the action
    const targetInfo = {
      tag: element.tagName.toLowerCase(),
      id: element.id || undefined,
      classes: element.className ? element.className.split(' ').filter(Boolean) : undefined,
      text: element.textContent?.trim() || undefined,
      placeholder: element instanceof HTMLInputElement ? element.placeholder : undefined,
      xpath: this.getElementXPath(element)
    };
    
    // Create and commit the action event
    const actionEvent: ActionEvent = {
      type: 'input',
      target: targetInfo,
      description: description,
      timestamp: state.lastUpdateTimestamp,
      value: inputValue, // Ensure the value is included
      inputValue: inputValue, // Add an explicit inputValue property
      url: window.location.href
    };
    
    console.log('Committing input value:', inputValue);
    this.commitCallback(actionEvent);
  }

  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    if (this.isTrackableInput(target)) {
      const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
      
      // Skip password fields for security
      if (inputElement instanceof HTMLInputElement && inputElement.type === 'password') return;
      
      this.inputStates.set(inputElement, {
        element: inputElement,
        initialValue: inputElement.value,
        currentValue: inputElement.value,
        focused: true,
        lastUpdateTimestamp: Date.now()
      });
      
      // Monitor this element's value
      this.monitorElementValue(inputElement);
    }
  }
  
  private handleFocusOut(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    if (this.isTrackableInput(target)) {
      const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
      const state = this.inputStates.get(inputElement);
      
      if (state) {
        state.focused = false;
        
        // Get the final value before focus is lost
        state.currentValue = inputElement.value;
        
        // If the value has changed, notify and commit
        if (state.currentValue !== state.initialValue) {
          this.notifyValueChange(inputElement, state.currentValue);
          this.commitInputChange(inputElement, state);
        }
        
        // Clean up
        this.inputStates.delete(inputElement);
        
        // Clear any pending timers
        if (this.timers.has(inputElement)) {
          clearTimeout(this.timers.get(inputElement));
          this.timers.delete(inputElement);
        }
      }
    }
  }
  
  private handleChange(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (this.isTrackableInput(target)) {
      const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
      const state = this.inputStates.get(inputElement);
      
      // For select elements, checkboxes and radio buttons, commit immediately
      if (!state && (inputElement.tagName === 'SELECT' || 
          (inputElement.tagName === 'INPUT' && 
          (inputElement.type === 'checkbox' || inputElement.type === 'radio')))) {
        
        // Create a temporary state for this element
        const tempState: InputState = {
          element: inputElement as any,
          initialValue: '',
          currentValue: inputElement.type === 'checkbox' 
            ? (inputElement as HTMLInputElement).checked ? 'checked' : 'unchecked'
            : inputElement.value,
          focused: false,
          lastUpdateTimestamp: Date.now()
        };
        
        // Notify about the value change
        this.notifyValueChange(inputElement, tempState.currentValue);
        
        this.commitInputChange(inputElement, tempState);
      } else if (state) {
        // Update the state with the final value
        state.currentValue = inputElement.value;
        state.lastUpdateTimestamp = Date.now();
        
        // Notify about the value change
        this.notifyValueChange(inputElement, inputElement.value);
        
        // Commit the change
        this.commitInputChange(inputElement, state);
      }
    }
  }
  
  // Add a value change listener to track input values in real-time
  public addValueChangeListener(listener: (element: HTMLElement, value: string) => void): void {
    this.valueChangeListeners.add(listener);
  }
  
  // Remove a value change listener
  public removeValueChangeListener(listener: (element: HTMLElement, value: string) => void): void {
    this.valueChangeListeners.delete(listener);
  }
  
  // Notify all listeners about a value change
  private notifyValueChange(element: HTMLElement, value: string): void {
    this.valueChangeListeners.forEach(listener => {
      try {
        listener(element, value);
      } catch (error) {
        console.error("Error in value change listener:", error);
      }
    });
  }
  
  // Monitor an input element value using MutationObserver when available
  private monitorElementValue(element: HTMLInputElement | HTMLTextAreaElement): void {
    // For modern browsers, we can use MutationObserver to track value changes
    if (typeof MutationObserver !== 'undefined') {
      try {
        const observer = new MutationObserver((mutations) => {
          const state = this.inputStates.get(element);
          if (state && state.currentValue !== element.value) {
            state.currentValue = element.value;
            state.lastUpdateTimestamp = Date.now();
            this.notifyValueChange(element, element.value);
          }
        });
        
        observer.observe(element, { 
          attributes: true, 
          attributeFilter: ['value'] 
        });
        
        // Clean up observer when focus is lost
        element.addEventListener('blur', () => {
          observer.disconnect();
        }, { once: true });
      } catch (error) {
        console.error("Error setting up mutation observer:", error);
      }
    }
  }
  
  private isTrackableInput(element: HTMLElement): boolean {
    return (
      element instanceof HTMLInputElement || 
      element instanceof HTMLTextAreaElement || 
      element instanceof HTMLSelectElement
    );
  }
  
  private getElementDescription(element: HTMLElement): string {
    // Find associated label
    let labelText = '';
    
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        labelText = label.textContent?.trim() || '';
      }
    }
    
    // Look for parent label
    if (!labelText) {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName === 'LABEL') {
          const labelContent = parent.textContent?.trim() || '';
          const elementValue = (element as HTMLInputElement).value?.trim() || '';
          labelText = labelContent.replace(elementValue, '').trim();
          break;
        }
        parent = parent.parentElement;
      }
    }
    
    // Use placeholder as fallback
    if (!labelText && 'placeholder' in element) {
      labelText = (element as HTMLInputElement).placeholder;
    }
    
    // Use name attribute as fallback
    if (!labelText && 'name' in element) {
      labelText = (element as HTMLInputElement).name;
    }
    
    // Use aria-label as fallback
    if (!labelText && element.getAttribute('aria-label')) {
      labelText = element.getAttribute('aria-label') || '';
    }
    
    // Last resort: try to guess based on parent elements
    if (!labelText) {
      const previousSibling = element.previousElementSibling;
      if (previousSibling && previousSibling.textContent) {
        labelText = previousSibling.textContent.trim();
      }
    }
    
    return labelText || 'input field';
  }
  
  private getElementXPath(element: Element): string {
    if (!element) return '';
    if (element.id) return `//*[@id="${element.id}"]`;
    
    let paths: string[] = [];
    for (; element && element.nodeType === Node.ELEMENT_NODE; 
           element = element.parentNode as Element) {
      let index = 0;
      let sibling = element.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && 
            sibling.nodeName === element.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      
      const tagName = element.nodeName.toLowerCase();
      const pathIndex = index ? `[${index + 1}]` : '';
      paths.unshift(`${tagName}${pathIndex}`);
    }
    
    return '/' + paths.join('/');
  }
  
  public destroy(): void {
    // Clean up event listeners
    document.removeEventListener('focusin', this.handleFocusIn.bind(this), true);
    document.removeEventListener('focusout', this.handleFocusOut.bind(this), true);
    document.removeEventListener('input', this.handleInput.bind(this), true);
    document.removeEventListener('change', this.handleChange.bind(this), true);
    
    // Clear all timers
    this.timers.forEach((timer) => {
      clearTimeout(timer);
    });
    
    this.timers.clear();
    this.inputStates.clear();
    this.valueChangeListeners.clear();
  }
}
