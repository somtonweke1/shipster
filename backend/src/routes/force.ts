import express from 'express';
import { ForceService } from '../services/forceService.js';
import { BlockService } from '../services/blockService.js';

export const router = express.Router();

// Get active artifact
router.get('/artifact/active', (req, res) => {
  try {
    const artifact = ForceService.getActiveArtifact();
    res.json(artifact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all artifacts (including archived)
router.get('/artifacts', (req, res) => {
  try {
    const artifacts = ForceService.getAllArtifacts();
    res.json(artifacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create artifact (auto-archives old one)
router.post('/artifact', (req, res) => {
  try {
    const { name, type, shipDays, doneCriteria, externalRecipient, maxWordCount } = req.body;
    const artifact = ForceService.createArtifact({
      name,
      type,
      shipDays,
      doneCriteria,
      externalRecipient,
      maxWordCount,
    });
    res.json(artifact);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update content (with scope lock enforcement)
router.put('/artifact/:id/content', (req, res) => {
  try {
    const { content } = req.body;
    ForceService.updateContent(req.params.id, content);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark done criteria as met (triggers edit lock)
router.post('/artifact/:id/done', (req, res) => {
  try {
    ForceService.markDoneCriteriaMet(req.params.id);
    res.json({ success: true, message: 'Edit lock activated. Ship or archive only.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Submit shipping proof (External Reality Gate)
router.post('/artifact/:id/proof', (req, res) => {
  try {
    const { proofUrl } = req.body;
    ForceService.submitShippingProof(req.params.id, proofUrl);
    res.json({ success: true, message: 'Shipping proof submitted. You may now ship.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Ship artifact (requires proof)
router.post('/artifact/:id/ship', (req, res) => {
  try {
    const artifact = ForceService.shipArtifact(req.params.id);
    res.json(artifact);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Post-ship autopsy
router.post('/artifact/:id/autopsy', (req, res) => {
  try {
    const autopsy = ForceService.createAutopsy(req.params.id, req.body);
    res.json(autopsy);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get autopsies
router.get('/autopsies/:artifactId?', (req, res) => {
  try {
    const autopsies = ForceService.getAutopsies(req.params.artifactId);
    res.json(autopsies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Log skipped block
router.post('/block/skip', (req, res) => {
  try {
    const { artifactId, scheduledTime, reason } = req.body;
    ForceService.logSkippedBlock(artifactId, scheduledTime, reason);
    res.json({ success: true, message: 'Failure logged permanently.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get skipped blocks (permanent failure log)
router.get('/blocks/skipped/:artifactId?', (req, res) => {
  try {
    const skipped = ForceService.getSkippedBlocks(req.params.artifactId);
    res.json(skipped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Block routes (from original implementation)
router.get('/block/running', (req, res) => {
  try {
    const block = BlockService.getRunningBlock();
    res.json(block);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/block/start', (req, res) => {
  try {
    const { artifactId, expectedDiffType, contentBefore } = req.body;
    const block = BlockService.startBlock(artifactId, expectedDiffType, contentBefore);
    res.json(block);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/block/:id/end', (req, res) => {
  try {
    const { contentAfter } = req.body;
    const block = BlockService.endBlock(req.params.id, contentAfter);
    res.json(block);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/blocks/history/:artifactId', (req, res) => {
  try {
    const history = BlockService.getBlockHistory(req.params.artifactId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blocks/stats/:artifactId', (req, res) => {
  try {
    const stats = BlockService.getBlockStats(req.params.artifactId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
