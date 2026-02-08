declare module 'jwt' {
  export function decode(token: string): any;
  export function verify(token: string, secret: string): any;
}
