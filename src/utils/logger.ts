const ts = () => new Date().toISOString();
export const logger = {
  info:  (...a: unknown[]) => console.log(`[INFO]  ${ts()}`, ...a),
  warn:  (...a: unknown[]) => console.warn(`[WARN]  ${ts()}`, ...a),
  error: (...a: unknown[]) => console.error(`[ERROR] ${ts()}`, ...a),
  debug: (...a: unknown[]) => console.debug(`[DEBUG] ${ts()}`, ...a)
};
