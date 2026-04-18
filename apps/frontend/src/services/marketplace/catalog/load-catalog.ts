import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Category, Product } from '@/types/marketplace';
import { assertProductCategoryRefs, assertUniqueIds, assertUniqueSlugs } from './catalog-integrity';
import {
  parseCatalogCategoriesJson,
  parseCatalogProductJson,
  type CatalogProductDraft,
} from './catalog-schema';
import { compileCatalogToProducts } from './compile-catalog';

export function getCatalogContentRoot(): string {
  return join(process.cwd(), 'content', 'catalog');
}

function readJsonFile(path: string): unknown {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    throw new Error(`Catalog: cannot read ${path}: ${e}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (e) {
    throw new Error(`Catalog: invalid JSON in ${path}: ${e}`);
  }
}

/**
 * Loads `content/catalog/categories.json` and every `content/catalog/products/*.json`.
 * Validates with Zod, checks referential integrity, compiles to domain types.
 */
export function loadCatalogFromDisk(): { categories: Category[]; products: Product[] } {
  const root = getCatalogContentRoot();
  const categoriesPath = join(root, 'categories.json');

  if (!existsSync(categoriesPath)) {
    throw new Error(
      `Catalog missing: ${categoriesPath}\n` +
        `Create content/catalog/categories.json (see repo example) to manage taxonomy.`
    );
  }

  const categoriesRaw = readJsonFile(categoriesPath);
  const categoryDrafts = parseCatalogCategoriesJson(categoriesRaw);
  assertUniqueSlugs(categoryDrafts, 'category');
  assertUniqueIds(categoryDrafts, 'category');

  const productsDir = join(root, 'products');
  if (!existsSync(productsDir)) {
    throw new Error(
      `Catalog missing: ${productsDir}\n` +
        `Add one JSON file per product under content/catalog/products/.`
    );
  }

  const productFilenames = readdirSync(productsDir)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  if (productFilenames.length === 0) {
    throw new Error(`Catalog: no *.json files in ${productsDir}`);
  }

  const productDrafts: CatalogProductDraft[] = [];
  for (const fn of productFilenames) {
    const path = join(productsDir, fn);
    const raw = readJsonFile(path);
    try {
      productDrafts.push(parseCatalogProductJson(raw));
    } catch (e) {
      throw new Error(`Catalog: invalid product file "${fn}": ${e}`);
    }
  }

  assertUniqueSlugs(productDrafts, 'product');
  assertUniqueIds(productDrafts, 'product');
  assertProductCategoryRefs(productDrafts, categoryDrafts);

  return compileCatalogToProducts(categoryDrafts, productDrafts);
}
