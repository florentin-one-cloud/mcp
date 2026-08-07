/**
 * MCP 2026-07-28 Protocol Error Codes.
 *
 * Standard JSON-RPC error codes for the Model Context Protocol.
 * These codes are returned in the `error.code` field of JSON-RPC error responses.
 */
export const MCP_ERROR_CODES = {
  /** Header sent by the client does not match the expected format or values */
  HEADER_MISMATCH: -32020,
  /** Client is missing a capability required by the server's operation */
  MISSING_REQUIRED_CLIENT_CAPABILITY: -32021,
  /** Protocol version requested by the client is not supported by the server */
  UNSUPPORTED_PROTOCOL_VERSION: -32022
} as const;

/** The MCP protocol version implemented by this factory */
export const MCP_PROTOCOL_VERSION = "2026-07-28";
