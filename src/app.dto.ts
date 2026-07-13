import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppHelloResponseDto {
  @ApiProperty({ example: 'Hello World! santi, 1, 951364862' })
  message!: string;
}

export class AppHealthStatusInfoDto {
  @ApiProperty({ enum: ['up', 'weak', 'down'], example: 'up' })
  status!: 'up' | 'weak' | 'down';

  @ApiPropertyOptional({ example: 2.45 })
  latency?: number;

  @ApiPropertyOptional({ example: 'Connection failed' })
  error?: string;
}

export class AppHealthChecksDto {
  @ApiProperty({ type: AppHealthStatusInfoDto })
  database!: AppHealthStatusInfoDto;
}

export class AppHealthStatusDto {
  @ApiProperty({ enum: ['up', 'weak', 'down'], example: 'up' })
  status!: 'up' | 'weak' | 'down';

  @ApiProperty({ example: '2026-07-13T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ type: AppHealthChecksDto })
  checks!: AppHealthChecksDto;
}

export class AppHealthResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ type: AppHealthStatusDto })
  body!: AppHealthStatusDto;
}
