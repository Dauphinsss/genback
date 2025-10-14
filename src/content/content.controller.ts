import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContentService } from './content.service';
import { ResourceService } from './resource.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(
    private contentService: ContentService,
    private resourceService: ResourceService,
  ) {}

  @Post('topic/:topicId')
  async createContent(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() createContentDto: CreateContentDto,
  ) {
    try {
      return await this.contentService.createContent(topicId, createContentDto);
    } catch {
      throw new HttpException(
        'Error creating content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('topic/:topicId')
  async getContentByTopic(@Param('topicId', ParseIntPipe) topicId: number) {
    const content = await this.contentService.getContentByTopicId(topicId);
    if (!content) {
      throw new HttpException('Content no encontrado', HttpStatus.NOT_FOUND);
    }
    return content;
  }

  @Put(':contentId')
  async updateContent(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    try {
      return await this.contentService.updateContent(
        contentId,
        updateContentDto,
      );
    } catch {
      throw new HttpException(
        'Error updating content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':contentId')
  async deleteContent(@Param('contentId', ParseIntPipe) contentId: number) {
    try {
      return await this.contentService.deleteContent(contentId);
    } catch {
      throw new HttpException(
        'Error deleting content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getAllContents() {
    return await this.contentService.getAllContents();
  }

  // Endpoints para Resources
  @Post(':contentId/resource')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResource(
    @Param('contentId', ParseIntPipe) contentId: number,
    @UploadedFile() file: any,
  ) {
    try {
      if (!file) {
        throw new HttpException(
          'No se proporcionó archivo',
          HttpStatus.BAD_REQUEST,
        );
      }

      const resource = await this.resourceService.uploadResource(
        file,
        contentId,
      );

      return {
        success: true,
        message: 'Recurso subido correctamente',
        data: resource,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error uploading resource',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':contentId/resources')
  async getResourcesByContent(
    @Param('contentId', ParseIntPipe) contentId: number,
  ) {
    return await this.resourceService.getResourcesByContentId(contentId);
  }

  @Delete('resource/:resourceId')
  async deleteResource(@Param('resourceId', ParseIntPipe) resourceId: number) {
    try {
      return await this.resourceService.deleteResource(resourceId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error deleting resource',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
