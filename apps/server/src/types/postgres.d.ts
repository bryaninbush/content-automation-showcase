declare module "postgres" {
  export interface Sql {
    <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
    unsafe<T = unknown>(query: string): Promise<T>;
    json(value: unknown): unknown;
    end(): Promise<void>;
  }

  export default function postgres(url: string, options?: { max?: number }): Sql;
}
