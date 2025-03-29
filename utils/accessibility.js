/**
 * Accessibility utilities for Action Tracker extension
 * Handles capturing and processing accessibility tree data
 */

// Accessibility tree capture utility
class AccessibilityCapture {
  constructor() {
    this.lastCaptureTime = 0;
    this.captureThrottleMs = 500; // Throttle captures to avoid performance issues
  }

  // Capture the accessibility tree for the current page
  async captureAccessibilityTree() {
    // Throttle captures
    const now = Date.now();
    if (now - this.lastCaptureTime < this.captureThrottleMs) {
      return null;
    }
    this.lastCaptureTime = now;

    try {
      // Start from the document body
      const a11yTree = this.processNode(document.body);

      return {
        timestamp: now,
        url: window.location.href,
        title: document.title,
        tree: a11yTree
      };
    } catch (error) {
      console.error('Error capturing accessibility tree:', error);
      return null;
    }
  }

  // Process a DOM node and its children recursively
  processNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    // Get node information
    const nodeInfo = {
      role: this.getRole(node),
      name: this.getAccessibleName(node),
      tagName: node.tagName.toLowerCase(),
      id: node.id || null,
      className: node.className || null,
      textContent: this.getNodeText(node),
      attributes: this.getAriaAttributes(node),
      states: this.getAccessibilityStates(node),
      position: this.getNodePosition(node),
      children: []
    };

    // Process children (only element nodes)
    for (let i = 0; i < node.children.length; i++) {
      const childNode = this.processNode(node.children[i]);
      if (childNode) {
        nodeInfo.children.push(childNode);
      }
    }

    return nodeInfo;
  }

  // Get the ARIA role of an element
  getRole(element) {
    // First check for explicit role
    if (element.hasAttribute('role')) {
      return element.getAttribute('role');
    }

    // Then check for implicit role based on element type
    return this.getImplicitRole(element);
  }

  // Get the implicit ARIA role based on element type
  getImplicitRole(element) {
    const tagName = element.tagName.toLowerCase();

    // Common mappings of HTML elements to ARIA roles
    const roleMap = {
      'a': element.hasAttribute('href') ? 'link' : 'generic',
      'article': 'article',
      'aside': 'complementary',
      'button': 'button',
      'details': 'group',
      'dialog': 'dialog',
      'div': 'generic',
      'footer': 'contentinfo',
      'form': 'form',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'header': 'banner',
      'hr': 'separator',
      'img': element.hasAttribute('alt') ? 'img' : 'presentation',
      'input': this.getInputRole(element),
      'li': 'listitem',
      'main': 'main',
      'menu': 'menu',
      'nav': 'navigation',
      'ol': 'list',
      'option': 'option',
      'progress': 'progressbar',
      'section': 'region',
      'select': 'combobox',
      'summary': 'button',
      'table': 'table',
      'tbody': 'rowgroup',
      'td': 'cell',
      'textarea': 'textbox',
      'th': 'columnheader',
      'thead': 'rowgroup',
      'tr': 'row',
      'ul': 'list'
    };

    return roleMap[tagName] || 'generic';
  }

  // Get the role for input elements based on their type
  getInputRole(element) {
    if (element.tagName.toLowerCase() !== 'input') {
      return 'generic';
    }

    const type = element.type || 'text';

    const inputRoleMap = {
      'button': 'button',
      'checkbox': 'checkbox',
      'color': 'textbox',
      'date': 'textbox',
      'datetime': 'textbox',
      'datetime-local': 'textbox',
      'email': 'textbox',
      'file': 'button',
      'hidden': 'generic',
      'image': 'button',
      'month': 'textbox',
      'number': 'spinbutton',
      'password': 'textbox',
      'radio': 'radio',
      'range': 'slider',
      'reset': 'button',
      'search': 'searchbox',
      'submit': 'button',
      'tel': 'textbox',
      'text': 'textbox',
      'time': 'textbox',
      'url': 'textbox',
      'week': 'textbox'
    };

    return inputRoleMap[type] || 'textbox';
  }

  // Get the accessible name of an element
  getAccessibleName(element) {
    // Check in order of priority according to accessible name computation algorithm

    // 1. aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
      const ids = element.getAttribute('aria-labelledby').split(/\s+/);
      return ids.map(id => {
        const labelElement = document.getElementById(id);
        return labelElement ? this.getNodeText(labelElement) : '';
      }).filter(text => text).join(' ');
    }

    // 2. aria-label
    if (element.hasAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }

    // 3. label element (for form controls)
    if (element.id) {
      const labels = document.querySelectorAll(`label[for="${element.id}"]`);
      if (labels.length > 0) {
        return this.getNodeText(labels[0]);
      }
    }

    // 4. title attribute
    if (element.hasAttribute('title')) {
      return element.getAttribute('title');
    }

    // 5. placeholder attribute (for text inputs)
    if (element.hasAttribute('placeholder')) {
      return element.getAttribute('placeholder');
    }

    // 6. Special cases

    // For images, use alt text
    if (element.tagName.toLowerCase() === 'img' && element.hasAttribute('alt')) {
      return element.getAttribute('alt');
    }

    // For buttons, use text content
    if (element.tagName.toLowerCase() === 'button') {
      return this.getNodeText(element);
    }

    // For links, use text content
    if (element.tagName.toLowerCase() === 'a') {
      return this.getNodeText(element);
    }

    // For inputs with type="button", "submit", "reset", use value
    if (element.tagName.toLowerCase() === 'input') {
      const type = element.getAttribute('type');
      if (type === 'button' || type === 'submit' || type === 'reset') {
        return element.value || '';
      }
    }

    // 7. For other elements, return empty string
    return '';
  }

  // Get text content of a node (simplified)
  getNodeText(node) {
    if (!node) return '';

    // For input elements, return their value
    if (node.tagName === 'INPUT') {
      if (node.type === 'password') {
        return '[REDACTED]';
      }
      return node.value || '';
    }

    // For other elements, return trimmed text content
    let text = node.textContent || '';
    text = text.trim();

    // Limit length to avoid excessive data
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }

  // Get ARIA attributes of an element
  getAriaAttributes(element) {
    const attributes = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name.startsWith('aria-')) {
        attributes[attr.name] = attr.value;
      }
    }

    return attributes;
  }

  // Get accessibility states of an element
  getAccessibilityStates(element) {
    return {
      disabled: element.disabled || element.hasAttribute('aria-disabled'),
      hidden: element.hidden || element.hasAttribute('aria-hidden') || this.isVisuallyHidden(element),
      checked: element.checked || element.getAttribute('aria-checked') === 'true',
      selected: element.selected || element.getAttribute('aria-selected') === 'true',
      expanded: element.getAttribute('aria-expanded') === 'true',
      collapsed: element.getAttribute('aria-expanded') === 'false',
      busy: element.getAttribute('aria-busy') === 'true',
      required: element.required || element.getAttribute('aria-required') === 'true',
      invalid: element.validity ? !element.validity.valid : element.getAttribute('aria-invalid') === 'true',
      focused: document.activeElement === element
    };
  }

  // Check if an element is visually hidden
  isVisuallyHidden(element) {
    const style = window.getComputedStyle(element);
    return style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      (style.position === 'absolute' && style.width === '1px' && style.height === '1px');
  }

  // Get position and dimensions of a node
  getNodePosition(node) {
    try {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        viewportX: rect.left,
        viewportY: rect.top,
        pageX: rect.left + window.scrollX,
        pageY: rect.top + window.scrollY
      };
    } catch (e) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        viewportX: 0,
        viewportY: 0,
        pageX: 0,
        pageY: 0
      };
    }
  }
}

// Export the accessibility capture utility
export { AccessibilityCapture };
