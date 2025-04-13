import { captureDOMSnapshot } from "./dom-capture";
import { InputTracker } from "./input-tracker";

export interface ActionEvent {
  type: string;
  target: {
    tag: string;
    id?: string;
    classes?: string[];
    xpath?: string;
    text?: string;
  };
  description: string;
  timestamp: number;
  value?: string;
  inputValue?: string; // Explicitly add inputValue property
  url: string;
}

export class ActionTracker {
  private actions: ActionEvent[] = [];
  private isTracking = false;
  private inputTracker: InputTracker | null = null;
  private inputValues: Record<string, string> = {}; // Store input values by element identifier

  /**
   * Start tracking user actions
   */
  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.setupEventListeners();

    // Initialize input tracker with a callback to record actions
    this.inputTracker = new InputTracker((action: ActionEvent) => {
      this.addAction(action);
    });

    // Add listener to store input values as they change
    if (this.inputTracker) {
      this.inputTracker.addValueChangeListener((element, value) => {
        // Store the latest input value in a global cache for use in other events
        const elementId = element.id || this.getBestSelector(element);

        // Store in our local cache
        this.inputValues[elementId] = value;

        // Store in the window global for cross-component access
        window._inputValues = window._inputValues || {};
        window._inputValues[elementId] = value;

        console.log(`Stored input value for ${elementId}:`, value);
      });
    }

    // Capture initial DOM state
    const domSnapshot = captureDOMSnapshot();
    console.log("Initial DOM snapshot captured", domSnapshot);
  }

  /**
   * Stop tracking user actions
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    this.removeEventListeners();

    if (this.inputTracker) {
      this.inputTracker.destroy();
      this.inputTracker = null;
    }
  }

  /**
   * Get all recorded actions
   */
  getActions(): ActionEvent[] {
    return [...this.actions];
  }

  /**
   * Get all stored input values
   */
  getInputValues(): Record<string, string> {
    return { ...this.inputValues };
  }

  /**
   * Clear recorded actions
   */
  clearActions(): void {
    this.actions = [];
    this.inputValues = {};
  }

  /**
   * Add an action to the tracked list
   */
  addAction(action: ActionEvent): void {
    console.log("Adding action:", action);

    // If this is an input action, make sure to store the value
    if (action.type === "input" && action.value) {
      // If we have a target id, use it to store the value
      if (action.target.id) {
        this.inputValues[action.target.id] = action.value;
      }

      // Also store by xpath if available
      if (action.target.xpath) {
        this.inputValues[action.target.xpath] = action.value;
      }

      // Make sure inputValue is set (this helps with backward compatibility)
      action.inputValue = action.value;
    }

    this.actions.push(action);

    // Capture DOM snapshot after significant actions
    if (action.type !== "scroll") {
      setTimeout(() => {
        const domSnapshot = captureDOMSnapshot();
        console.log(
          `DOM snapshot captured after ${action.type} action:`,
          domSnapshot
        );
      }, 500);
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    document.addEventListener("click", this.handleClick.bind(this), true);
    document.addEventListener("submit", this.handleFormSubmit.bind(this), true);
    document.addEventListener("keypress", this.handleKeypress.bind(this), true);
    window.addEventListener("popstate", this.handleNavigation.bind(this));
    window.addEventListener("hashchange", this.handleNavigation.bind(this));
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    document.removeEventListener("click", this.handleClick.bind(this), true);
    document.removeEventListener(
      "submit",
      this.handleFormSubmit.bind(this),
      true
    );
    document.removeEventListener("keypress", this.handleKeypress.bind(this), true);
    window.removeEventListener("popstate", this.handleNavigation.bind(this));
    window.removeEventListener("hashchange", this.handleNavigation.bind(this));
  }

  /**
   * Find the best selector for an element
   */
  private getBestSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;

    // Try to find a descriptive class
    if (element.className) {
      const classes = element.className
        .split(" ")
        .filter((c) => c && !c.includes("ng-") && !c.includes("_"));
      if (classes.length) return `.${classes.join(".")}`;
    }

    // Use tag name + text content as fallback
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent?.trim();
    if (text && text.length < 20) {
      return `${tagName}[contains(text(), "${text}")]`;
    }

    return tagName;
  }

  /**
   * Get a meaningful description for an element
   */
  private getElementDescription(element: HTMLElement): string {
    // Look for text content
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 30) {
      return textContent;
    }

    // Look for value attribute for inputs
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLButtonElement
    ) {
      const value = element.value?.trim();
      if (value) {
        return value;
      }
    }

    // Look for aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
      return ariaLabel;
    }

    // Look for button type
    if (element instanceof HTMLButtonElement) {
      return `${element.type || "button"} button`;
    }

    // Look for alt text for images
    const imgElement = element.querySelector("img");
    if (imgElement) {
      const altText = imgElement.getAttribute("alt");
      if (altText) {
        return altText;
      }
    }

    // Default to tag name
    return element.tagName.toLowerCase();
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    if (!this.isTracking) return;

    const target = event.target as HTMLElement;
    if (!target) return;

    // Skip tracking clicks on body or document
    if (target === document.body || target === document.documentElement) {
      return;
    }

    // Find the closest interactive element
    let interactiveElement = target;
    let currentElement: HTMLElement | null = target;

    while (currentElement && currentElement !== document.body) {
      if (
        currentElement.tagName === "A" ||
        currentElement.tagName === "BUTTON" ||
        currentElement.getAttribute("role") === "button" ||
        currentElement.tagName === "INPUT" ||
        currentElement.onclick !== null ||
        window.getComputedStyle(currentElement).cursor === "pointer"
      ) {
        interactiveElement = currentElement;
        break;
      }
      currentElement = currentElement.parentElement;
    }

    // Skip if it's an input element (handled by InputTracker)
    if (
      interactiveElement.tagName === "INPUT" ||
      interactiveElement.tagName === "TEXTAREA" ||
      interactiveElement.tagName === "SELECT"
    ) {
      return;
    }

    // Create action event
    const action: ActionEvent = {
      type: "click",
      target: {
        tag: interactiveElement.tagName.toLowerCase(),
        xpath: this.getBestSelector(interactiveElement),
      },
      description: this.getElementDescription(interactiveElement),
      timestamp: Date.now(),
      url: window.location.href,
    };

    if (interactiveElement.id) {
      action.target.id = interactiveElement.id;
    }

    if (interactiveElement.className) {
      action.target.classes = interactiveElement.className
        .split(" ")
        .filter(Boolean);
    }

    if (interactiveElement.textContent) {
      action.target.text = interactiveElement.textContent.trim();
    }

    this.addAction(action);
  }

  /**
   * Handle form submit events
   */
  private handleFormSubmit(event: Event): void {
    if (!this.isTracking) return;

    const target = event.target as HTMLFormElement;
    if (!target || !(target instanceof HTMLFormElement)) return;

    // Collect input values from the form
    const formData = new FormData(target);
    const formValues: Record<string, string> = {};

    // Process each input in the form
    formData.forEach((value, key) => {
      // Skip password fields for security
      if (key.toLowerCase().includes("password")) return;

      formValues[key] = value.toString();
    });

    // Also collect inputs by ID
    const inputs = target.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      const element = input as HTMLInputElement;
      if (element.id && element.type !== "password") {
        formValues[`#${element.id}`] = element.value;
      }
    });

    // Create action event
    const action: ActionEvent = {
      type: "form_submit",
      target: {
        tag: target.tagName.toLowerCase(),
        xpath: this.getBestSelector(target),
      },
      description: `Submit form${target.id ? ` #${target.id}` : ""}`,
      timestamp: Date.now(),
      value: JSON.stringify(formValues),
      url: window.location.href,
    };

    if (target.id) {
      action.target.id = target.id;
    }

    if (target.className) {
      action.target.classes = target.className.split(" ").filter(Boolean);
    }

    this.addAction(action);
  }

  /**
   * Handle navigation events
   */
  private handleNavigation(): void {
    if (!this.isTracking) return;

    // Create action event
    const action: ActionEvent = {
      type: "navigation",
      target: {
        tag: "window",
      },
      description: `Navigate to ${document.title || window.location.href}`,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.addAction(action);
  }

  /**
   * Handle keypress events
   */
  private handleKeypress(event: KeyboardEvent): void {
    if (!this.isTracking) return;

    const target = event.target as HTMLElement;

    // Skip if it's already handled by InputTracker
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }

    // For non-input elements, track the keypress
    const action: ActionEvent = {
      type: "keypress",
      target: {
        tag: target.tagName.toLowerCase(),
        xpath: this.getBestSelector(target),
      },
      description: `Pressed ${event.key} key`,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.addAction(action);
  }
}

// Extend window object to allow storing input values
declare global {
  interface Window {
    _inputValues?: Record<string, string>;
  }
}

// Export singleton instance
export const actionTracker = new ActionTracker();
