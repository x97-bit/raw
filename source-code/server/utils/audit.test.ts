import { describe, expect, it } from 'vitest';
import { buildAuditChanges, writeAuditLog } from './audit';

describe('buildAuditChanges', () => {
  it('captures only changed keys', () => {
    const result = buildAuditChanges(
      { id: 10, amountUSD: '100', notes: 'old', unchanged: 'same' },
      { id: 10, amountUSD: '125', notes: 'new', unchanged: 'same' },
    );

    expect(result.beforeData).toEqual({
      id: 10,
      amountUSD: '100',
      notes: 'old',
      unchanged: 'same',
    });
    expect(result.afterData).toEqual({
      id: 10,
      amountUSD: '125',
      notes: 'new',
      unchanged: 'same',
    });
    expect(result.changes).toEqual({
      amountUSD: { before: '100', after: '125' },
      notes: { before: 'old', after: 'new' },
    });
  });

  it('redacts password fields and normalizes undefined to null', () => {
    const result = buildAuditChanges(
      { username: 'admin', password: 'secret', notes: undefined },
      { username: 'admin', password: 'secret-2', notes: 'saved' },
    );

    expect(result.beforeData).toEqual({
      username: 'admin',
      password: '[REDACTED]',
      notes: null,
    });
    expect(result.afterData).toEqual({
      username: 'admin',
      password: '[REDACTED]',
      notes: 'saved',
    });
    expect(result.changes).toEqual({
      notes: { before: null, after: 'saved' },
    });
  });

  it('skips empty update audit records', async () => {
    const insertCalls: any[] = [];
    const db = {
      insert() {
        return {
          values(payload: unknown) {
            insertCalls.push(payload);
            return Promise.resolve();
          },
        };
      },
    };

    await writeAuditLog(db, {
      entityType: 'field_config',
      entityId: 1,
      action: 'update',
      summary: 'no-op',
      before: { visible: 1, sortOrder: 2 },
      after: { visible: 1, sortOrder: 2 },
      appUser: { id: 1, username: 'admin' },
    });

    expect(insertCalls).toHaveLength(0);
  });
});
