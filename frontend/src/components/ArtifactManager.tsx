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
  status: string;
  version: number;
}

interface Block {
  id: string;
  artifact_id: string;
  expected_diff_type: string;
  start_time: number;
  status: string;
}

export const ArtifactManager: React.FC = () => {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [block, setBlock] = useState<Block | null>(null);
  const [content, setContent] = useState('');
  const [uglyMode, setUglyMode] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newArtifact, setNewArtifact] = useState({
    name: '',
    type: 'paper',
    shipDays: 7,
  });

  // Font and RTL settings
  const [fontFamily, setFontFamily] = useState('san-francisco');
  const [fontSize, setFontSize] = useState(17);
  const [isRTL, setIsRTL] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    const res = await fetch(`${API_BASE}/artifacts/active`);
    const data = await res.json();
    if (data && data.id) {
      setArtifact(data);
      setContent(data.content);
    } else {
      setArtifact(null);
    }
  };

  const fetchRunningBlock = async () => {
    const res = await fetch(`${API_BASE}/blocks/running`);
    const data = await res.json();
    setBlock(data && data.id ? data : null);
  };

  const createArtifact = async () => {
    try {
      const res = await fetch(`${API_BASE}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArtifact),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        return;
      }
      setShowCreateForm(false);
      fetchActiveArtifact();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const startBlock = async (diffType: string) => {
    if (!artifact) return;
    try {
      const res = await fetch(`${API_BASE}/blocks/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: artifact.id,
          expectedDiffType: diffType,
          contentBefore: content,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        return;
      }
      fetchRunningBlock();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const endBlock = async () => {
    if (!block) return;
    try {
      const res = await fetch(`${API_BASE}/blocks/${block.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentAfter: content }),
      });
      const result = await res.json();
      alert(result.status === 'completed' ? 'BLOCK COMPLETED: Diff detected!' : 'BLOCK FAILED: No meaningful diff detected.');
      fetchRunningBlock();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const saveContent = async () => {
    if (!artifact) return;
    await fetch(`${API_BASE}/artifacts/${artifact.id}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  };

  const shipArtifact = async () => {
    if (!artifact) return;
    if (!confirm('SHIP NOW? This will export and lock the artifact.')) return;
    try {
      const res = await fetch(`${API_BASE}/artifacts/${artifact.id}/ship`, {
        method: 'POST',
      });
      const result = await res.json();
      alert(result.status === 'shipped' ? 'SHIPPED ON TIME!' : 'SHIPPED LATE (failed)');
      fetchActiveArtifact();
    } catch (error: any) {
      alert(error.message);
    }
  };

  useEffect(() => {
    if (artifact) {
      const interval = setInterval(saveContent, 3000);
      return () => clearInterval(interval);
    }
  }, [content, artifact]);

  const daysUntilShip = artifact
    ? Math.ceil((artifact.ship_date - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold font-mono">SHIPSTER</h1>
          <p className="text-sm text-gray-600 font-mono">Execution governance for high-variance operators</p>
        </header>

        {!artifact && !showCreateForm && (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-4">No active artifact</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded font-mono hover:bg-blue-700"
            >
              CREATE ARTIFACT
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 font-mono">New Artifact</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Artifact name"
                value={newArtifact.name}
                onChange={(e) => setNewArtifact({ ...newArtifact, name: e.target.value })}
                className="w-full p-2 border-2 border-gray-300 rounded font-mono"
              />
              <select
                value={newArtifact.type}
                onChange={(e) => setNewArtifact({ ...newArtifact, type: e.target.value })}
                className="w-full p-2 border-2 border-gray-300 rounded font-mono"
              >
                <option value="paper">Paper</option>
                <option value="deck">Deck</option>
                <option value="code">Code</option>
                <option value="application">Application</option>
              </select>
              <div>
                <label className="block text-sm font-mono mb-1">Ship deadline (max 7 days)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={newArtifact.shipDays}
                  onChange={(e) => setNewArtifact({ ...newArtifact, shipDays: parseInt(e.target.value) })}
                  className="w-full p-2 border-2 border-gray-300 rounded font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createArtifact}
                  className="bg-green-600 text-white px-6 py-2 rounded font-mono hover:bg-green-700"
                >
                  CREATE
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 px-6 py-2 rounded font-mono hover:bg-gray-400"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {artifact && (
          <>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold font-mono">{artifact.name}</h2>
                  <div className="text-sm text-gray-600 font-mono mt-1">
                    Type: {artifact.type} | Version: {artifact.version}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold font-mono ${
                    daysUntilShip <= 1 ? 'text-red-600' :
                    daysUntilShip <= 3 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {daysUntilShip} DAYS
                  </div>
                  <div className="text-xs text-gray-500 font-mono">until ship</div>
                </div>
              </div>

              <div className="mb-4">
                <BlockTimer
                  isRunning={!!block}
                  startTime={block?.start_time || null}
                  expectedDiffType={block?.expected_diff_type || ''}
                  onComplete={endBlock}
                />
              </div>

              {!block && (
                <div className="flex gap-2 mb-4">
                  {['paragraph', 'section', 'slide', 'figure', 'commit'].map((type) => (
                    <button
                      key={type}
                      onClick={() => startBlock(type)}
                      className="bg-blue-600 text-white px-4 py-2 rounded font-mono text-sm hover:bg-blue-700 uppercase"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {block && (
                <button
                  onClick={endBlock}
                  className="bg-red-600 text-white px-6 py-2 rounded font-mono mb-4 hover:bg-red-700"
                >
                  END BLOCK NOW
                </button>
              )}

              <div className="mb-4 space-y-3">
                {/* Ugly Mode Toggle */}
                <label className="flex items-center gap-2 font-mono text-sm">
                  <input
                    type="checkbox"
                    checked={uglyMode}
                    onChange={(e) => setUglyMode(e.target.checked)}
                  />
                  UGLY DRAFT MODE (enforced constraints)
                </label>

                {/* Settings Toggle */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  {showSettings ? '▼' : '▶'} Font & Text Settings
                </button>

                {/* Settings Panel - Apple Notes style */}
                {showSettings && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
                    {/* Warning when ugly mode is on */}
                    {uglyMode && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm">
                        <p className="text-red-700 font-semibold mb-1">⚠️ Font controls disabled</p>
                        <p className="text-red-600 text-xs">
                          Turn off <strong>Ugly Draft Mode</strong> above to change font family and size.
                          RTL setting is always available.
                        </p>
                      </div>
                    )}

                    {/* RTL Toggle */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Right-to-Left (RTL)
                      </label>
                      <button
                        onClick={() => setIsRTL(!isRTL)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isRTL ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isRTL ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Family
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={uglyMode}
                      >
                        <option value="san-francisco">San Francisco (Default)</option>
                        <option value="new-york">New York (Serif)</option>
                        <option value="monaco">Monaco (Monospace)</option>
                        <option value="helvetica">Helvetica</option>
                      </select>
                      {uglyMode && (
                        <p className="text-xs text-red-600 font-medium mt-1">⚠️ Font locked to monospace in Ugly Mode</p>
                      )}
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size: <strong>{fontSize}px</strong>
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        disabled={uglyMode}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Small (12px)</span>
                        <span>Large (24px)</span>
                      </div>
                      {uglyMode && (
                        <p className="text-xs text-red-600 font-medium mt-1">⚠️ Font size locked to 16px in Ugly Mode</p>
                      )}
                    </div>

                    {/* Live Preview */}
                    {!uglyMode && (
                      <div className="bg-white rounded-lg p-4 border border-gray-300">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <p
                          style={{
                            fontFamily: fontFamily === 'san-francisco' ? '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' :
                                        fontFamily === 'new-york' ? '"New York", "Times New Roman", Georgia, serif' :
                                        fontFamily === 'monaco' ? 'Monaco, "Courier New", monospace' :
                                        'Helvetica, Arial, sans-serif',
                            fontSize: `${fontSize}px`,
                            lineHeight: '1.5',
                            direction: isRTL ? 'rtl' : 'ltr',
                          }}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          {isRTL ? 'هذا نص تجريبي' : 'The quick brown fox jumps over the lazy dog'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <UglyDraftEditor
                content={content}
                onChange={setContent}
                uglyMode={uglyMode}
                fontFamily={fontFamily}
                fontSize={fontSize}
                isRTL={isRTL}
              />

              <div className="mt-4 flex gap-2">
                <button
                  onClick={shipArtifact}
                  className="bg-green-600 text-white px-6 py-3 rounded font-mono font-bold hover:bg-green-700"
                >
                  SHIP NOW
                </button>
                <div className="text-xs text-gray-500 font-mono self-center">
                  Auto-saves every 3 seconds
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
