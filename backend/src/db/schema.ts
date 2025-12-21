import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const db = new Database(join(__dirname, '../../shipster.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Artifact: ONE active at a time, immutable ship date, FORCE v1
  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    ship_date INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'locked', 'shipped', 'archived')),
    shipped_at INTEGER,
    version INTEGER NOT NULL DEFAULT 1,

    -- FORCE v1: Immutable Definition of Done (max 5 bullets)
    done_criteria TEXT NOT NULL,

    -- FORCE v1: External recipient (person, repo, URL, inbox)
    external_recipient TEXT NOT NULL,

    -- FORCE v1: Scope Lock limits (enforced at compile time)
    max_word_count INTEGER NOT NULL,
    current_word_count INTEGER NOT NULL DEFAULT 0,

    -- FORCE v1: Edit lock after done criteria met
    done_criteria_met INTEGER NOT NULL DEFAULT 0,
    edit_locked INTEGER NOT NULL DEFAULT 0,

    -- FORCE v1: External Reality Gate
    shipping_proof_url TEXT,
    shipping_proof_submitted INTEGER NOT NULL DEFAULT 0
  );

  -- Block: 30-min execution units with diff tracking
  CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    expected_diff_type TEXT NOT NULL CHECK(expected_diff_type IN ('paragraph', 'section', 'slide', 'figure', 'commit')),
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    content_before TEXT NOT NULL,
    content_after TEXT,
    has_diff INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed')),
    FOREIGN KEY(artifact_id) REFERENCES artifacts(id)
  );

  -- Reliability Score: tracks predictability only
  CREATE TABLE IF NOT EXISTS reliability_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start INTEGER NOT NULL,
    blocks_scheduled INTEGER NOT NULL DEFAULT 0,
    blocks_completed INTEGER NOT NULL DEFAULT 0,
    blocks_with_diff INTEGER NOT NULL DEFAULT 0,
    artifacts_shipped_on_time INTEGER NOT NULL DEFAULT 0,
    artifacts_failed INTEGER NOT NULL DEFAULT 0,
    reliability_score REAL NOT NULL DEFAULT 0
  );

  -- FORCE v1: Skipped blocks log (permanent, public to self)
  CREATE TABLE IF NOT EXISTS skipped_blocks (
    id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    scheduled_time INTEGER NOT NULL,
    skipped_at INTEGER NOT NULL,
    reason TEXT,
    FOREIGN KEY(artifact_id) REFERENCES artifacts(id)
  );

  -- FORCE v1: Post-Ship Autopsy (5 yes/no questions)
  CREATE TABLE IF NOT EXISTS autopsies (
    id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    shipped_on_time INTEGER NOT NULL,
    scope_respected INTEGER NOT NULL,
    external_feedback_received INTEGER NOT NULL,
    one_clear_takeaway INTEGER NOT NULL,
    repeat_artifact_class INTEGER NOT NULL,
    FOREIGN KEY(artifact_id) REFERENCES artifacts(id)
  );

  -- Checkpoints: Day 3-4 gate enforcement
  CREATE TABLE IF NOT EXISTS checkpoints (
    id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    checkpoint_date INTEGER NOT NULL,
    required_completion_pct REAL NOT NULL,
    actual_completion_pct REAL,
    passed INTEGER DEFAULT 0,
    scope_reduction_applied INTEGER DEFAULT 0,
    FOREIGN KEY(artifact_id) REFERENCES artifacts(id)
  );

  -- Scope History: tracks throttling events
  CREATE TABLE IF NOT EXISTS scope_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artifact_id TEXT NOT NULL,
    original_scope TEXT NOT NULL,
    reduced_scope TEXT NOT NULL,
    reduction_reason TEXT NOT NULL,
    applied_at INTEGER NOT NULL,
    FOREIGN KEY(artifact_id) REFERENCES artifacts(id)
  );
`);

export interface Artifact {
  id: string;
  name: string;
  type: string;
  content: string;
  ship_date: number;
  created_at: number;
  status: 'active' | 'locked' | 'shipped' | 'archived';
  shipped_at: number | null;
  version: number;
  done_criteria: string;
  external_recipient: string;
  max_word_count: number;
  current_word_count: number;
  done_criteria_met: number;
  edit_locked: number;
  shipping_proof_url: string | null;
  shipping_proof_submitted: number;
}

export interface Autopsy {
  id: string;
  artifact_id: string;
  created_at: number;
  shipped_on_time: number;
  scope_respected: number;
  external_feedback_received: number;
  one_clear_takeaway: number;
  repeat_artifact_class: number;
}

export interface Block {
  id: string;
  artifact_id: string;
  expected_diff_type: 'paragraph' | 'section' | 'slide' | 'figure' | 'commit';
  start_time: number;
  end_time: number | null;
  content_before: string;
  content_after: string | null;
  has_diff: number;
  status: 'running' | 'completed' | 'failed';
}

export interface ReliabilityMetrics {
  id: number;
  week_start: number;
  blocks_scheduled: number;
  blocks_completed: number;
  blocks_with_diff: number;
  artifacts_shipped_on_time: number;
  artifacts_failed: number;
  reliability_score: number;
}

export interface Checkpoint {
  id: string;
  artifact_id: string;
  checkpoint_date: number;
  required_completion_pct: number;
  actual_completion_pct: number | null;
  passed: number;
  scope_reduction_applied: number;
}
