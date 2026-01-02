/**
 * GitHub Repository Knowledge Service
 * Generates and manages comprehensive codebase understanding for AI context
 * Provides version history for restore points
 * 
 * ENHANCED: Now scans ALL component files, builds import relationships,
 * and generates intelligent summaries for deep AI understanding
 */

import { db } from "./db";
import { repoKnowledge, repoKnowledgeVersions } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
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
  componentMap: string;
  totalTokens: number;
}

interface ComponentInfo {
  path: string;
  exports: string[];
  imports: string[];
  importedBy: string[];
  uiElements: string[];
  apiCalls: string[];
  description: string;
}

const SCAN_DIRECTORIES = [
  'client/src/pages',
  'client/src/components',
  'client/src/hooks',
  'client/src/lib',
  'server',
  'shared',
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.replit',
  'attached_assets',
];

const PRIORITY_FILES = [
  'shared/schema.ts',
  'server/routes.ts',
  'client/src/App.tsx',
  'replit.md',
];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function generateRepoManifest(branch: string = 'main'): Promise<string> {
  try {
    const structure = await buildDirectoryTree('', branch, 0);
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
  if (depth > 5) return [];
  
  try {
    const contents = await github.listDirectory(path, branch);
    const items: FileStructure[] = [];
    
    for (const item of contents) {
      if (IGNORE_PATTERNS.includes(item.name)) continue;
      
      const structure: FileStructure = {
        name: item.name,
        path: item.path,
        type: item.type as 'file' | 'dir',
        size: item.size,
      };
      
      if (item.type === 'dir') {
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
    const prefix = item.type === 'dir' ? '[DIR]' : '[FILE]';
    result += `${indent}${prefix} ${item.name}\n`;
    
    if (item.children && item.children.length > 0) {
      result += formatManifest(item.children, indent + '  ');
    }
  }
  
  return result;
}

async function collectAllFiles(branch: string): Promise<string[]> {
  const allFiles: string[] = [];
  
  for (const dir of SCAN_DIRECTORIES) {
    try {
      const files = await collectFilesRecursive(dir, branch);
      allFiles.push(...files);
    } catch (error) {
      console.log(`Directory ${dir} not found or error: ${error}`);
    }
  }
  
  return allFiles;
}

async function collectFilesRecursive(path: string, branch: string, depth: number = 0): Promise<string[]> {
  if (depth > 4) return [];
  
  const files: string[] = [];
  
  try {
    const contents = await github.listDirectory(path, branch);
    
    for (const item of contents) {
      if (IGNORE_PATTERNS.includes(item.name)) continue;
      
      if (item.type === 'file' && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
        files.push(item.path);
      } else if (item.type === 'dir') {
        const subFiles = await collectFilesRecursive(item.path, branch, depth + 1);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.log(`Error collecting files from ${path}:`, error);
  }
  
  return files;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  
  const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  if (defaultExportMatch) {
    exports.push(defaultExportMatch[1]);
  }
  
  const namedExports = content.match(/export\s+(?:const|function|class|type|interface)\s+(\w+)/g);
  if (namedExports) {
    for (const exp of namedExports) {
      const name = exp.match(/export\s+(?:const|function|class|type|interface)\s+(\w+)/)?.[1];
      if (name) exports.push(name);
    }
  }
  
  return exports;
}

function extractUIElements(content: string): string[] {
  const elements: string[] = [];
  
  const componentNames = content.match(/<([A-Z][A-Za-z0-9]+)/g);
  if (componentNames) {
    const unique = Array.from(new Set(componentNames.map(c => c.slice(1))));
    elements.push(...unique.slice(0, 15));
  }
  
  const lucideIconLine = content.split('\n').find(line => line.includes('lucide-react') && line.includes('{'));
  const lucideIcons = lucideIconLine ? lucideIconLine.match(/{([^}]+)}/) : null;
  if (lucideIcons) {
    const icons = lucideIcons[1].split(',').map(i => i.trim()).filter(Boolean).slice(0, 5);
    if (icons.length > 0) {
      elements.push(`Icons: ${icons.join(', ')}`);
    }
  }
  
  return elements;
}

function extractAPICalls(content: string): string[] {
  const apiCalls: string[] = [];
  
  const queryKeys = content.match(/queryKey:\s*\[['"]([^'"]+)['"]/g);
  if (queryKeys) {
    for (const key of queryKeys) {
      const match = key.match(/queryKey:\s*\[['"]([^'"]+)['"]/);
      if (match) apiCalls.push(`GET ${match[1]}`);
    }
  }
  
  const mutations = content.match(/apiRequest\(['"]([^'"]+)['"],\s*['"](\w+)['"]/g);
  if (mutations) {
    for (const mut of mutations) {
      const match = mut.match(/apiRequest\(['"]([^'"]+)['"],\s*['"](\w+)['"]/);
      if (match) apiCalls.push(`${match[2].toUpperCase()} ${match[1]}`);
    }
  }
  
  return Array.from(new Set(apiCalls));
}

function generateComponentDescription(path: string, content: string, exports: string[], uiElements: string[], apiCalls: string[]): string {
  const lines = content.split('\n').length;
  const fileName = path.split('/').pop() || '';
  
  let description = `**${path}** (${lines} lines)\n`;
  
  if (path.includes('/pages/')) {
    description += `Page component: `;
    if (path.includes('dashboard')) description += 'Main dashboard with overview metrics and widgets. ';
    else if (path.includes('pipeline')) description += 'Job pipeline with Kanban board view. ';
    else if (path.includes('contacts')) description += 'Client/contact management. ';
    else if (path.includes('calendar')) description += 'Work scheduling calendar. ';
    else if (path.includes('finance')) description += 'Financial tracking and transactions. ';
    else if (path.includes('employees')) description += 'Employee management and payroll. ';
    else if (path.includes('seo')) description += 'SEO content generation tools. ';
    else if (path.includes('portal')) description += 'External user portal interface. ';
    else if (path.includes('ai-bridge')) description += 'AI coding assistant with GitHub integration. ';
    else description += `${exports[0] || fileName} page. `;
  } else if (path.includes('/components/')) {
    description += `UI Component: ${exports[0] || fileName}. `;
    
    if (fileName.toLowerCase().includes('weather')) {
      description += 'Weather display widget. ';
    }
    if (fileName.toLowerCase().includes('widget')) {
      description += 'Dashboard widget component. ';
    }
    if (fileName.toLowerCase().includes('form')) {
      description += 'Form component for data entry. ';
    }
    if (fileName.toLowerCase().includes('card')) {
      description += 'Card display component. ';
    }
    if (fileName.toLowerCase().includes('dialog') || fileName.toLowerCase().includes('modal')) {
      description += 'Modal/dialog component. ';
    }
  } else if (path.includes('/hooks/')) {
    description += `Custom hook: ${exports[0] || fileName}. `;
  } else if (path.includes('server/')) {
    if (path.includes('routes')) {
      const gets = (content.match(/app\.get\(/g) || []).length;
      const posts = (content.match(/app\.post\(/g) || []).length;
      const patches = (content.match(/app\.patch\(/g) || []).length;
      const deletes = (content.match(/app\.delete\(/g) || []).length;
      description += `API routes: ${gets} GET, ${posts} POST, ${patches} PATCH, ${deletes} DELETE. `;
    } else if (path.includes('github')) {
      description += 'GitHub API integration. ';
    } else if (path.includes('email')) {
      description += 'Email sending service. ';
    } else if (path.includes('storage')) {
      description += 'Data storage interface. ';
    } else if (path.includes('auth')) {
      description += 'Authentication logic. ';
    }
  } else if (path.includes('shared/schema')) {
    const tables = content.match(/export const \w+ = pgTable/g) || [];
    description += `Database schema: ${tables.length} tables. `;
  }
  
  if (exports.length > 0) {
    description += `\nExports: ${exports.slice(0, 5).join(', ')}${exports.length > 5 ? '...' : ''}`;
  }
  
  if (uiElements.length > 0) {
    description += `\nUI: ${uiElements.slice(0, 8).join(', ')}`;
  }
  
  if (apiCalls.length > 0) {
    description += `\nAPI: ${apiCalls.slice(0, 5).join(', ')}`;
  }
  
  return description;
}

export async function generateFileSummaries(branch: string = 'main'): Promise<void> {
  console.log('Generating comprehensive file summaries...');
  
  const allFiles = await collectAllFiles(branch);
  console.log(`Found ${allFiles.length} files to analyze`);
  
  const componentMap: Map<string, ComponentInfo> = new Map();
  
  for (const filePath of allFiles) {
    try {
      const { content } = await github.getFileContent(filePath, branch);
      
      const imports = extractImports(content);
      const exports = extractExports(content);
      const uiElements = extractUIElements(content);
      const apiCalls = extractAPICalls(content);
      const description = generateComponentDescription(filePath, content, exports, uiElements, apiCalls);
      
      componentMap.set(filePath, {
        path: filePath,
        exports,
        imports,
        importedBy: [],
        uiElements,
        apiCalls,
        description,
      });
      
      await db.delete(repoKnowledge)
        .where(and(
          eq(repoKnowledge.type, 'file_summary'),
          eq(repoKnowledge.key, filePath),
          eq(repoKnowledge.branch, branch)
        ));
      
      const priority = PRIORITY_FILES.includes(filePath) ? 90 : 
                       filePath.includes('/pages/') ? 85 :
                       filePath.includes('/components/') ? 80 :
                       filePath.includes('server/') ? 75 : 70;
      
      await db.insert(repoKnowledge).values({
        type: 'file_summary',
        key: filePath,
        content: description,
        branch,
        priority,
        tokenCount: estimateTokens(description),
        metadata: JSON.stringify({
          exports,
          imports: imports.filter(i => i.startsWith('.') || i.startsWith('@/')),
          uiElements: uiElements.slice(0, 10),
          apiCalls,
          lines: content.split('\n').length,
        }),
      });
    } catch (error) {
      console.log(`Skipping ${filePath}: ${error}`);
    }
  }
  
  await buildImportRelationships(componentMap, branch);
  
  console.log(`Generated summaries for ${componentMap.size} files`);
}

async function buildImportRelationships(componentMap: Map<string, ComponentInfo>, branch: string): Promise<void> {
  const allPaths = Array.from(componentMap.keys());
  
  for (const [filePath, info] of Array.from(componentMap.entries())) {
    for (const imp of info.imports) {
      let resolvedPath = '';
      
      if (imp.startsWith('@/')) {
        resolvedPath = 'client/src/' + imp.slice(2);
      } else if (imp.startsWith('./') || imp.startsWith('../')) {
        const dir = filePath.split('/').slice(0, -1).join('/');
        resolvedPath = resolvePath(dir, imp);
      }
      
      if (!resolvedPath) continue;
      
      let matchedPath = '';
      if (componentMap.has(resolvedPath)) {
        matchedPath = resolvedPath;
      } else if (componentMap.has(resolvedPath + '.tsx')) {
        matchedPath = resolvedPath + '.tsx';
      } else if (componentMap.has(resolvedPath + '.ts')) {
        matchedPath = resolvedPath + '.ts';
      } else if (componentMap.has(resolvedPath + '/index.tsx')) {
        matchedPath = resolvedPath + '/index.tsx';
      } else if (componentMap.has(resolvedPath + '/index.ts')) {
        matchedPath = resolvedPath + '/index.ts';
      } else {
        const baseName = resolvedPath.split('/').pop() || '';
        const foundPath = allPaths.find(p => p.endsWith('/' + baseName + '.tsx') || p.endsWith('/' + baseName + '.ts'));
        if (foundPath) {
          matchedPath = foundPath;
        }
      }
      
      if (matchedPath) {
        const importedComponent = componentMap.get(matchedPath);
        if (importedComponent && !importedComponent.importedBy.includes(filePath)) {
          importedComponent.importedBy.push(filePath);
        }
      }
    }
  }
  
  const relationshipData: string[] = [];
  for (const [filePath, info] of Array.from(componentMap.entries())) {
    if (info.importedBy.length > 0) {
      relationshipData.push(`${filePath} used by: ${info.importedBy.map((p: string) => p.split('/').pop()).join(', ')}`);
    }
  }
  
  if (relationshipData.length > 0) {
    const relationshipContent = relationshipData.join('\n');
    
    await db.delete(repoKnowledge)
      .where(and(
        eq(repoKnowledge.type, 'component_map'),
        eq(repoKnowledge.branch, branch)
      ));
    
    await db.insert(repoKnowledge).values({
      type: 'component_map',
      key: 'import_relationships',
      content: relationshipContent,
      branch,
      priority: 95,
      tokenCount: estimateTokens(relationshipContent),
    });
  }
}

function resolvePath(base: string, relative: string): string {
  const baseParts = base.split('/');
  const relativeParts = relative.split('/');
  
  for (const part of relativeParts) {
    if (part === '.') continue;
    if (part === '..') {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  
  return baseParts.join('/');
}

export async function generateFeatureChunks(branch: string = 'main'): Promise<void> {
  console.log('Generating dynamic feature chunks from codebase...');
  
  const knowledge = await db.select()
    .from(repoKnowledge)
    .where(and(
      eq(repoKnowledge.type, 'file_summary'),
      eq(repoKnowledge.branch, branch)
    ));
  
  const features: Record<string, string[]> = {
    dashboard: [],
    pipeline: [],
    contacts: [],
    calendar: [],
    finance: [],
    employees: [],
    seo: [],
    portals: [],
    'ai-tools': [],
    widgets: [],
    auth: [],
    api: [],
  };
  
  for (const item of knowledge) {
    const path = item.key.toLowerCase();
    const content = item.content;
    
    if (path.includes('dashboard')) features.dashboard.push(content);
    else if (path.includes('pipeline') || path.includes('job')) features.pipeline.push(content);
    else if (path.includes('contact')) features.contacts.push(content);
    else if (path.includes('calendar')) features.calendar.push(content);
    else if (path.includes('finance') || path.includes('transaction')) features.finance.push(content);
    else if (path.includes('employee') || path.includes('payroll')) features.employees.push(content);
    else if (path.includes('seo') || path.includes('content')) features.seo.push(content);
    else if (path.includes('portal')) features.portals.push(content);
    else if (path.includes('ai-bridge') || path.includes('github-knowledge') || path.includes('gemini')) features['ai-tools'].push(content);
    else if (path.includes('widget')) features.widgets.push(content);
    else if (path.includes('auth') || path.includes('login') || path.includes('session')) features.auth.push(content);
    else if (path.includes('routes') || path.includes('server/')) features.api.push(content);
  }
  
  for (const [feature, files] of Object.entries(features)) {
    if (files.length === 0) continue;
    
    const chunk = `## ${feature.charAt(0).toUpperCase() + feature.slice(1)} Feature\n${files.slice(0, 5).join('\n')}`;
    
    await db.delete(repoKnowledge)
      .where(and(
        eq(repoKnowledge.type, 'feature_chunk'),
        eq(repoKnowledge.key, feature),
        eq(repoKnowledge.branch, branch)
      ));
    
    await db.insert(repoKnowledge).values({
      type: 'feature_chunk',
      key: feature,
      content: chunk,
      branch,
      priority: 60,
      tokenCount: estimateTokens(chunk),
    });
  }
  
  console.log('Feature chunks generated from actual codebase');
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

export async function getKnowledgeContext(branch: string = 'main', maxTokens: number = 20000): Promise<KnowledgeContext> {
  const knowledge = await db.select()
    .from(repoKnowledge)
    .where(eq(repoKnowledge.branch, branch))
    .orderBy(desc(repoKnowledge.priority));
  
  let totalTokens = 0;
  const manifest = knowledge.find(k => k.type === 'manifest')?.content || '';
  totalTokens += estimateTokens(manifest);
  
  const componentMap = knowledge.find(k => k.type === 'component_map')?.content || '';
  totalTokens += estimateTokens(componentMap);
  
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
  
  return { manifest, fileSummaries, featureChunks, componentMap, totalTokens };
}

export async function buildAISystemPrompt(branch: string = 'main'): Promise<string> {
  const context = await getKnowledgeContext(branch);
  
  let systemPrompt = `You are an AI Co-Developer with DEEP knowledge of this codebase. You have full understanding of every file, component, and their relationships.

## Repository Structure
${context.manifest || 'Repository structure not yet indexed. Click "Refresh Knowledge" to scan the codebase.'}

## Component Relationships (What Uses What)
${context.componentMap || 'No component relationships indexed yet.'}

## Detailed File Summaries
${context.fileSummaries.length > 0 ? context.fileSummaries.join('\n\n') : 'No file summaries available yet.'}

## Feature Areas
${context.featureChunks.length > 0 ? context.featureChunks.join('\n\n') : 'No feature descriptions available yet.'}

## Your Capabilities
1. You know EXACTLY which files contain specific features, components, and widgets
2. You can identify which files need editing for any requested change
3. You understand import/export relationships between files
4. You know what UI components exist and where they are used
5. You can generate production-ready code for GitHub commits

## Response Guidelines
- When asked to modify a feature, immediately identify the correct file(s)
- Always specify the EXACT file path when suggesting code changes
- Reference specific UI components, widgets, or features by their file location
- Explain the import relationships if files need coordinated changes
- Never guess or ask the user to find files - you KNOW where everything is
- For removal tasks: identify ALL files where the component is imported/used

## IMPORTANT
If asked about a specific UI element (like a widget), search the file summaries above to find its exact location. Every component file has been indexed with its exports, imports, and purpose.`;

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
  const componentMap = knowledge.find(k => k.type === 'component_map');
  
  return {
    hasKnowledge: knowledge.length > 0,
    manifestUpdated: manifest?.lastUpdated,
    fileSummaryCount: fileSummaries.length,
    featureChunkCount: featureChunks.length,
    hasComponentMap: !!componentMap,
    totalTokens: knowledge.reduce((sum, k) => sum + (k.tokenCount || 0), 0),
    versionCount: versions.length,
    latestVersion: versions[0]?.versionNumber || 0,
  };
}

export async function searchKnowledge(query: string, branch: string = 'main'): Promise<string[]> {
  const knowledge = await db.select()
    .from(repoKnowledge)
    .where(eq(repoKnowledge.branch, branch));
  
  const queryLower = query.toLowerCase();
  const results: string[] = [];
  
  for (const item of knowledge) {
    if (item.content.toLowerCase().includes(queryLower) || 
        item.key.toLowerCase().includes(queryLower)) {
      results.push(`${item.key}: ${item.content.slice(0, 200)}...`);
    }
  }
  
  return results;
}
