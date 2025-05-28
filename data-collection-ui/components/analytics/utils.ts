// Helper function to truncate URLs
export const truncateUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const path =
      urlObj.pathname.length > 20
        ? `${urlObj.pathname.substring(0, 17)}...`
        : urlObj.pathname;
    return `${urlObj.hostname}${path}`;
  } catch (e) {
    return url.length > 30 ? `${url.substring(0, 27)}...` : url;
  }
};

// Helper function to truncate strings
export const truncateString = (str: string, maxLength: number): string => {
  return str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str;
};

// Extract page name from URL
export const extractPageFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Extract the last part of the path
    const parts = path.split("/").filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      // Remove file extension if present
      return lastPart.replace(/\.[^/.]+$/, "") || urlObj.hostname;
    }

    return urlObj.hostname;
  } catch (e) {
    // If URL parsing fails, just return the original
    return url;
  }
};

// Get a more meaningful description for network requests
export const getNetworkDescription = (data: any): string => {
  try {
    const method = data.method || "REQUEST";
    const url = data.url || "";
    const status = typeof data.status === "number" ? data.status : "pending";

    // Try to determine the purpose of the request
    let purpose = "";
    if (url.includes("/api/") || url.includes("/graphql")) {
      purpose = "API call";
    } else if (url.endsWith(".json")) {
      purpose = "JSON data fetch";
    } else if (url.endsWith(".js")) {
      purpose = "JavaScript resource";
    } else if (url.endsWith(".css")) {
      purpose = "CSS resource";
    } else if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
      purpose = "Image resource";
    }

    // Construct a meaningful description
    let description = `${method} ${truncateUrl(url)}`;
    if (purpose) {
      description += ` (${purpose})`;
    }
    if (status !== "pending") {
      description += ` - Status: ${status}`;
    }

    return description;
  } catch (e) {
    return `${data.method || "REQUEST"} ${truncateUrl(data.url || "")}`;
  }
};

// Get a more meaningful description for mouse clicks
export const getClickDescription = (data: any): string => {
  try {
    const target = data.target || "element";
    const x = data.x || 0;
    const y = data.y || 0;

    // Check if the target has semantic meaning
    const meaningfulTarget = target;
    const parentInfo = data.parentElement || "";
    const hrefInfo = data.href || "";

    // Check for parent button or anchor
    if (parentInfo.includes("button")) {
      return `Clicked a button (${parentInfo}) at (${x}, ${y})`;
    }
    if (parentInfo.includes("a")) {
      const linkText = hrefInfo ? ` (${hrefInfo})` : "";
      return `Clicked a link${linkText} at (${x}, ${y})`;
    }

    // Check for common interactive elements
    if (target.toLowerCase() === "button" || target.includes("btn")) {
      return `Clicked a button at (${x}, ${y})`;
    }
    if (target.toLowerCase() === "a") {
      const linkText = hrefInfo ? ` (${hrefInfo})` : "";
      return `Clicked a link${linkText} at (${x}, ${y})`;
    }
    if (target.toLowerCase() === "input") {
      const inputType = data.inputType || "text";
      return `Clicked an ${inputType} input at (${x}, ${y})`;
    }
    if (target.toLowerCase() === "select") {
      return `Clicked a dropdown at (${x}, ${y})`;
    }
    if (target.toLowerCase() === "label") {
      return `Clicked a form label at (${x}, ${y})`;
    }
    if (target.toLowerCase() === "img") {
      return `Clicked an image at (${x}, ${y})`;
    }
    if (target.toLowerCase() === "svg") {
      return `Clicked an icon at (${x}, ${y})`;
    }
    if (target.toLowerCase() === "span" || target.toLowerCase() === "div") {
      return `Clicked an interface element at (${x}, ${y})`;
    }

    return `Clicked on ${meaningfulTarget} at (${x}, ${y})`;
  } catch (e) {
    return `Clicked at (${data.x || 0}, ${data.y || 0})`;
  }
};

// Get a more meaningful description for keypresses
export const getKeypressDescription = (data: any): string => {
  try {
    const key = data.key || "";
    const target = data.target || "element";
    const inputValue = data.inputValue || "";

    // Check for special keys
    if (key === "Enter") {
      if (target.toLowerCase() === "input") {
        const valueInfo = inputValue
          ? ` (entered: "${truncateString(inputValue, 30)}")`
          : "";
        return `Pressed Enter to submit input${valueInfo}`;
      }
      if (target.toLowerCase() === "textarea") {
        return "Pressed Enter for new line in textarea";
      }
      return "Pressed Enter to confirm action";
    }
    if (key === "Escape") {
      return "Pressed Escape to cancel";
    }
    if (key === "Tab") {
      return "Pressed Tab to navigate";
    }
    if (key === "Backspace") {
      return "Pressed Backspace to delete";
    }
    if (key === "Delete") {
      return "Pressed Delete to remove content";
    }
    if (
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "ArrowLeft" ||
      key === "ArrowRight"
    ) {
      return `Pressed ${key} to navigate`;
    }

    // For regular typing
    if (
      target.toLowerCase() === "input" ||
      target.toLowerCase() === "textarea"
    ) {
      const valueInfo = inputValue
        ? ` (content: "${truncateString(inputValue, 30)}")`
        : "";
      return `Typed in a ${target.toLowerCase()}${valueInfo}`;
    }

    return `Pressed ${data.key || ""} key`;
  } catch (e) {
    return `Pressed ${data.key || ""} key`;
  }
};

// Estimate time spent on an element
export const estimateTimeSpent = (element: string, events: any[]): number => {
  let totalTime = 0;
  let lastInteractionTime = 0;

  // biome-ignore lint/complexity/noForEach: <explanation>
  events.forEach((event) => {
    const target =
      event.type === "mouseClick" || event.type === "keypress"
        ? event.details.target
        : null;

    if (target === element) {
      if (lastInteractionTime > 0) {
        // If this is not the first interaction with this element
        const timeDiff = event.timestamp - lastInteractionTime;
        // Only count if less than 30 seconds (to avoid counting time when user left the page)
        if (timeDiff < 30000) {
          totalTime += timeDiff;
        }
      }
      lastInteractionTime = event.timestamp;
    }
  });

  return totalTime;
};

// Define colors for charts
export const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
