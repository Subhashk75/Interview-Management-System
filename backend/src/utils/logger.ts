export const logger = {
  info: (msg: string, ...meta: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[32m[${timestamp}] [INFO] [IMS]:\x1b[0m ${msg}`, ...meta);
  },
  warn: (msg: string, ...meta: any[]) => {
    const timestamp = new Date().toISOString();
    console.warn(`\x1b[33m[${timestamp}] [WARN] [IMS]:\x1b[0m ${msg}`, ...meta);
  },
  error: (msg: string, ...meta: any[]) => {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m[${timestamp}] [ERROR] [IMS]:\x1b[0m ${msg}`, ...meta);
  },
  debug: (msg: string, ...meta: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.debug(`\x1b[36m[${timestamp}] [DEBUG] [IMS]:\x1b[0m ${msg}`, ...meta);
    }
  },
};
