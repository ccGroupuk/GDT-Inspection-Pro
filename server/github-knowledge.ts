/**
 * GitHub Repository Knowledge Service
 * Generates and manages codebase understanding for AI context
 * Provides version history for restore points
 */

import { db } from "./db";
import { repoKnowledge, repoKnowledgeVersions } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import * as github from "./github";

interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileStructure[];
}

interface KnowledgeContext {
  manifest: string;
  fileSummaries: string[];
  featureChunks: string[];
  totalTokens: number;
}

const CORNERSTONE_FILES = [
  'shared/schema.ts',
  'server/routes.ts',
  'client/src/App.tsx',
  'package.json',
  'replit.md',
];

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  'jobs': 'Job/Project Pipeline: 16-stage workflow tracking from new_enquiry to completed. Jobs link to contacts, trade partners, quotes, invoices, tasks, and notes. Key files: client/src/pages/pipeline.tsx, server/routes.ts (job endpoints).',
  'contacts': 'Client Management: Contact records with name, email, phone, address. Portal access tokens for client self-service. Key files: client/src/pages/contacts.tsx, shared/schema.ts (contacts table).',
  'partners': 'Trade Partner Management: Subcontractors with commission tracking, ratings, emergency availability. Partner portal for job visibility. Key files: client/src/pages/trade-partners.tsx.',
  'quotes': 'Quote Builder: Itemized quotes with line items, tax, discounts. Quote items stored separately. Client quote acceptance via portal. Key files: client/src/pages/job-detail.tsx (QuoteBuilder component).',
  'employees': 'Employee Management: Staff profiles with roles (owner/full_access/standard/limited/trainee), time tracking, payroll. Employee login with session cookies. Key files: client/src/pages/employees.tsx.',
  'calendar': 'Work Calendar: Weekly scheduling with color-coded team types. Event confirmation workflow. Key files: client/src/pages/calendar.tsx.',
  'seo': 'SEO Power House: AI-powered content generation for Google Business, Facebook, Instagram. Autopilot mode for automated posting schedules. Key files: client/src/pages/seo-powerhouse.tsx.',
  'finance': 'Financial Tracking: Income/expense transactions, cash flow forecasting, monthly overviews. Partner job financials. Key files: client/src/pages/finance.tsx.',
  'portals': 'External Portals: Client portal (job tracking, quote acceptance), Partner portal (assigned jobs, notes), Employee portal (time tracking). Token-based auth. Key files: client/src/pages/client-portal.tsx, partner-portal.tsx.',
  'ai-bridge': 'AI Bridge: Gemini-powered coding assistant with GitHub integration. Direct commits, file browsing, code editing. Key files: client/src/pages/ai-bridge.tsx, server/github.ts.',
  'auth': 'Authentication: Replit OAuth for admins, employee login with session cookies, token-based portal access. Rate limiting on login endpoints. Key files: server/replitAuth.ts, server/routes.ts (login endpoints).',
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function generateRepoManifest(branch: string = 'main'): Promise<string> {
  try {
    const structure = await buildDirectoryTree('', branch);
    const manifest = formatManifest(structure);
    
    await db.delete(repoKnowledge)
      .where(and(eq(repoKnowledge.type, 'manifest'), eq(repoKnowledge.branch, branch)));
    
    await db.insert(repoKnowledge).values({
      type: 'manifest',
      key: 'repo_structure',
      content: manifest,
      branch,
      priority: 100,
      tokenCount: estimateTokens(manifest),
    });
    
    return manifest;
  } catch (error) {
    console.error('Error generating repo manifest:', error);
    throw error;
  }
}

async function buildDirectoryTree(path: string, branch: string, depth: number = 0): Promise<FileStructure[]> {
  if (depth > 3) return [];
  
  try {
    const contents = await github.listDirectory(path, branch);
    const items: FileStructure[] = [];
    
    for (const item of contents) {
      const structure: FileStructure = {
        name: item.name,
        path: item.path,
        type: item.type as 'file' | 'dir',
        size: item.size,
      };
      
      if (item.type === 'dir' && !['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
        structure.children = await buildDirectoryTree(item.path, branch, depth + 1);
      }
      
      items.push(structure);
    }
    
    return items;
  } catch (error) {
    console.error(`Error building tree for ${path}:`, error);
    return [];
  }
}

function formatManifest(structure: FileStructure[], indent: string = ''): string {
  let result = '';
  
  for (const item of structure) {
    const icon = item.type === 'dir' ? '📁' : '📄';
    result += `${indent}${icon} ${item.name}\n`;
    
    if (item.children && item.children.length > 0) {
      result += formatManifest(item.children, indent + '  ');
    }
  }
  
  return result;
}

export async function generateFileSummaries(branch: string = 'main'): Promise<void> {
  for (const filePath of CORNERSTONE_FILES) {
    try {
      const { content } = await github.getFileContent(filePath, branch);
      const summary = summarizeFile(filePath, content);
      
      await db.delete(repoKnowledge)
        .where(and(
          eq(repoKnowledge.type, 'file_summary'),
          eq(repoKnowledge.key, filePath),
          eq(repoKnowledge.branch, branch)
        ));
      
      await db.insert(repoKnowledge).values({
        type: 'file_summary',
        key: filePath,
        content: summary,
        branch,
        priority: 80,
        tokenCount: estimateTokens(summary),
        metadata: JSON.stringify({ 
          originalSize: content.length,
          lines: content.split('\n').length 
        }),
      });
    } catch (error) {
      console.error(`Error summarizing ${filePath}:`, error);
    }
  }
}

function summarizeFile(path: string, content: string): string {
  const lines = content.split('\n');
  const lineCount = lines.length;
  
  if (path.endsWith('schema.ts')) {
    const tables = content.match(/export const \w+ = pgTable/g) || [];
    const types = content.match(/export type \w+/g) || [];
    return `**${path}** (${lineCount} lines)\nDatabase schema with ${tables.length} tables and ${types.length} types.\nTables: ${tables.map(t => t.match(/export const (\w+)/)?.[1]).join(', ')}`;
  }
  
  if (path.endsWith('routes.ts')) {
    const gets = (content.match(/app\.get\(/g) || []).length;
    const posts = (content.match(/app\.post\(/g) || []).length;
    const patches = (content.match(/app\.patch\(/g) || []).length;
    const deletes = (content.match(/app\.delete\(/g) || []).length;
    return `**${path}** (${lineCount} lines)\nExpress API routes: ${gets} GET, ${posts} POST, ${patches} PATCH, ${deletes} DELETE endpoints.`;
  }
  
  if (path.endsWith('App.tsx')) {
    const routes = content.match(/<Route.*?path="([^"]+)"/g) || [];
    const paths = routes.map(r => r.match(/path="([^"]+)"/)?.[1]).filter(Boolean);
    return `**${path}** (${lineCount} lines)\nMain React app with routes: ${paths.join(', ')}`;
  }
  
  if (path.endsWith('package.json')) {
    try {
      const pkg = JSON.parse(content);
      const deps = Object.keys(pkg.dependencies || {}).slice(0, 15);
      return `**${path}**\nProject: ${pkg.name}\nKey dependencies: ${deps.join(', ')}...`;
    } catch {
      return `**${path}** - Package configuration file`;
    }
  }
  
  if (path.endsWith('replit.md')) {
    const firstLines = lines.slice(0, 30).join('\n');
    return `**${path}** (${lineCount} lines)\nProject documentation:\n${firstLines}...`;
  }
  
  return `**${path}** (${lineCount} lines)\n${lines.slice(0, 10).join('\n')}...`;
}

export async function generateFeatureChunks(branch: string = 'main'): Promise<void> {
  for (const [feature, description] of Object.entries(FEATURE_DESCRIPTIONS)) {
    await db.delete(repoKnowledge)
      .where(and(
        eq(repoKnowledge.type, 'feature_chunk'),
        eq(repoKnowledge.key, feature),
        eq(repoKnowledge.branch, branch)
      ));
    
    await db.insert(repoKnowledge).values({
      type: 'feature_chunk',
      key: feature,
      content: description,
      branch,
      priority: 50,
      tokenCount: estimateTokens(description),
    });
  }
}

export async function refreshAllKnowledge(branch: string = 'main', commitSha?: string, commitMessage?: string): Promise<void> {
  console.log(`Refreshing all knowledge for branch: ${branch}`);
  
  const existingKnowledge = await db.select().from(repoKnowledge)
    .where(eq(repoKnowledge.branch, branch));
  
  if (existingKnowledge.length > 0) {
    await createVersionSnapshot(branch, commitSha, commitMessage);
  }
  
  await generateRepoManifest(branch);
  await generateFileSummaries(branch);
  await generateFeatureChunks(branch);
  
  console.log('Knowledge refresh complete');
}

export async function createVersionSnapshot(
  branch: string = 'main',
  commitSha?: string,
  commitMessage?: string,
  filesChanged?: string[]
): Promise<void> {
  const currentKnowledge = await db.select().from(repoKnowledge)
    .where(eq(repoKnowledge.branch, branch));
  
  const lastVersion = await db.select()
    .from(repoKnowledgeVersions)
    .where(eq(repoKnowledgeVersions.branch, branch))
    .orderBy(desc(repoKnowledgeVersions.versionNumber))
    .limit(1);
  
  const newVersionNumber = (lastVersion[0]?.versionNumber || 0) + 1;
  
  await db.insert(repoKnowledgeVersions).values({
    versionNumber: newVersionNumber,
    snapshot: JSON.stringify(currentKnowledge),
    commitSha,
    commitMessage,
    branch,
    filesChanged: filesChanged ? JSON.stringify(filesChanged) : null,
    description: `Version ${newVersionNumber}${commitMessage ? `: ${commitMessage}` : ''}`,
  });
  
  console.log(`Created version snapshot ${newVersionNumber} for branch ${branch}`);
}

export async function restoreVersion(versionId: string): Promise<void> {
  const version = await db.select().from(repoKnowledgeVersions)
    .where(eq(repoKnowledgeVersions.id, versionId))
    .limit(1);
  
  if (!version[0]) {
    throw new Error('Version not found');
  }
  
  const snapshot = JSON.parse(version[0].snapshot) as any[];
  const branch = version[0].branch || 'main';
  
  await db.delete(repoKnowledge)
    .where(eq(repoKnowledge.branch, branch));
  
  for (const item of snapshot) {
    await db.insert(repoKnowledge).values({
      type: item.type,
      key: item.key,
      content: item.content,
      metadata: item.metadata,
      branch: item.branch,
      priority: item.priority,
      tokenCount: item.tokenCount,
    });
  }
  
  console.log(`Restored knowledge to version ${version[0].versionNumber}`);
}

export async function getVersionHistory(branch: string = 'main', limit: number = 20) {
  return db.select()
    .from(repoKnowledgeVersions)
    .where(eq(repoKnowledgeVersions.branch, branch))
    .orderBy(desc(repoKnowledgeVersions.versionNumber))
    .limit(limit);
}

export async function getKnowledgeContext(branch: string = 'main', maxTokens: number = 12000): Promise<KnowledgeContext> {
  const knowledge = await db.select()
    .from(repoKnowledge)
    .where(eq(repoKnowledge.branch, branch))
    .orderBy(desc(repoKnowledge.priority));
  
  let totalTokens = 0;
  const manifest = knowledge.find(k => k.type === 'manifest')?.content || '';
  totalTokens += estimateTokens(manifest);
  
  const fileSummaries: string[] = [];
  const featureChunks: string[] = [];
  
  for (const item of knowledge) {
    if (totalTokens >= maxTokens) break;
    
    if (item.type === 'file_summary') {
      fileSummaries.push(item.content);
      totalTokens += item.tokenCount || estimateTokens(item.content);
    } else if (item.type === 'feature_chunk') {
      featureChunks.push(item.content);
      totalTokens += item.tokenCount || estimateTokens(item.content);
    }
  }
  
  return { manifest, fileSummaries, featureChunks, totalTokens };
}

export async function buildAISystemPrompt(branch: string = 'main'): Promise<string> {
  const context = await getKnowledgeContext(branch);
  
  let systemPrompt = `You are an AI Co-Developer assistant with deep knowledge of this codebase. You help with code editing, understanding, and GitHub commits.

## Repository Structure
${context.manifest || 'Repository structure not yet indexed. Click "Refresh Knowledge" to scan the codebase.'}

## Key File Summaries
${context.fileSummaries.length > 0 ? context.fileSummaries.join('\n\n') : 'No file summaries available yet.'}

## Feature Overview
${context.featureChunks.length > 0 ? context.featureChunks.join('\n\n') : 'No feature descriptions available yet.'}

## Your Capabilities
1. When the user shares file content, analyze it and suggest improvements
2. Generate code edits with clear explanations of what to change
3. Format code responses in markdown code blocks with the language specified
4. Reference specific files and line numbers when discussing changes
5. Suggest which files need to be modified for any requested feature
6. Your code can be committed directly to GitHub - provide production-ready code

## Response Guidelines
- Be concise but thorough
- Always specify the file path when suggesting code changes
- Use code blocks with syntax highlighting
- Explain WHY changes are needed, not just what to change
- If unsure which file to edit, explain the options`;

  return systemPrompt;
}

export async function getKnowledgeStats(branch: string = 'main') {
  const knowledge = await db.select().from(repoKnowledge)
    .where(eq(repoKnowledge.branch, branch));
  
  const versions = await db.select()
    .from(repoKnowledgeVersions)
    .where(eq(repoKnowledgeVersions.branch, branch));
  
  const manifest = knowledge.find(k => k.type === 'manifest');
  const fileSummaries = knowledge.filter(k => k.type === 'file_summary');
  const featureChunks = knowledge.filter(k => k.type === 'feature_chunk');
  
  return {
    hasKnowledge: knowledge.length > 0,
    manifestUpdated: manifest?.lastUpdated,
    fileSummaryCount: fileSummaries.length,
    featureChunkCount: featureChunks.length,
    totalTokens: knowledge.reduce((sum, k) => sum + (k.tokenCount || 0), 0),
    versionCount: versions.length,
    latestVersion: versions[0]?.versionNumber || 0,
  };
}
