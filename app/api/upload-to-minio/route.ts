// app/api/upload-to-minio/route.ts
import { NextRequest } from 'next/server';
import * as Minio from 'minio';

import { respData, respErr } from "@/lib/resp";




import { NextRequest } from 'next/server';

const minioClient = new Minio.Client({
  endPoint: '154.221.23.232',
  port: 9000,
  useSSL: false,
  accessKey: 'BtWJPmvyZuqv5mCcdLKg',
  secretKey: 'fQ15HXAEyxvJOZPuPOTH9AySwSSYsNkT6EVcHJEq',
});

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;
  const contentType = data.get('contentType') as string;

  if (!file) {
    return respErr("输入文件");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}_${file.name}`;
  await minioClient.putObject('ai-cover', fileName, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  return respData({ file_id: fileName });
}