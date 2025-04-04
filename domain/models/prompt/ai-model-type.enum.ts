/**
 * @file 使用可能なAIモデルの種類を定義する Enum
 * @description AIサービスで利用する具体的なモデルを指定します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

/**
 * AIモデルの種類を表す列挙型です。
 *
 * @enum {string}
 * @property {string} GPT_4O - OpenAI GPT-4o モデル
 * @property {string} GPT_3_5_TURBO - OpenAI GPT-3.5 Turbo モデル
 * @property {string} GPT_O3_MINI - OpenAI GPT-o3-mini モデル
 * @property {string} CLAUDE_3_7_SONNET - Anthropic Claude 3.7 Sonnet モデル
 * @property {string} GEMINI_2_5_PRO - Google Gemini 2.5 Pro モデル
 * @property {string} OLLAMA_LOCAL - Ollama経由で実行されるローカルモデル (将来的に具体的なモデル名に置き換え可能性あり)
 *
 * @example
 * ```typescript
 * import { AIModelType } from '@/domain/models/prompt/ai-model-type.enum';
 *
 * const selectedModel: AIModelType = AIModelType.GPT_4O;
 *
 * function getAIResponse(modelType: AIModelType, prompt: string) {
 *   console.log(`Using model: ${modelType}`);
 *   // AIサービスを呼び出す処理...
 *
 * }
 * ```
 */
export enum AIModelType {
  Gpt4o = 'gpt-4o',
  Gpt35Turbo = 'gpt-3.5-turbo',
  GptO3Mini = 'gpt-o3-mini',
  Claude37Sonnet = 'claude-3.7-sonnet',
  Gemini25Pro = 'gemini-2.5-pro',
  OllamaLocal = 'ollama-local',
}
