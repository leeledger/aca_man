import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// 파일 저장 경로 설정
const uploadDir = join(process.cwd(), 'public', 'uploads')
const businessLicenseDir = join(process.cwd(), 'public', 'business-licenses')

/**
 * 사업자 등록증 파일을 저장하고 URL을 반환하는 함수
 */
export async function saveBusinessLicense(file: File): Promise<string> {
  // 파일 확장자 확인
  const fileType = file.type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  
  if (!allowedTypes.includes(fileType)) {
    throw new Error('JPG, PNG, PDF 형식만 업로드 가능합니다.')
  }
  
  // 파일 크기 제한 (5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('파일 크기는 5MB 이하여야 합니다.')
  }
  
  // 파일 이름 생성 (고유 ID + 원본 확장자)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const fileExt = file.name.split('.').pop() || 'pdf'
  const fileName = `${uuidv4()}.${fileExt}`
  const filePath = join(businessLicenseDir, fileName)
  
  // 디렉토리가 없으면 생성
  const { mkdir } = require('fs/promises')
  try {
    await mkdir(businessLicenseDir, { recursive: true })
  } catch (error) {
    // 이미 존재하는 경우 무시
  }
  
  // 파일 저장
  await writeFile(filePath, buffer)
  
  // 클라이언트에서 접근 가능한 URL 반환
  const fileUrl = `/business-licenses/${fileName}`
  return fileUrl
}