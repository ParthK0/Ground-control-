// Reads backend URL from environment variables per STACK.md and user requirements.
// Do not hardcode any server URLs directly in code.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
