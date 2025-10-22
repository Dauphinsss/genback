import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TopicsService } from './topics.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  /**
   * Crear un nuevo topic
   * POST /topics
   */
  @Post()
  async create(@Body() createTopicDto: CreateTopicDto) {
    try {
      return await this.topicsService.createTopic(createTopicDto);
    } catch {
      throw new HttpException(
        'Error creating topic',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener catálogo de topics disponibles (sin usar)
   * GET /topics/catalog/available
   */
  @Get('catalog/available')
  async getAvailableCatalog() {
    try {
      return await this.topicsService.getAvailableTopics();
    } catch {
      throw new HttpException(
        'Error fetching available topics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener todos los topics
   * GET /topics
   */
  @Get()
  async findAll(@Query('type') type?: string) {
    try {
      if (type) {
        return await this.topicsService.getTopicsByType(type);
      }
      return await this.topicsService.getAllTopics();
    } catch {
      throw new HttpException(
        'Error fetching topics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener un topic por ID
   * GET /topics/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const topic = await this.topicsService.getTopicById(id);
      if (!topic) {
        throw new HttpException('Topic not found', HttpStatus.NOT_FOUND);
      }
      return topic;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error fetching topic',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualizar un topic
   * PATCH /topics/:id
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    try {
      // Verificar que el topic existe
      const existingTopic = await this.topicsService.getTopicById(id);
      if (!existingTopic) {
        throw new HttpException('Topic not found', HttpStatus.NOT_FOUND);
      }

      return await this.topicsService.updateTopic(id, updateTopicDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error updating topic',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Eliminar un topic
   * DELETE /topics/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      // Verificar que el topic existe
      const existingTopic = await this.topicsService.getTopicById(id);
      if (!existingTopic) {
        throw new HttpException('Topic not found', HttpStatus.NOT_FOUND);
      }

      return await this.topicsService.deleteTopic(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error deleting topic',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
