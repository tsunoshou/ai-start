/**
 * ファイルメタデータインターフェース
 */
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * アップロードオプションインターフェース
 */
export interface UploadOptions {
  /** ファイルのMIMEタイプ */
  contentType?: string;
  /** 公開アクセス可能かどうか */
  isPublic?: boolean;
  /** カスタムメタデータ */
  metadata?: Record<string, string>;
}

/**
 * ファイルストレージサービスのインターフェース
 * 
 * 異なるストレージプロバイダー（Vercel Blob、Supabase Storageなど）を
 * 抽象化し、統一されたインターフェースを提供します。
 */
export interface StorageService {
  /**
   * ファイルをアップロードする
   * @param file ファイルデータ（Buffer、ReadableStreamなど）
   * @param fileName ファイル名
   * @param options アップロードオプション
   * @returns ファイルメタデータ
   */
  uploadFile(file: Buffer | Blob | ReadableStream, fileName: string, options?: UploadOptions): Promise<FileMetadata>;
  
  /**
   * ファイルの公開URLを取得する
   * @param fileId ファイルID
   * @returns ファイルの公開URL
   */
  getFileUrl(fileId: string): Promise<string>;
  
  /**
   * ファイルをダウンロードする
   * @param fileId ファイルID
   * @returns ファイルデータ
   */
  downloadFile(fileId: string): Promise<Buffer>;
  
  /**
   * ファイルを削除する
   * @param fileId ファイルID
   */
  deleteFile(fileId: string): Promise<void>;
  
  /**
   * フォルダ内のファイル一覧を取得する
   * @param folderPath フォルダパス
   * @returns ファイルメタデータの配列
   */
  listFiles(folderPath: string): Promise<FileMetadata[]>;
} 