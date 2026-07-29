import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

/**
 * Mock Transport for testing MCP Servers without a real network connection.
 *
 * Provides helpers to send JSON-RPC requests and collect responses,
 * enabling full MCP protocol integration tests in unit test environments.
 */
export class MockTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  private _messages: JSONRPCMessage[] = [];

  async start(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    this._messages.push(message);
  }

  async close(): Promise<void> {
    this.onclose?.();
  }

  get messages() {
    return this._messages;
  }

  /**
   * Simulate an incoming JSON-RPC request and wait for the corresponding response.
   */
  async sendRequest(request: JSONRPCMessage): Promise<JSONRPCMessage> {
    const p = new Promise<JSONRPCMessage>((resolve) => {
      const originalSend = this.send.bind(this);
      this.send = async (msg) => {
        await originalSend(msg);
        if ("id" in msg && (msg as { id?: unknown }).id === (request as { id?: unknown }).id) {
          resolve(msg);
        }
      };
    });

    this.onmessage?.(request);
    return p;
  }
}

/**
 * Type-safe helper to extract tool list from a JSON-RPC response.
 */
export function extractToolList(response: JSONRPCMessage): Array<{ name: string; description: string }> {
  if ("result" in response) {
    const result = response.result as { tools: Array<{ name: string; description: string }> };
    return result.tools;
  }
  throw new Error("Response has no result field");
}

/**
 * Type-safe helper to extract content text from a tools/call JSON-RPC response.
 */
export function extractContentText(response: JSONRPCMessage): string {
  if ("result" in response) {
    const result = response.result as { content: Array<{ text: string }>; isError?: boolean };
    return result.content[0]?.text ?? "";
  }
  if ("error" in response) {
    const error = response.error as { message: string };
    throw new Error(`JSON-RPC error: ${error.message}`);
  }
  throw new Error("Response has neither result nor error");
}

/**
 * Type-safe helper to check if a tools/call response is an error.
 */
export function isErrorResponse(response: JSONRPCMessage): boolean {
  if ("error" in response) return true;
  if ("result" in response) {
    const result = response.result as { isError?: boolean };
    return result.isError === true;
  }
  return false;
}
