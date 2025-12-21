import React, { useState, useEffect } from 'react';
import { UglyDraftEditor } from './UglyDraftEditor';
import { BlockTimer } from './BlockTimer';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

interface Artifact {
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

interface Block {
  id: string;
  artifact_id: string;
  expected_diff_type: string;
  start_time: number;
  status: string;
}

export const ForceManager: React.FC = () => {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [content, setContent] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAutopsy, setShowAutopsy] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [error, setError] = useState('');

  const [newArtifact, setNewArtifact] = useState({
    name: '',
    type: 'paper',
    shipDays: 7,
    doneCriteria: ['', '', '', '', ''],
    externalRecipient: '',
    maxWordCount: 1000,
  });

  const [autopsyAnswers, setAutopsyAnswers] = useState({
    shippedOnTime: false,
    scopeRespected: false,
    externalFeedbackReceived: false,
    oneClearTakeaway: false,
    repeatArtifactClass: false,
  });

  useEffect(() => {
    fetchActiveArtifact();
    fetchRunningBlock();
    const interval = setInterval(() => {
      fetchActiveArtifact();
      fetchRunningBlock();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveArtifact = async () => {
    const res = await fetch(`${API_BASE}/artifact/active`);
    const data = await res.json();
    if (data && data.id) {
      setArtifact(data);
      setContent(data.content);
    } else {
      setArtifact(null);
    }
  };

  const fetchRunningBlock = async () => {
    const res = await fetch(`${API_BASE}/block/running`);
    const data = await res.json();
    setBlock(data && data.id ? data : null);
  };

  const createArtifact = async () => {
    setError('');
    const filteredDoneCriteria = newArtifact.doneCriteria.filter(c => c.trim() !== '');

    if (filteredDoneCriteria.length === 0) {
      setError('At least one Done Criteria bullet required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/artifact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newArtifact,
          doneCriteria: filteredDoneCriteria,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowCreateForm(false);
      fetchActiveArtifact();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const startBlock = async (diffType: string) => {
    if (!artifact) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/block/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: artifact.id,
          expectedDiffType: diffType,
          contentBefore: content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      fetchRunningBlock();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const endBlock = async () => {
    if (!block) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/block/${block.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentAfter: content }),
      });
      const data = await res.json();
      if (data.status === 'completed') {
        setError('');
      } else {
        setError('BLOCK FAILED: No meaningful diff detected. Failure logged permanently.');
      }
      fetchRunningBlock();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const saveContent = async () => {
    if (!artifact) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/artifact/${artifact.id}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        // Re-fetch to get updated word count
        fetchActiveArtifact();
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const markDone = async () => {
    if (!artifact) return;
    if (!confirm('MARK DONE? This triggers EDIT LOCK. You can only ship or archive after this.')) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/artifact/${artifact.id}/done`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setShowProofForm(true);
      } else {
        setError(data.error);
      }
      fetchActiveArtifact();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const submitProof = async () => {
    if (!artifact) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/artifact/${artifact.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowProofForm(false);
        fetchActiveArtifact();
      } else {
        setError(data.error);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const shipArtifact = async () => {
    if (!artifact) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/artifact/${artifact.id}/ship`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setShowAutopsy(true);
      } else {
        setError(data.error);
      }
      fetchActiveArtifact();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const submitAutopsy = async () => {
    if (!artifact) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/artifact/${artifact.id}/autopsy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autopsyAnswers),
      });
      if (res.ok) {
        setShowAutopsy(false);
        fetchActiveArtifact();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (artifact && !artifact.edit_locked) {
      const interval = setInterval(saveContent, 3000);
      return () => clearInterval(interval);
    }
  }, [content, artifact]);

  const daysUntilShip = artifact
    ? Math.ceil((artifact.ship_date - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const doneCriteriaList = artifact ? JSON.parse(artifact.done_criteria) : [];
  const scopeUsage = artifact ? ((artifact.current_word_count / artifact.max_word_count) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 font-mono">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold">FORCE / v1</h1>
          <p className="text-sm text-gray-500 mt-1">Execution enforcement system. No motivation. Force throughput.</p>
        </header>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-100 text-sm">
            <strong>BLOCKED:</strong> {error}
          </div>
        )}

        {/* No Artifact State */}
        {!artifact && !showCreateForm && (
          <div className="border border-gray-700 p-8 text-center">
            <div className="text-gray-500 mb-4">No active artifact</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-black px-6 py-3 hover:bg-gray-200 transition"
            >
              CREATE ARTIFACT
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="border border-gray-700 p-6 mb-6 bg-gray-900">
            <h2 className="text-lg font-bold mb-4">New Artifact (Scope Lock)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Artifact name</label>
                <input
                  type="text"
                  value={newArtifact.name}
                  onChange={(e) => setNewArtifact({ ...newArtifact, name: e.target.value })}
                  className="w-full p-2 bg-black border border-gray-700 text-white"
                  placeholder="Research paper draft"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newArtifact.type}
                  onChange={(e) => setNewArtifact({ ...newArtifact, type: e.target.value })}
                  className="w-full p-2 bg-black border border-gray-700 text-white"
                >
                  <option value="paper">Paper</option>
                  <option value="deck">Deck</option>
                  <option value="code">Code</option>
                  <option value="application">Application</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Ship deadline (max 7 days)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={newArtifact.shipDays}
                  onChange={(e) => setNewArtifact({ ...newArtifact, shipDays: parseInt(e.target.value) })}
                  className="w-full p-2 bg-black border border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max word count (scope lock)</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={newArtifact.maxWordCount}
                  onChange={(e) => setNewArtifact({ ...newArtifact, maxWordCount: parseInt(e.target.value) })}
                  className="w-full p-2 bg-black border border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">External recipient (person, repo, URL)</label>
                <input
                  type="text"
                  value={newArtifact.externalRecipient}
                  onChange={(e) => setNewArtifact({ ...newArtifact, externalRecipient: e.target.value })}
                  className="w-full p-2 bg-black border border-gray-700 text-white"
                  placeholder="john@example.com or github.com/user/repo"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Definition of Done (max 5 bullets, immutable)</label>
                {newArtifact.doneCriteria.map((criteria, i) => (
                  <input
                    key={i}
                    type="text"
                    value={criteria}
                    onChange={(e) => {
                      const updated = [...newArtifact.doneCriteria];
                      updated[i] = e.target.value;
                      setNewArtifact({ ...newArtifact, doneCriteria: updated });
                    }}
                    className="w-full p-2 bg-black border border-gray-700 text-white mb-2"
                    placeholder={`Bullet ${i + 1}`}
                  />
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={createArtifact}
                  className="bg-white text-black px-6 py-2 hover:bg-gray-200"
                >
                  LOCK & CREATE
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-800 px-6 py-2 hover:bg-gray-700"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Artifact */}
        {artifact && (
          <>
            <div className="border border-gray-700 p-6 mb-6 bg-gray-900">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{artifact.name}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    {artifact.type} | v{artifact.version} | {artifact.status.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Recipient: {artifact.external_recipient}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    daysUntilShip <= 1 ? 'text-red-500' :
                    daysUntilShip <= 3 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {daysUntilShip}
                  </div>
                  <div className="text-xs text-gray-500">DAYS LEFT</div>
                </div>
              </div>

              {/* Scope Lock Indicator */}
              <div className="mb-4 p-3 bg-black border border-gray-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">SCOPE LOCK</span>
                  <span className={scopeUsage >= 90 ? 'text-red-500' : 'text-gray-400'}>
                    {artifact.current_word_count} / {artifact.max_word_count} words ({scopeUsage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2">
                  <div
                    className={`h-full ${
                      scopeUsage >= 90 ? 'bg-red-600' :
                      scopeUsage >= 70 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(Number(scopeUsage), 100)}%` }}
                  />
                </div>
              </div>

              {/* Definition of Done */}
              <div className="mb-4 p-3 bg-black border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">DEFINITION OF DONE (immutable):</div>
                <ul className="text-sm space-y-1">
                  {doneCriteriaList.map((item: string, i: number) => (
                    <li key={i} className="text-gray-300">• {item}</li>
                  ))}
                </ul>
              </div>

              {/* Edit Lock Warning */}
              {artifact.edit_locked === 1 && (
                <div className="mb-4 p-4 bg-red-900 border border-red-700 text-sm">
                  <strong>EDIT LOCK ACTIVE</strong> - No changes allowed. Ship or archive only.
                </div>
              )}

              {/* Block Timer */}
              <div className="mb-4">
                <BlockTimer
                  isRunning={!!block}
                  startTime={block?.start_time || null}
                  expectedDiffType={block?.expected_diff_type || ''}
                  onComplete={endBlock}
                />
              </div>

              {/* Block Start Buttons */}
              {!block && artifact.edit_locked === 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {['paragraph', 'section', 'slide', 'figure', 'commit'].map((type) => (
                    <button
                      key={type}
                      onClick={() => startBlock(type)}
                      className="bg-white text-black px-4 py-2 text-sm hover:bg-gray-200 uppercase"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {/* End Block Button */}
              {block && (
                <button
                  onClick={endBlock}
                  className="bg-red-600 text-white px-6 py-2 mb-4 hover:bg-red-700"
                >
                  END BLOCK NOW
                </button>
              )}

              {/* Editor */}
              <UglyDraftEditor
                content={content}
                onChange={setContent}
                uglyMode={true}
                isRTL={false}
              />

              {/* Actions */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {artifact.edit_locked === 0 && (
                  <button
                    onClick={markDone}
                    className="bg-yellow-600 text-black px-6 py-3 hover:bg-yellow-500 font-bold"
                  >
                    MARK DONE (TRIGGERS EDIT LOCK)
                  </button>
                )}

                {artifact.edit_locked === 1 && artifact.shipping_proof_submitted === 0 && (
                  <button
                    onClick={() => setShowProofForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 font-bold"
                  >
                    SUBMIT SHIPPING PROOF
                  </button>
                )}

                {artifact.shipping_proof_submitted === 1 && (
                  <button
                    onClick={shipArtifact}
                    className="bg-green-600 text-white px-6 py-3 hover:bg-green-700 font-bold"
                  >
                    SHIP NOW
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Shipping Proof Form */}
        {showProofForm && (
          <div className="border border-gray-700 p-6 mb-6 bg-gray-900">
            <h2 className="text-lg font-bold mb-4">External Reality Gate</h2>
            <p className="text-sm text-gray-400 mb-4">
              Provide proof that this artifact was sent to a real person or published publicly.
            </p>
            <input
              type="text"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full p-2 bg-black border border-gray-700 text-white mb-4"
              placeholder="URL, screenshot link, or email confirmation"
            />
            <div className="flex gap-2">
              <button
                onClick={submitProof}
                className="bg-white text-black px-6 py-2 hover:bg-gray-200"
              >
                SUBMIT PROOF
              </button>
              <button
                onClick={() => setShowProofForm(false)}
                className="bg-gray-800 px-6 py-2 hover:bg-gray-700"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Post-Ship Autopsy */}
        {showAutopsy && (
          <div className="border border-gray-700 p-6 mb-6 bg-gray-900">
            <h2 className="text-lg font-bold mb-4">Post-Ship Autopsy (5 yes/no questions)</h2>
            <p className="text-sm text-gray-400 mb-4">No narrative. No journaling. Just facts.</p>
            <div className="space-y-3">
              {[
                { key: 'shippedOnTime', label: '1. Shipped on time?' },
                { key: 'scopeRespected', label: '2. Scope respected?' },
                { key: 'externalFeedbackReceived', label: '3. External feedback received?' },
                { key: 'oneClearTakeaway', label: '4. One clear takeaway?' },
                { key: 'repeatArtifactClass', label: '5. Repeat same artifact class?' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={autopsyAnswers[key as keyof typeof autopsyAnswers]}
                    onChange={(e) => setAutopsyAnswers({ ...autopsyAnswers, [key]: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={submitAutopsy}
              className="mt-4 bg-white text-black px-6 py-2 hover:bg-gray-200"
            >
              SUBMIT AUTOPSY
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
