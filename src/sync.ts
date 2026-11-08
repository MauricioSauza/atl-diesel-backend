import { parseArgs } from 'node:util';
import { loadWarehouseMap } from './inputs.js'
import { loadErpRows } from './inputs.js';
import { computeTargets } from './targets.js';

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    csv: { type: 'string', default: 'data/erp_export.csv' },
    map: { type: 'string', default: 'data/warehouse_map.json' },
  },
  strict: true,
});

const options = {
  dryRun: values['dry-run'],
  csvPath: values.csv,
  mapPath: values.map,
};

// Becomes async once the Shopify calls land.
function main(): void {
  console.info(`Starting inventory sync (${options.dryRun ? 'dry run' : 'apply'})`);
  console.info(`  ERP export:    ${options.csvPath}`);
  console.info(`  Warehouse map: ${options.mapPath}`);


  const warehouses = loadWarehouseMap(options.mapPath)
  const { valid } = loadErpRows(options.csvPath)

  // console.info("Result from json validation")
  // console.info(warehouses)
  // console.info("Result from csv validation")
  // console.info(valid)
  const result = computeTargets(valid, warehouses) 
  console.info(JSON.stringify(result, null, 2))
  // TODO: parse + validate inputs, compute targets, read Shopify, diff, apply, write report.
}

try {
  main();
} catch (error: unknown) {
  console.error('Sync failed:', error);
  process.exitCode = 1;
}
