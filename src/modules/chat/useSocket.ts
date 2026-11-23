"use client";

/**
 * Re-export the shared socket hook from SocketProvider.
 * One connection per signed-in session; pages only subscribe to events.
 */
export { useSocket } from "./SocketProvider";
