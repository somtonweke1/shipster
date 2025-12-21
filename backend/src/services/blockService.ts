import { db, Block } from '../db/schema.js';
import { nanoid } from 'nanoid';

const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

type DiffType = 'paragraph' | 'section' | 'slide' | 'figure' | 'commit';

export class BlockService {
  // Start a new 30-minute block
  static startBlock(artifactId: string, expectedDiffType: DiffType, contentBefore: string): Block {
    // Check for existing running block
    const existingStmt = db.prepare('SELECT * FROM blocks WHERE artifact_id = ? AND status = ? LIMIT 1');
    const existing = existingStmt.get(artifactId, 'running') as Block | null;

    if (existing) {
      throw new Error('BLOCKED: A block is already running. Complete it first.');
    }

    const block: Block = {
      id: nanoid(),
      artifact_id: artifactId,
      expected_diff_type: expectedDiffType,
      start_time: Date.now(),
      end_time: null,
      content_before: contentBefore,
      content_after: null,
      has_diff: 0,
      status: 'running',
    };

    const stmt = db.prepare(`
      INSERT INTO blocks (id, artifact_id, expected_diff_type, start_time, content_before, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(block.id, block.artifact_id, block.expected_diff_type, block.start_time, block.content_before, block.status);

    // Update reliability metrics
    this.updateBlockCount(1, 0, 0);

    return block;
  }

  // ENFORCEMENT: Block ends, diff is checked
  static endBlock(blockId: string, contentAfter: string): Block {
    const stmt = db.prepare('SELECT * FROM blocks WHERE id = ?');
    const block = stmt.get(blockId) as Block | null;

    if (!block) {
      throw new Error('Block not found');
    }

    if (block.status !== 'running') {
      throw new Error('Block is not running');
    }

    const now = Date.now();
    const hasDiff = this.detectDiff(block.content_before, contentAfter);
    const status = hasDiff ? 'completed' : 'failed';

    const updateStmt = db.prepare(`
      UPDATE blocks
      SET end_time = ?, content_after = ?, has_diff = ?, status = ?
      WHERE id = ?
    `);
    updateStmt.run(now, contentAfter, hasDiff ? 1 : 0, status, blockId);

    // Update reliability metrics
    const completed = status === 'completed' ? 1 : 0;
    const withDiff = hasDiff ? 1 : 0;
    this.updateBlockCount(0, completed, withDiff);

    console.log(`BLOCK ${status.toUpperCase()}: ${block.expected_diff_type} - Diff: ${hasDiff}`);

    return { ...block, end_time: now, content_after: contentAfter, has_diff: hasDiff ? 1 : 0, status };
  }

  // Auto-end block after 30 minutes
  static checkAndAutoEndBlocks(currentContent: string): void {
    const stmt = db.prepare('SELECT * FROM blocks WHERE status = ? AND start_time < ?');
    const cutoff = Date.now() - BLOCK_DURATION_MS;
    const expiredBlocks = stmt.all('running', cutoff) as Block[];

    for (const block of expiredBlocks) {
      console.log(`AUTO-ENDING: Block ${block.id} exceeded 30 minutes`);
      this.endBlock(block.id, currentContent);
    }
  }

  // Diff detection logic
  private static detectDiff(before: string, after: string): boolean {
    if (before === after) return false;

    // Normalize whitespace
    const normBefore = before.trim().replace(/\s+/g, ' ');
    const normAfter = after.trim().replace(/\s+/g, ' ');

    if (normBefore === normAfter) return false;

    // Check for meaningful addition (not just deletions)
    const lengthIncrease = normAfter.length - normBefore.length;
    const minMeaningfulChars = 50; // Minimum 50 characters added

    return lengthIncrease >= minMeaningfulChars;
  }

  static getRunningBlock(): Block | null {
    const stmt = db.prepare('SELECT * FROM blocks WHERE status = ? LIMIT 1');
    return stmt.get('running') as Block | null;
  }

  static getBlockHistory(artifactId: string): Block[] {
    const stmt = db.prepare('SELECT * FROM blocks WHERE artifact_id = ? ORDER BY start_time DESC');
    return stmt.all(artifactId) as Block[];
  }

  static getBlockStats(artifactId: string): any {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN has_diff = 1 THEN 1 ELSE 0 END) as with_diff,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM blocks
      WHERE artifact_id = ?
    `);
    return stmt.get(artifactId);
  }

  private static updateBlockCount(scheduled: number, completed: number, withDiff: number): void {
    const weekStart = this.getWeekStart(Date.now());
    const stmt = db.prepare('SELECT * FROM reliability_metrics WHERE week_start = ?');
    let metrics = stmt.get(weekStart) as any;

    if (!metrics) {
      const insertStmt = db.prepare(`
        INSERT INTO reliability_metrics (week_start, blocks_scheduled, blocks_completed, blocks_with_diff)
        VALUES (?, ?, ?, ?)
      `);
      insertStmt.run(weekStart, scheduled, completed, withDiff);
    } else {
      const updateStmt = db.prepare(`
        UPDATE reliability_metrics
        SET blocks_scheduled = blocks_scheduled + ?,
            blocks_completed = blocks_completed + ?,
            blocks_with_diff = blocks_with_diff + ?
        WHERE week_start = ?
      `);
      updateStmt.run(scheduled, completed, withDiff, weekStart);
    }
  }

  private static getWeekStart(timestamp: number): number {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
  }
}
