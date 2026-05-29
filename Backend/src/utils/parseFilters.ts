import type { ParsedQs } from "qs";

export function parseFilters(query: ParsedQs) {
  return {
    country:    query.country    as string | undefined,
    department: query.department as string | undefined,
    jobTitle:   query.jobTitle   as string | undefined,
    search:     query.search     as string | undefined,
    page:     query.page     ? parseInt(query.page     as string, 10) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize as string, 10) : undefined,
  };
}
