import { Test, TestingModule } from '@nestjs/testing';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';

describe('TopicsController', () => {
  let controller: TopicsController;
  let service: TopicsService;

  const mockTopicsService = {
    createTopic: jest.fn(),
    getAllTopics: jest.fn(),
    getTopicById: jest.fn(),
    updateTopic: jest.fn(),
    deleteTopic: jest.fn(),
    getTopicsByType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [
        {
          provide: TopicsService,
          useValue: mockTopicsService,
        },
      ],
    }).compile();

    controller = module.get<TopicsController>(TopicsController);
    service = module.get<TopicsService>(TopicsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a topic successfully', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Test Topic',
      };

      const expectedTopic = {
        id: 1,
        name: 'Test Topic',
        type: 'content',
        createdAt: new Date(),
      };

      mockTopicsService.createTopic.mockResolvedValue(expectedTopic);

      const result = await controller.create(createTopicDto);

      expect(mockTopicsService.createTopic).toHaveBeenCalledWith(createTopicDto);
      expect(result).toEqual(expectedTopic);
    });

    it('should throw HttpException when creation fails', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Test Topic',
      };

      mockTopicsService.createTopic.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createTopicDto)).rejects.toThrow(
        new HttpException('Error creating topic', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('findAll', () => {
    it('should return all topics when no type filter', async () => {
      const expectedTopics = [
        {
          id: 1,
          name: 'Topic 1',
          type: 'content',
          createdAt: new Date(),
        },
      ];

      mockTopicsService.getAllTopics.mockResolvedValue(expectedTopics);

      const result = await controller.findAll();

      expect(mockTopicsService.getAllTopics).toHaveBeenCalled();
      expect(result).toEqual(expectedTopics);
    });

    it('should return filtered topics when type is provided', async () => {
      const expectedTopics = [
        {
          id: 1,
          name: 'Content Topic',
          type: 'content',
          createdAt: new Date(),
        },
      ];

      mockTopicsService.getTopicsByType.mockResolvedValue(expectedTopics);

      const result = await controller.findAll('content');

      expect(mockTopicsService.getTopicsByType).toHaveBeenCalledWith('content');
      expect(result).toEqual(expectedTopics);
    });

    it('should throw HttpException when fetch fails', async () => {
      mockTopicsService.getAllTopics.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow(
        new HttpException('Error fetching topics', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('findOne', () => {
    it('should return a topic by id', async () => {
      const topicId = 1;
      const expectedTopic = {
        id: 1,
        name: 'Topic 1',
        type: 'content',
        createdAt: new Date(),
      };

      mockTopicsService.getTopicById.mockResolvedValue(expectedTopic);

      const result = await controller.findOne(topicId);

      expect(mockTopicsService.getTopicById).toHaveBeenCalledWith(topicId);
      expect(result).toEqual(expectedTopic);
    });

    it('should throw NOT_FOUND when topic does not exist', async () => {
      const topicId = 999;
      mockTopicsService.getTopicById.mockResolvedValue(null);

      await expect(controller.findOne(topicId)).rejects.toThrow(
        new HttpException('Topic not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw HttpException when service fails', async () => {
      const topicId = 1;
      mockTopicsService.getTopicById.mockRejectedValue(new Error('Database error'));

      await expect(controller.findOne(topicId)).rejects.toThrow(
        new HttpException('Error fetching topic', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('update', () => {
    it('should update a topic successfully', async () => {
      const topicId = 1;
      const updateTopicDto: UpdateTopicDto = {
        name: 'Updated Topic',
      };

      const existingTopic = {
        id: 1,
        name: 'Original Topic',
        type: 'content',
        createdAt: new Date(),
      };

      const updatedTopic = {
        ...existingTopic,
        ...updateTopicDto,
      };

      mockTopicsService.getTopicById.mockResolvedValue(existingTopic);
      mockTopicsService.updateTopic.mockResolvedValue(updatedTopic);

      const result = await controller.update(topicId, updateTopicDto);

      expect(mockTopicsService.getTopicById).toHaveBeenCalledWith(topicId);
      expect(mockTopicsService.updateTopic).toHaveBeenCalledWith(topicId, updateTopicDto);
      expect(result).toEqual(updatedTopic);
    });

    it('should throw NOT_FOUND when topic does not exist', async () => {
      const topicId = 999;
      const updateTopicDto: UpdateTopicDto = {
        name: 'Updated Topic',
      };

      mockTopicsService.getTopicById.mockResolvedValue(null);

      await expect(controller.update(topicId, updateTopicDto)).rejects.toThrow(
        new HttpException('Topic not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('remove', () => {
    it('should delete a topic successfully', async () => {
      const topicId = 1;
      const existingTopic = {
        id: 1,
        name: 'Topic to Delete',
        type: 'content',
        createdAt: new Date(),
      };

      mockTopicsService.getTopicById.mockResolvedValue(existingTopic);
      mockTopicsService.deleteTopic.mockResolvedValue(existingTopic);

      const result = await controller.remove(topicId);

      expect(mockTopicsService.getTopicById).toHaveBeenCalledWith(topicId);
      expect(mockTopicsService.deleteTopic).toHaveBeenCalledWith(topicId);
      expect(result).toEqual(existingTopic);
    });

    it('should throw NOT_FOUND when topic does not exist', async () => {
      const topicId = 999;
      mockTopicsService.getTopicById.mockResolvedValue(null);

      await expect(controller.remove(topicId)).rejects.toThrow(
        new HttpException('Topic not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});
