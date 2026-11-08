import { parseArgs } from 'node:util';
import { loadWarehouseMap, loadErpRows } from './inputs.js';
import { computeTargets } from './targets.js';
import { loadShopifyConfig, getAccessToken } from './shopify.js';
import { fetchCurrentStock } from './shopify-stock.js'
import { decisionStock } from './decision-stock.js'
import { applyUpdates } from './apply-updates.js'

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

async function main(): Promise<void> {
  console.info(`Starting inventory sync (${options.dryRun ? 'dry run' : 'apply'})`);
  console.info(`  ERP export:    ${options.csvPath}`);
  console.info(`  Warehouse map: ${options.mapPath}`);

  const warehouses = loadWarehouseMap(options.mapPath)
  const { valid, rejected } = loadErpRows(options.csvPath)

  const { targets, ignoredRows } = computeTargets(valid, warehouses)
  console.info(`  Rows: ${valid.length} valid, ${rejected.length} rejected, ${ignoredRows.length} ignored`)

  const config = loadShopifyConfig()
  const token = await getAccessToken(config)
  const skus = targets.map((target) => target.data.sku)
  const shopifyCurrentStock = await fetchCurrentStock(token, config, skus)
  const decisionFinalStock = decisionStock(targets, shopifyCurrentStock)
  if (options.dryRun) {
    console.info("Dry run: nothing written to Shopify")
  } else {
    const updated = await applyUpdates(token, config, decisionFinalStock)
    console.info(`Updated ${updated} quantities in Shopify`)
  }
  
}

main().catch((error: unknown) => {
  console.error('Sync failed:', error);
  process.exitCode = 1;
});
