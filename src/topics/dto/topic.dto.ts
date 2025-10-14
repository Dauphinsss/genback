export class CreateTopicDto {
  name: string;
  type?: 'content' | 'evaluation';
}

export class UpdateTopicDto {
  name?: string;
  type?: 'content' | 'evaluation';
}