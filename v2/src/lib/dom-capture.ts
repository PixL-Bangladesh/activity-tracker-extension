/**
 * DOM Capture Utility
 * Captures the DOM state and extracts relevant information for AI processing
 */

interface DOMNode {
  tag: string;
  id?: string;
  classes?: string[];
  text?: string;
  attributes?: Record<string, string>;
  children?: DOMNode[];
  role?: string;
  ariaLabel?: string;
  isInteractive: boolean;
  xpath?: string;
}

interface DOMSnapshot {
  timestamp: number;
  url: string;
  title: string;
  nodes: DOMNode;
}

/**
 * Generate an XPath for a given element
 */
function getElementXPath(element: Element): string {
  if (!element) return "";
  if (element.id) return `//*[@id="${element.id}"]`;

  const paths: string[] = [];
  for (
    ;
    element && element.nodeType === Node.ELEMENT_NODE;
    element = element.parentNode as Element
  ) {
    let index = 0;
    let sibling = element.previousSibling;
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        sibling.nodeName === element.nodeName
      ) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = element.nodeName.toLowerCase();
    const pathIndex = index ? `[${index + 1}]` : "";
    paths.unshift(`${tagName}${pathIndex}`);
  }

  return `/${paths.join("/")}`;
}

/**
 * Determines if an element is interactive (clickable, input, etc.)
 */
function isInteractiveElement(element: Element): boolean {
  const interactiveTags = [
    "a",
    "button",
    "input",
    "select",
    "textarea",
    "option",
  ];
  const interactiveRoles = [
    "button",
    "link",
    "checkbox",
    "radio",
    "menuitem",
    "tab",
  ];

  // Check tag name
  if (interactiveTags.includes(element.tagName.toLowerCase())) return true;

  // Check role attribute
  const role = element.getAttribute("role");
  if (role && interactiveRoles.includes(role)) return true;

  // Check for click handlers
  const hasOnClick =
    element.hasAttribute("onclick") ||
    element.hasAttribute("ng-click") ||
    element.hasAttribute("@click");

  // Check for pointer cursor style
  const style = window.getComputedStyle(element);
  if (style.cursor === "pointer") return true;

  return hasOnClick;
}

/**
 * Recursively process a DOM node and its children
 */
function processDOMNode(node: Element): DOMNode {
  const nodeInfo: DOMNode = {
    tag: node.tagName.toLowerCase(),
    isInteractive: isInteractiveElement(node),
    xpath: getElementXPath(node),
  };

  // Extract ID if present
  if (node.id) nodeInfo.id = node.id;

  // Extract classes if present
  if (node.className && typeof node.className === "string") {
    nodeInfo.classes = node.className.split(" ").filter((c) => c.trim() !== "");
  }

  // Extract text content (if it's a text node or has direct text)
  const textContent = Array.from(node.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent?.trim())
    .filter((text) => text && text.length > 0)
    .join(" ");

  if (textContent) nodeInfo.text = textContent;

  // Extract attributes
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(node.attributes)) {
    attributes[attr.name] = attr.value;
  }

  if (Object.keys(attributes).length > 0) {
    nodeInfo.attributes = attributes;
  }

  // Extract aria-label for accessibility
  const ariaLabel = node.getAttribute("aria-label");
  if (ariaLabel) nodeInfo.ariaLabel = ariaLabel;

  // Extract role for accessibility
  const role = node.getAttribute("role");
  if (role) nodeInfo.role = role;

  // Process children recursively
  if (node.children.length > 0) {
    nodeInfo.children = Array.from(node.children).map((child) =>
      processDOMNode(child)
    );
  }

  return nodeInfo;
}

/**
 * Captures the current state of the DOM
 */
export function captureDOMSnapshot(): DOMSnapshot {
  const documentElement = document.documentElement;

  return {
    timestamp: Date.now(),
    url: window.location.href,
    title: document.title,
    nodes: processDOMNode(documentElement),
  };
}

/**
 * Save DOM snapshot to a file
 */
export function saveDOMSnapshot(snapshot: DOMSnapshot): void {
  const jsonString = JSON.stringify(snapshot, null, 2);

  // In extension context, you would send this to background script
  // For now, we'll just save it to localStorage for debugging
  localStorage.setItem(`domSnapshot_${snapshot.timestamp}`, jsonString);

  // In a real implementation, you would send this to your server or store it
  console.log("DOM Snapshot captured:", snapshot);
}
