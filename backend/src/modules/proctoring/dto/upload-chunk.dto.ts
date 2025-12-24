import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadChunkDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    sequence?: number;
}
