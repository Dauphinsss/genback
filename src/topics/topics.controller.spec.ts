import { Test, TestingModule } from '@nestjs/testing';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TopicsController', () => {
  let controller: TopicsController;

  const mockService = {
    createTopic: jest.fn(),
    getAllTopics: jest.fn(),
    getTopicsByType: jest.fn(),
    getTopicById: jest.fn(),
    updateTopic: jest.fn(),
    deleteTopic: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [{ provide: TopicsService, useValue: mockService }],
    }).compile();

    controller = module.get<TopicsController>(TopicsController);
    jest.clearAllMocks();
  });

  it('create OK', async () => {
    const dto = { name: 'Test' };
    const expected = { id: 1, name: 'Test', type: 'content' };
    mockService.createTopic.mockResolvedValue(expected);
    const req = { user: { id: 9 } };

    const res = await controller.create(dto, req);
    expect(mockService.createTopic).toHaveBeenCalledWith(dto, 9);
    expect(res).toEqual(expected);
  });

  it('findAll sin filtro', async () => {
    mockService.getAllTopics.mockResolvedValue([]);
    const res = await controller.findAll();
    expect(mockService.getAllTopics).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('findAll con filtro', async () => {
    mockService.getTopicsByType.mockResolvedValue([{ id: 1 }]);
    const res = await controller.findAll('content');
    expect(mockService.getTopicsByType).toHaveBeenCalledWith('content');
    expect(res).toEqual([{ id: 1 }]);
  });

  it('findOne OK', async () => {
    mockService.getTopicById.mockResolvedValue({ id: 1 });
    const res = await controller.findOne(1);
    expect(mockService.getTopicById).toHaveBeenCalledWith(1);
    expect(res).toEqual({ id: 1 });
  });

  it('findOne NOT_FOUND', async () => {
    mockService.getTopicById.mockResolvedValue(null);
    await expect(controller.findOne(999)).rejects.toThrow(
      new HttpException('Topic not found', HttpStatus.NOT_FOUND),
    );
  });

  it('update OK', async () => {
    mockService.getTopicById.mockResolvedValue({ id: 1 });
    mockService.updateTopic.mockResolvedValue({ id: 1, name: 'Nuevo' });

    const req = { user: { id: 10 } };

    const res = await controller.update(1, { name: 'Nuevo' }, req);
    expect(mockService.updateTopic).toHaveBeenCalledWith(1, { name: 'Nuevo' }, 10);
    expect(res).toEqual({ id: 1, name: 'Nuevo' });
  });

  it('remove OK', async () => {
    mockService.getTopicById.mockResolvedValue({ id: 1 });
    mockService.deleteTopic.mockResolvedValue({ id: 1 });

    const req = { user: { id: 11 } };

    const res = await controller.remove(1, req);
    expect(mockService.deleteTopic).toHaveBeenCalledWith(1, 11);
    expect(res).toEqual({ id: 1 });
  });
});
