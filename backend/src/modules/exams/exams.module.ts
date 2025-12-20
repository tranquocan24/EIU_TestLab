import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { MarkdownParserService } from './markdown-parser.service';

@Module({
  controllers: [ExamsController],
  providers: [ExamsService, MarkdownParserService],
  exports: [ExamsService],
})
export class ExamsModule { }
