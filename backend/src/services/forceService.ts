import { db, Artifact, Autopsy } from '../db/schema.js';
import { nanoid } from 'nanoid';

const MAX_SHIP_DAYS = 7;
const MAX_DONE_CRITERIA = 5;

interface CreateArtifactInput {
  name: string;
  type: string;
  shipDays: number;
  doneCriteria: string[];  // Max 5 bullets
  externalRecipient: string;
  maxWordCount: number;
}

export class ForceService {
  // ENFORCEMENT: Exactly ONE active artifact at any time
  static getActiveArtifact(): Artifact | null {
    const stmt = db.prepare('SELECT * FROM artifacts WHERE status = ? LIMIT 1');
    return stmt.get('active') as Artifact | null;
  }

  // FORCE v1: Create artifact with immutable scope lock
  static createArtifact(input: CreateArtifactInput): Artifact {
    const active = this.getActiveArtifact();
    if (active) {
      // Auto-archive the old one
      const archiveStmt = db.prepare('UPDATE artifacts SET status = ? WHERE id = ?');
      archiveStmt.run('archived', active.id);
    }

    if (input.shipDays > MAX_SHIP_DAYS) {
      throw new Error(`BLOCKED: Ship date cannot exceed ${MAX_SHIP_DAYS} days.`);
    }

    if (input.doneCriteria.length > MAX_DONE_CRITERIA) {
      throw new Error(`BLOCKED: Definition of Done cannot exceed ${MAX_DONE_CRITERIA} bullets.`);
    }

    const now = Date.now();
    const shipDate = now + (input.shipDays * 24 * 60 * 60 * 1000);

    const artifact: Artifact = {
      id: nanoid(),
      name: input.name,
      type: input.type,
      content: '',
      ship_date: shipDate,
      created_at: now,
      status: 'active',
      shipped_at: null,
      version: 1,
      done_criteria: JSON.stringify(input.doneCriteria),
      external_recipient: input.externalRecipient,
      max_word_count: input.maxWordCount,
      current_word_count: 0,
      done_criteria_met: 0,
      edit_locked: 0,
      shipping_proof_url: null,
      shipping_proof_submitted: 0,
    };

    const stmt = db.prepare(`
      INSERT INTO artifacts (
        id, name, type, content, ship_date, created_at, status, version,
        done_criteria, external_recipient, max_word_count, current_word_count,
        done_criteria_met, edit_locked, shipping_proof_submitted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      artifact.id, artifact.name, artifact.type, artifact.content,
      artifact.ship_date, artifact.created_at, artifact.status, artifact.version,
      artifact.done_criteria, artifact.external_recipient,
      artifact.max_word_count, artifact.current_word_count,
      artifact.done_criteria_met, artifact.edit_locked, artifact.shipping_proof_submitted
    );

    return artifact;
  }

  // SCOPE LOCK COMPILER: Enforce max word count
  static updateContent(artifactId: string, content: string): void {
    const artifact = this.getActiveArtifact();
    if (!artifact || artifact.id !== artifactId) {
      throw new Error('BLOCKED: Can only update active artifact.');
    }

    // EDIT LOCK: After done criteria met, no edits allowed
    if (artifact.edit_locked) {
      throw new Error('BLOCKED: Edit lock active. Artifact is done. Ship or archive only.');
    }

    // SCOPE LOCK: Count words
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount > artifact.max_word_count) {
      throw new Error(
        `BLOCKED: Scope lock exceeded. Max ${artifact.max_word_count} words. Current: ${wordCount}. Delete content to proceed.`
      );
    }

    const stmt = db.prepare('UPDATE artifacts SET content = ?, current_word_count = ? WHERE id = ?');
    stmt.run(content, wordCount, artifactId);
  }

  // Mark done criteria as met → triggers edit lock
  static markDoneCriteriaMet(artifactId: string): void {
    const artifact = this.getActiveArtifact();
    if (!artifact || artifact.id !== artifactId) {
      throw new Error('BLOCKED: Can only update active artifact.');
    }

    const stmt = db.prepare(`
      UPDATE artifacts
      SET done_criteria_met = 1, edit_locked = 1, status = 'locked'
      WHERE id = ?
    `);
    stmt.run(artifactId);
  }

  // EXTERNAL REALITY GATE: Submit shipping proof
  static submitShippingProof(artifactId: string, proofUrl: string): void {
    const stmt = db.prepare(`
      UPDATE artifacts
      SET shipping_proof_url = ?, shipping_proof_submitted = 1
      WHERE id = ?
    `);
    stmt.run(proofUrl, artifactId);
  }

  // Ship artifact (requires external reality gate proof)
  static shipArtifact(artifactId: string): Artifact {
    const stmt = db.prepare('SELECT * FROM artifacts WHERE id = ?');
    const artifact = stmt.get(artifactId) as Artifact;

    if (!artifact) {
      throw new Error('Artifact not found.');
    }

    if (!artifact.shipping_proof_submitted) {
      throw new Error(
        'BLOCKED: External Reality Gate not passed. Submit proof of external shipping (URL, screenshot, email confirmation).'
      );
    }

    const now = Date.now();
    const isOnTime = now <= artifact.ship_date;

    const updateStmt = db.prepare(`
      UPDATE artifacts
      SET status = 'shipped', shipped_at = ?
      WHERE id = ?
    `);
    updateStmt.run(now, artifactId);

    return { ...artifact, status: 'shipped', shipped_at: now };
  }

  // POST-SHIP AUTOPSY: 5 yes/no questions
  static createAutopsy(
    artifactId: string,
    answers: {
      shippedOnTime: boolean;
      scopeRespected: boolean;
      externalFeedbackReceived: boolean;
      oneClearTakeaway: boolean;
      repeatArtifactClass: boolean;
    }
  ): Autopsy {
    const autopsy: Autopsy = {
      id: nanoid(),
      artifact_id: artifactId,
      created_at: Date.now(),
      shipped_on_time: answers.shippedOnTime ? 1 : 0,
      scope_respected: answers.scopeRespected ? 1 : 0,
      external_feedback_received: answers.externalFeedbackReceived ? 1 : 0,
      one_clear_takeaway: answers.oneClearTakeaway ? 1 : 0,
      repeat_artifact_class: answers.repeatArtifactClass ? 1 : 0,
    };

    const stmt = db.prepare(`
      INSERT INTO autopsies (
        id, artifact_id, created_at, shipped_on_time, scope_respected,
        external_feedback_received, one_clear_takeaway, repeat_artifact_class
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      autopsy.id, autopsy.artifact_id, autopsy.created_at,
      autopsy.shipped_on_time, autopsy.scope_respected,
      autopsy.external_feedback_received, autopsy.one_clear_takeaway,
      autopsy.repeat_artifact_class
    );

    return autopsy;
  }

  // Log skipped block (permanent, visible)
  static logSkippedBlock(artifactId: string, scheduledTime: number, reason?: string): void {
    const stmt = db.prepare(`
      INSERT INTO skipped_blocks (id, artifact_id, scheduled_time, skipped_at, reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(nanoid(), artifactId, scheduledTime, Date.now(), reason || 'No reason provided');
  }

  // Get skipped blocks (permanent failure log)
  static getSkippedBlocks(artifactId?: string): any[] {
    if (artifactId) {
      const stmt = db.prepare('SELECT * FROM skipped_blocks WHERE artifact_id = ? ORDER BY skipped_at DESC');
      return stmt.all(artifactId);
    }
    const stmt = db.prepare('SELECT * FROM skipped_blocks ORDER BY skipped_at DESC');
    return stmt.all();
  }

  // Get all artifacts (including archived)
  static getAllArtifacts(): Artifact[] {
    const stmt = db.prepare('SELECT * FROM artifacts ORDER BY created_at DESC');
    return stmt.all() as Artifact[];
  }

  // Get autopsies
  static getAutopsies(artifactId?: string): Autopsy[] {
    if (artifactId) {
      const stmt = db.prepare('SELECT * FROM autopsies WHERE artifact_id = ? ORDER BY created_at DESC');
      return stmt.all(artifactId) as Autopsy[];
    }
    const stmt = db.prepare('SELECT * FROM autopsies ORDER BY created_at DESC');
    return stmt.all() as Autopsy[];
  }
}
