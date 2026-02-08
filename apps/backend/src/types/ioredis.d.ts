declare module 'ioredis' {
  export default class Redis {
    constructor(url?: string);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, expiryMode?: string, time?: number): Promise<string>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    del(key: string): Promise<number>;
  }
}
