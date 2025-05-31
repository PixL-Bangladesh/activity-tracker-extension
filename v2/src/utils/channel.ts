import mitt from "mitt";
import Browser, { type Runtime } from "webextension-polyfill";

export type Message = EventType | ServiceType;
export type EventType = {
  type: "event";
  event: string;
  detail: unknown;
};
export type ServiceType = {
  type: "service";
  service: string;
  params: unknown;
};

/**
 * Channel for inter-context communication.
 */
class Channel {
  private services = new Map<
    string,
    (params: unknown, sender: Runtime.MessageSender) => Promise<unknown>
  >();
  private emitter = mitt();

  constructor() {
    Browser.runtime.onMessage.addListener(
      ((message: string, sender: Runtime.MessageSender) => {
        const parsed = JSON.parse(message) as Message | null | undefined;
        if (!parsed || !parsed.type) {
          console.error(`Bad message: ${message}`);
          return;
        }
        switch (parsed.type) {
          case "event":
            this.emitter.emit(parsed.event, { detail: parsed.detail, sender });
            break;
          case "service": {
            const server = this.services.get(parsed.service);
            if (!server) break;
            return server(parsed.params, sender);
          }
          default:
            console.error(
              `Unknown message type: ${(parsed as { type: string }).type}`
            );
            break;
        }
        return;
      }).bind(this)
    );
  }

  public provide(
    serviceName: string,
    serveFunction: (
      params: unknown,
      sender: Runtime.MessageSender
    ) => Promise<unknown>
  ): () => void {
    this.services.set(serviceName, serveFunction);
    return () => {
      this.services.delete(serviceName);
    };
  }

  public request(
    serviceName: string,
    params: Record<string, unknown> | unknown
  ) {
    const message = JSON.stringify({
      type: "service",
      service: serviceName,
      params,
    });
    return Browser.runtime.sendMessage(message);
  }

  public requestToTab(
    tabId: number,
    serviceName: string,
    params: Record<string, unknown> | unknown
  ) {
    if (!Browser.tabs || !Browser.tabs.sendMessage)
      return Promise.reject("Can not send message to tabs in current context!");
    const message = JSON.stringify({
      type: "service",
      service: serviceName,
      params,
    });
    return Browser.tabs.sendMessage(tabId, message);
  }

  /**
   * Add an event handler.
   * @returns a function to remove the handler
   */
  public on(
    event: string,
    handler: (detail: unknown, sender: Runtime.MessageSender) => unknown
  ): () => void {
    const emitHandler = ((data: {
      detail: unknown;
      sender: Runtime.MessageSender;
    }) => {
      handler(data.detail, data.sender);
    }) as (data: unknown) => unknown;

    this.emitter.on(event, emitHandler);

    // Return cleanup function
    return () => {
      this.emitter.off(event, emitHandler);
    };
  }

  public emit(event: string, detail: unknown) {
    const message = JSON.stringify({ type: "event", event, detail });
    return Browser.runtime.sendMessage(message);
  }

  public emitToTabs(tabIds: number | number[], event: string, detail: unknown) {
    if (!Browser.tabs || !Browser.tabs.sendMessage)
      return Promise.reject("Can not send message to tabs in current context!");

    if (typeof tabIds === "number") {
      tabIds = [tabIds];
    }

    const message = JSON.stringify({ type: "event", event, detail });
    tabIds.forEach((tabId) => void Browser.tabs.sendMessage(tabId, message));
  }

  public async getCurrentTabId() {
    const tabs = await Browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tabs[0].id || -1;
  }
}

export default Channel;
