import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/auth-options'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { logApiRequest, logApiError } from '@/lib/logger'
import sharp from 'sharp'

// 동적 라우트 설정 추가
export const dynamic = 'force-dynamic'

// 이미지 저장 경로 설정
const uploadDir = join(process.cwd(), 'public', 'uploads')

export async function POST(request: NextRequest) {
  logApiRequest(request, 'POST upload')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // 파일 확장자 확인
    const fileType = file.type
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // 파일 이름 생성 (고유 ID + 원본 확장자)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const fileExt = fileType.split('/')[1]
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = join(uploadDir, fileName)
    
    // 이미지 리사이징 및 압축
    let processedBuffer = buffer;
    
    // 모바일 화면에 적합한 크기로 리사이징 (최대 너비 1200px)
    // WebP 형식으로 변환하여 용량 감소
    if (fileExt !== 'gif') { // GIF는 애니메이션 유지를 위해 처리하지 않음
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
        // 이미지가 1200px보다 크면 리사이징
        if (metadata.width && metadata.width > 1200) {
          processedBuffer = await (image as sharp.Sharp)
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
        } else {
          // 크기는 유지하고 압축만 진행
          processedBuffer = await image
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
        }
      } catch (error) {
        console.error('Image processing error:', error);
        // 처리 실패 시 원본 이미지 사용
      }
    }
    
    // 파일 저장
    await writeFile(filePath, processedBuffer)
    
    // 클라이언트에서 접근 가능한 URL 반환
    const fileUrl = `/uploads/${fileName}`
    
    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    logApiError(request, error, { message: 'Failed to upload file' })
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}