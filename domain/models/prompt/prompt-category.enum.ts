/**
 * @file AIプロンプトのカテゴリを定義する Enum
 * @description プロンプトの目的や種類に応じて分類します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

/**
 * AIプロンプトのカテゴリを表す列挙型です。
 *
 * @enum {string}
 * @property {string} GENERAL - 一般的な対話や指示
 * @property {string} PLANNING - ビジネスプランニングに関するプロンプト
 * @property {string} ANALYSIS - 市場分析や競合分析に関するプロンプト
 * @property {string} WRITING - テキスト生成やコンテンツ作成に関するプロンプト
 * @property {string} CODING - コード生成や技術的な質問に関するプロンプト
 * @property {string} BRAINSTORMING - アイデア出しやブレインストーミング用
 *
 * @example
 * ```typescript
 * import { PromptCategory } from '@/domain/models/prompt/prompt-category.enum';
 *
 * const planningPrompt: PromptCategory = PromptCategory.PLANNING;
 * const writingPrompt: PromptCategory = PromptCategory.WRITING;
 *
 * function getPromptTemplate(category: PromptCategory) {
 *   switch (category) {
 *     case PromptCategory.PLANNING:
 *       return '事業計画を作成してください...';
 *     case PromptCategory.WRITING:
 *       return 'ブログ記事の草案を作成してください...';
 *     // ... 他のカテゴリ
 *     default:
 *       return '何かお手伝いできることはありますか？';
 *   }
 * }
 * ```
 */
export enum PromptCategory {
  GENERAL = 'GENERAL',
  PLANNING = 'PLANNING',
  ANALYSIS = 'ANALYSIS',
  WRITING = 'WRITING',
  CODING = 'CODING',
  BRAINSTORMING = 'BRAINSTORMING',
}
