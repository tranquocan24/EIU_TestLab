import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ImportMarkdownDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung markdown không được để trống' })
  @MinLength(10, { message: 'Nội dung markdown quá ngắn (tối thiểu 10 ký tự)' })
  markdownContent: string;
}
