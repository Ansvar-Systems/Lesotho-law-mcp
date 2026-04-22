/**
 * Response metadata utilities for Lesotho Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'Lesotho Legal Information Institute (lesotholii.org) — AfricanLII / Laws.Africa',
    jurisdiction: 'LS',
    disclaimer:
      'This data is sourced from the Lesotho Legal Information Institute (LesLII) under Government Open Data principles. ' +
      'The authoritative versions are in English. ' +
      'Always verify with the official LesLII portal (lesotholii.org).',
    freshness,
  };
}
