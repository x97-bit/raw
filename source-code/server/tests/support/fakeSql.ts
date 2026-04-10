type SqlChunk = {
  encoder?: { name?: string };
  name?: string;
  queryChunks?: SqlChunk[];
  value?: unknown;
};

type EqualityFilter = {
  column: string;
  value: unknown;
};

export function getDrizzleTableName(table: unknown) {
  if (!table || typeof table !== "object") {
    return null;
  }

  for (const symbol of Object.getOwnPropertySymbols(table)) {
    if (String(symbol) === "Symbol(drizzle:Name)") {
      const value = (table as Record<symbol, unknown>)[symbol];
      return typeof value === "string" ? value : null;
    }
  }

  return null;
}

function visitSqlChunks(chunks: SqlChunk[] | undefined, filters: EqualityFilter[]) {
  if (!Array.isArray(chunks)) return;

  let currentColumn: string | null = null;
  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== "object") continue;

    if (chunk.queryChunks) {
      visitSqlChunks(chunk.queryChunks, filters);
      continue;
    }

    if (typeof chunk.name === "string") {
      currentColumn = chunk.name;
      continue;
    }

    const encoderName = chunk.encoder?.name;
    if (currentColumn && encoderName === currentColumn && Object.prototype.hasOwnProperty.call(chunk, "value")) {
      filters.push({
        column: currentColumn,
        value: chunk.value,
      });
      currentColumn = null;
    }
  }
}

export function extractEqualityFilters(condition: { queryChunks?: SqlChunk[] } | undefined | null) {
  const filters: EqualityFilter[] = [];
  visitSqlChunks(condition?.queryChunks, filters);
  return filters;
}

export function filterRowsByCondition<T extends Record<string, unknown>>(
  rows: T[],
  condition: { queryChunks?: SqlChunk[] } | undefined | null,
) {
  const filters = extractEqualityFilters(condition);
  if (filters.length === 0) {
    return [...rows];
  }

  return rows.filter((row) =>
    filters.every((filter) => row[filter.column] === filter.value),
  );
}

export function createQueryResult<T extends Record<string, unknown>>(rows: T[]) {
  return {
    where(condition: { queryChunks?: SqlChunk[] } | undefined | null) {
      return createQueryResult(filterRowsByCondition(rows, condition));
    },
    orderBy() {
      return createQueryResult(
        [...rows].sort((left, right) => {
          if (typeof left.name === "string" && typeof right.name === "string") {
            return left.name.localeCompare(right.name);
          }

          const leftScore = Number(left.id ?? 0);
          const rightScore = Number(right.id ?? 0);
          return rightScore - leftScore;
        }),
      );
    },
    limit(count: number) {
      return Promise.resolve(rows.slice(0, count));
    },
    offset(count: number) {
      return createQueryResult(rows.slice(count));
    },
    then<TResult1 = T[], TResult2 = never>(
      onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve(rows).then(onfulfilled, onrejected);
    },
  };
}
