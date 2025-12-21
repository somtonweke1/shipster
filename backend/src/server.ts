import express from 'express';
import cors from 'cors';
import { router as forceRouter } from './routes/force.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/api', forceRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'FORCE operational', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  FORCE / v1 - Execution Kernel`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`═══════════════════════════════════════\n`);
  console.log('ENFORCEMENT ACTIVE:');
  console.log('  [✓] ONE active artifact (auto-archives old)');
  console.log('  [✓] Scope lock compiler (hard word limit)');
  console.log('  [✓] Edit lock after done criteria met');
  console.log('  [✓] 30-min mandatory execution blocks');
  console.log('  [✓] External Reality Gate (proof required)');
  console.log('  [✓] Post-ship autopsy (5 yes/no questions)');
  console.log('  [✓] Permanent failure log (skipped blocks)\n');
  console.log('No motivation. No choice. Force throughput.\n');
});
